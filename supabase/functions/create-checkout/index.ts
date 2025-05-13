
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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

  const requestId = crypto.randomUUID();
  logStep(`Requisição [${requestId}] iniciada`);

  try {
    // Verificar API key do Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep(`Requisição [${requestId}] - Erro: STRIPE_SECRET_KEY não configurada`);
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY não configurada no ambiente" }),
        { 
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logStep(`Requisição [${requestId}] - Erro: Variáveis de ambiente do Supabase não configuradas`);
      return new Response(
        JSON.stringify({ error: "Variáveis de ambiente do Supabase não configuradas" }),
        { 
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    // Verificar autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep(`Requisição [${requestId}] - Erro: Header de autorização ausente`);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { 
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep(`Requisição [${requestId}] - Erro de autenticação: ${userError?.message || 'Usuário não encontrado'}`);
      return new Response(
        JSON.stringify({ error: "Falha na autenticação: " + (userError?.message || "Usuário não encontrado") }),
        { 
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const user = userData.user;
    logStep(`Requisição [${requestId}] - Usuário autenticado: ${user.email}`);
    
    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verificar se o corpo da requisição é válido
    let requestBody;
    try {
      requestBody = await req.json();
      logStep(`Requisição [${requestId}] - Corpo da requisição analisado com sucesso`, requestBody);
    } catch (e) {
      logStep(`Requisição [${requestId}] - Erro ao analisar corpo da requisição: ${e instanceof Error ? e.message : String(e)}`);
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido" }),
        { 
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verificar se existe priceId no corpo da requisição
    const { priceId, tier, returnUrl } = requestBody;
    if (!priceId) {
      logStep(`Requisição [${requestId}] - Erro: priceId não fornecido`);
      return new Response(
        JSON.stringify({ error: "ID de preço não fornecido" }),
        { 
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verificar se o usuário já é cliente do Stripe
    logStep(`Requisição [${requestId}] - Verificando se o usuário já é cliente do Stripe`);
    const customers = await stripe.customers.list({ email: user.email });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep(`Requisição [${requestId}] - Cliente existente encontrado: ${customerId}`);
    } else {
      // Criar novo cliente
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = newCustomer.id;
      logStep(`Requisição [${requestId}] - Novo cliente criado: ${customerId}`);
    }
    
    // Criar sessão de checkout
    logStep(`Requisição [${requestId}] - Criando sessão de checkout`);
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: returnUrl || `${req.headers.get("origin") || "http://localhost:3000"}/subscription/success`,
        cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/subscription/cancel`,
        metadata: {
          user_id: user.id,
          tier: tier || 'basic',
        },
        allow_promotion_codes: true,
      });

      logStep(`Requisição [${requestId}] - Sessão de checkout criada com sucesso: ${session.id}`);
      
      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (stripeError) {
      logStep(`Requisição [${requestId}] - Erro ao criar sessão de checkout: ${stripeError.message}`);
      return new Response(
        JSON.stringify({ error: `Erro ao criar sessão de checkout: ${stripeError.message}` }),
        { 
          status: 200, // Alterado para 200 para melhor compatibilidade com CORS
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep(`Requisição [${requestId}] - Erro fatal: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 200, // Alterado para 200 para melhor compatibilidade com CORS
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
