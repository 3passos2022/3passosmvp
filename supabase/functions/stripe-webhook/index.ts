
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// This must be added to the edge function secrets
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

// Helper para logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Configure CORS headers (not typically needed for webhooks, but included for completeness)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook recebido");

    // Inicializa o cliente Supabase com a chave de serviço para operações administrativas
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Inicializa o Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Assinatura Stripe não encontrada no cabeçalho");
    }

    // Get the raw body
    const body = await req.text();

    // Construct the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep(`Evento verificado: ${event.type}`);
    } catch (err: any) {
      logStep(`Erro na verificação da assinatura: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event based on the type
    switch (event.type) {
      // Subscription lifecycle events
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processando evento de assinatura", { subscription_id: subscription.id });

        // Get the customer ID
        const customerId = subscription.customer as string;
        // Find the customer details
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          throw new Error("Cliente não encontrado ou excluído");
        }

        // Get the customer email to identify the user
        const customerEmail = customer.email;
        if (!customerEmail) {
          throw new Error("Email do cliente não encontrado");
        }

        // Determine subscription tier based on price
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        let subscriptionTier = 'free';
        if (amount >= 2500) {
          subscriptionTier = 'premium';
        } else if (amount >= 1500) {
          subscriptionTier = 'basic';
        }
        
        // Get subscription status and trial end
        const status = subscription.status;
        const isActive = ['active', 'trialing'].includes(status);
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Check if invoice is available
        let lastInvoiceUrl = null;
        let nextInvoiceAmount = null;
        
        if (subscription.latest_invoice) {
          try {
            const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
            if (invoice) {
              lastInvoiceUrl = invoice.hosted_invoice_url || null;
              // Next invoice amount (in the smallest currency unit, e.g. cents)
              nextInvoiceAmount = invoice.amount_due || null;
            }
          } catch (err) {
            logStep("Erro ao buscar fatura", { error: err });
            // Continue processing even if invoice retrieval fails
          }
        }
        
        // Update subscriber record in Supabase
        const { data: userData, error: userError } = await supabaseClient
          .from("subscribers")
          .upsert({
            email: customerEmail,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscribed: isActive,
            subscription_status: status,
            subscription_tier: isActive ? subscriptionTier : 'free',
            subscription_end: periodEnd,
            trial_end: trialEnd,
            is_trial_used: !!trialEnd,
            last_invoice_url: lastInvoiceUrl,
            next_invoice_amount: nextInvoiceAmount,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });
        
        if (userError) {
          throw new Error(`Erro ao atualizar assinatura: ${userError.message}`);
        }
        
        // Add notification for the user
        if (isActive) {
          // Get the user_id based on email
          const { data: userIdData, error: userIdError } = await supabaseClient
            .from("subscribers")
            .select("user_id")
            .eq("email", customerEmail)
            .maybeSingle();
            
          if (!userIdError && userIdData && userIdData.user_id) {
            let notificationTitle = '';
            let notificationMessage = '';
            
            if (status === 'trialing') {
              notificationTitle = 'Período de teste iniciado!';
              notificationMessage = `Seu período de teste do plano ${subscriptionTier === 'premium' ? 'Premium' : 'Básico'} foi iniciado. Aproveite todos os recursos até ${new Date(trialEnd || '').toLocaleDateString('pt-BR')}.`;
            } else if (status === 'active') {
              notificationTitle = 'Assinatura ativada!';
              notificationMessage = `Sua assinatura do plano ${subscriptionTier === 'premium' ? 'Premium' : 'Básico'} está ativa! Próxima cobrança em ${new Date(periodEnd).toLocaleDateString('pt-BR')}.`;
            }
            
            if (notificationTitle && notificationMessage) {
              await supabaseClient.rpc('add_user_notification', {
                p_user_id: userIdData.user_id,
                p_type: 'subscription',
                p_title: notificationTitle,
                p_message: notificationMessage
              });
            }
          }
        }
        
        logStep("Assinatura atualizada com sucesso", { email: customerEmail, status });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processando cancelamento de assinatura", { subscription_id: subscription.id });

        // Get the customer ID
        const customerId = subscription.customer as string;
        // Find the customer details
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          throw new Error("Cliente não encontrado ou excluído");
        }
        
        // Get the customer email to identify the user
        const customerEmail = customer.email;
        if (!customerEmail) {
          throw new Error("Email do cliente não encontrado");
        }
        
        // Update subscriber record to remove subscription
        const { data: userData, error: userError } = await supabaseClient
          .from("subscribers")
          .upsert({
            email: customerEmail,
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            subscribed: false,
            subscription_status: 'canceled',
            subscription_tier: 'free',
            subscription_end: null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });
        
        if (userError) {
          throw new Error(`Erro ao atualizar cancelamento: ${userError.message}`);
        }
        
        // Add notification for the user
        const { data: userIdData, error: userIdError } = await supabaseClient
          .from("subscribers")
          .select("user_id")
          .eq("email", customerEmail)
          .maybeSingle();
          
        if (!userIdError && userIdData && userIdData.user_id) {
          await supabaseClient.rpc('add_user_notification', {
            p_user_id: userIdData.user_id,
            p_type: 'subscription',
            p_title: 'Assinatura cancelada',
            p_message: 'Sua assinatura foi cancelada. Você agora está utilizando o plano gratuito.'
          });
        }
        
        logStep("Cancelamento processado com sucesso", { email: customerEmail });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processando falha no pagamento", { invoice_id: invoice.id });

        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          throw new Error("Cliente não encontrado ou excluído");
        }

        const customerEmail = customer.email;
        if (!customerEmail) {
          throw new Error("Email do cliente não encontrado");
        }

        // Update subscription status
        const { data: subData, error: subError } = await supabaseClient
          .from("subscribers")
          .upsert({
            email: customerEmail,
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });
          
        if (subError) {
          throw new Error(`Erro ao atualizar status de falha: ${subError.message}`);
        }

        // Add notification for payment failure
        const { data: userIdData, error: userIdError } = await supabaseClient
          .from("subscribers")
          .select("user_id")
          .eq("email", customerEmail)
          .maybeSingle();
          
        if (!userIdError && userIdData && userIdData.user_id) {
          await supabaseClient.rpc('add_user_notification', {
            p_user_id: userIdData.user_id,
            p_type: 'payment_failed',
            p_title: 'Falha no pagamento',
            p_message: 'Houve uma falha no processamento do seu pagamento. Por favor, verifique sua forma de pagamento na página de assinatura.'
          });
        }
        
        logStep("Notificação de falha enviada", { email: customerEmail });
        break;
      }
      
      // Add other event types as needed
      default: {
        logStep(`Evento não processado: ${event.type}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep(`Erro: ${errorMessage}`);

    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
