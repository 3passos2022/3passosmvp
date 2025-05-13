
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Enhanced CORS headers for better compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, sec-fetch-dest, sec-fetch-mode, sec-fetch-site",
  "Access-Control-Max-Age": "86400", // 24 hours to reduce preflight requests
  "Access-Control-Allow-Credentials": "true",
};

// Helper para logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    logStep("OPTIONS request recebida");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }
  
  // Log request details
  const url = new URL(req.url);
  logStep(`Requisição recebida: ${req.method} ${url.pathname}`);
  logStep("Request headers", Object.fromEntries(req.headers));

  try {
    logStep("Função iniciada");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Erro: STRIPE_SECRET_KEY não configurada");
      return new Response(
        JSON.stringify({ 
          error: "STRIPE_SECRET_KEY não configurada no ambiente",
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    logStep("STRIPE_SECRET_KEY verificada");

    // Inicializa o cliente Supabase com a chave de serviço para operações administrativas
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("Erro: Variáveis de ambiente do Supabase não configuradas");
      return new Response(
        JSON.stringify({ 
          error: "Variáveis de ambiente do Supabase não configuradas",
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // Verifica a autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Erro: Header de autorização ausente");
      return new Response(
        JSON.stringify({ 
          error: "Usuário não autenticado",
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Token extraído do header");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Erro de autenticação", { error: userError?.message });
      return new Response(
        JSON.stringify({ 
          error: "Falha na autenticação: " + (userError?.message || "Usuário não encontrado"),
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user = userData.user;
    logStep("Usuário autenticado", { id: user.id, email: user.email });

    // Inicializa o Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    try {
      // Verifica se o cliente já existe no Stripe
      logStep("Buscando cliente no Stripe para o e-mail", { email: user.email });
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
          subscription_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });
        
        logStep("Resposta enviada - usuário sem cliente Stripe");
        return new Response(
          JSON.stringify({ 
            subscribed: false,
            subscription_tier: "free",
            subscription_end: null
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
      logStep("Buscando assinaturas ativas para o cliente", { customerId });
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      const hasActiveSub = subscriptions.data.length > 0;
      let subscriptionTier = "free";
      let subscriptionEnd = null;

      if (hasActiveSub) {
        const subscription = subscriptions.data[0];
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Assinatura ativa encontrada", { subscriptionId: subscription.id, endDate: subscriptionEnd });
        
        // Determina o tier da assinatura com base no preço
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        
        if (amount >= 2000) {
          subscriptionTier = "premium";
        } else if (amount >= 1000) {
          subscriptionTier = "basic";
        } else {
          subscriptionTier = "free";
        }
        
        logStep("Tier de assinatura determinado", { priceId, amount, subscriptionTier });
      } else {
        logStep("Nenhuma assinatura ativa encontrada");
      }

      // Atualiza o registro no banco de dados
      logStep("Atualizando registro na tabela subscribers");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: hasActiveSub ? subscriptionTier : "free",
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" });

      logStep("Banco de dados atualizado com informações de assinatura", { subscribed: hasActiveSub, subscriptionTier });
      
      // Construir resposta
      const responseData = {
        subscribed: hasActiveSub,
        subscription_tier: hasActiveSub ? subscriptionTier : "free",
        subscription_end: subscriptionEnd
      };
      
      logStep("Resposta enviada com sucesso", responseData);
      return new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (stripeError) {
      logStep("Erro ao se comunicar com o Stripe", { error: stripeError.message });
      
      return new Response(
        JSON.stringify({ 
          error: `Erro ao verificar assinatura: ${stripeError.message}`,
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null
        }),
        {
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Erro", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        subscribed: false,
        subscription_tier: "free",
        subscription_end: null
      }),
      {
        status: 200, // Alterado para 200 para melhor compatibilidade com CORS
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
