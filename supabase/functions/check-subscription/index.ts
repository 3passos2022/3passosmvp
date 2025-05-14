
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper para logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Função iniciada");

    // Inicializa o cliente Supabase com a chave de serviço para operações administrativas
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verifica a autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Usuário não autenticado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Falha na autenticação: " + (userError?.message || "Usuário não encontrado"));
    }

    const user = userData.user;
    logStep("Usuário autenticado", { id: user.id, email: user.email });

    // Inicializa o Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verifica se o cliente já existe no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("Nenhum cliente Stripe encontrado, atualizando estado de não assinante");
      
      // Garante que o usuário está marcado como não assinante
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: "free",
        subscription_status: "free",
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" });
      
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          subscription_tier: "free",
          subscription_status: "free",
          subscription_end: null,
          trial_end: null,
          is_trial_used: false,
          last_invoice_url: null,
          next_invoice_amount: null
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Cliente Stripe encontrado", { customerId });

    // Busca assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    // Também verifica assinaturas em período de teste (que não são retornadas como 'active')
    const trialSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });
    
    // Combina as assinaturas ativas e em período de teste
    const allSubscriptions = [...subscriptions.data, ...trialSubscriptions.data];
    const hasActiveSub = allSubscriptions.length > 0;
    
    let subscriptionTier = "free";
    let subscriptionEnd = null;
    let subscriptionStatus = "free";
    let trialEnd = null;
    let isTrialUsed = false;
    let stripeSubscriptionId = null;
    let lastInvoiceUrl = null;
    let nextInvoiceAmount = null;

    if (hasActiveSub) {
      const subscription = allSubscriptions[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionStatus = subscription.status;
      
      // Verifica se está em período de teste
      if (subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
        isTrialUsed = true;
      }
      
      logStep("Assinatura ativa encontrada", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionEnd,
        trialEnd
      });
      
      // Determina o tier da assinatura com base no preço
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount >= 7000) {
        subscriptionTier = "premium";
      } else if (amount >= 3000) {
        subscriptionTier = "basic";
      } else {
        subscriptionTier = "free";
      }
      
      // Verifica informações da última fatura, se disponível
      if (subscription.latest_invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
          if (invoice) {
            lastInvoiceUrl = invoice.hosted_invoice_url;
            nextInvoiceAmount = invoice.amount_due;
          }
        } catch (error) {
          logStep("Erro ao buscar fatura", { error });
        }
      }
      
      logStep("Tier de assinatura determinado", { 
        priceId, 
        amount, 
        subscriptionTier,
        subscriptionStatus
      });
    } else {
      logStep("Nenhuma assinatura ativa encontrada");
    }

    // Atualiza o registro no banco de dados
    const { error: upsertError } = await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscribed: hasActiveSub,
      subscription_tier: hasActiveSub ? subscriptionTier : "free",
      subscription_status: hasActiveSub ? subscriptionStatus : "free",
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
      is_trial_used: isTrialUsed,
      last_invoice_url: lastInvoiceUrl,
      next_invoice_amount: nextInvoiceAmount,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (upsertError) {
      throw new Error(`Erro ao atualizar dados de assinatura: ${upsertError.message}`);
    }

    logStep("Banco de dados atualizado com informações de assinatura", { 
      subscribed: hasActiveSub, 
      subscriptionTier,
      subscriptionStatus
    });
    
    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        subscription_tier: hasActiveSub ? subscriptionTier : "free",
        subscription_status: hasActiveSub ? subscriptionStatus : "free",
        subscription_end: subscriptionEnd,
        trial_end: trialEnd,
        is_trial_used: isTrialUsed,
        stripe_subscription_id: stripeSubscriptionId,
        last_invoice_url: lastInvoiceUrl,
        next_invoice_amount: nextInvoiceAmount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Erro", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
