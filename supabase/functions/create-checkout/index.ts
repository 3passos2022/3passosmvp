
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  
  // Log request details
  const url = new URL(req.url);
  logStep(`Requisição recebida: ${req.method} ${url.pathname}`);
  logStep("Request headers", Object.fromEntries(req.headers));

  try {
    logStep("Função iniciada");

    // Validar a existência da chave do Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Erro: STRIPE_SECRET_KEY não configurada");
      throw new Error("STRIPE_SECRET_KEY não configurada no ambiente");
    }
    logStep("STRIPE_SECRET_KEY verificada");

    // Obtém os parâmetros do corpo da requisição
    let requestBody;
    try {
      requestBody = await req.json();
      logStep("Corpo da requisição", requestBody);
    } catch (e) {
      logStep("Erro ao fazer parse do corpo da requisição", { error: e.message });
      throw new Error("Formato de requisição inválido");
    }
    
    const { tier = "basic", priceId, returnUrl } = requestBody;
    logStep("Parâmetros recebidos", { tier, priceId, returnUrl });

    if (!priceId) {
      logStep("Erro: ID de preço não fornecido");
      throw new Error("ID de preço não fornecido");
    }

    // Inicializa o cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logStep("Erro: Variáveis de ambiente do Supabase não configuradas");
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    // Verifica a autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Erro: Header de autorização ausente");
      throw new Error("Usuário não autenticado");
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Token extraído do header");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Erro de autenticação", { error: userError?.message });
      throw new Error("Falha na autenticação: " + (userError?.message || "Usuário não encontrado"));
    }

    const user = userData.user;
    logStep("Usuário autenticado", { id: user.id, email: user.email });

    // Inicializa o Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Verifica se o cliente já existe no Stripe
    logStep("Buscando cliente no Stripe para o e-mail", { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined = undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Cliente Stripe existente encontrado", { customerId });
    } else {
      // Se não existir, criar um novo cliente
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        metadata: {
          user_id: user.id
        }
      });
      customerId = newCustomer.id;
      logStep("Novo cliente Stripe criado", { customerId });
    }

    // Cria a sessão de checkout usando o priceId fornecido
    const origin = new URL(req.url).origin;
    const baseUrl = returnUrl ? new URL(returnUrl).origin : origin;
    const success_url = returnUrl || `${baseUrl}/subscription/success?tier=${tier}`;
    const cancel_url = `${baseUrl}/subscription/cancel`;

    logStep("Criando sessão de checkout", { 
      priceId, 
      customerId, 
      success_url, 
      cancel_url,
      baseUrl,
      origin
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url,
      cancel_url,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
      allow_promotion_codes: true,
    });

    logStep("Sessão de checkout criada", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
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
