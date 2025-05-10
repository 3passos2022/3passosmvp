
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
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    logStep("OPTIONS request recebida");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  // Create a unique request ID for tracing
  const requestId = crypto.randomUUID();
  
  // Log request details
  const url = new URL(req.url);
  logStep(`Nova requisição [${requestId}]`, { 
    method: req.method, 
    pathname: url.pathname,
    headers: Object.fromEntries(req.headers)
  });

  try {
    logStep(`Requisição [${requestId}] - Função iniciada`);

    // Validar chave do Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep(`Requisição [${requestId}] - Erro: STRIPE_SECRET_KEY não configurada`);
      throw new Error("STRIPE_SECRET_KEY não configurada no ambiente");
    }
    logStep(`Requisição [${requestId}] - STRIPE_SECRET_KEY verificada`);

    // Inicializa o cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logStep(`Requisição [${requestId}] - Erro: Variáveis de ambiente do Supabase não configuradas`);
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    // Verifica a autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep(`Requisição [${requestId}] - Erro: Header de autorização ausente`);
      throw new Error("Usuário não autenticado");
    }

    const token = authHeader.replace("Bearer ", "");
    logStep(`Requisição [${requestId}] - Token extraído do header`);
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep(`Requisição [${requestId}] - Erro de autenticação`, { error: userError?.message });
      throw new Error("Falha na autenticação: " + (userError?.message || "Usuário não encontrado"));
    }

    const user = userData.user;
    logStep(`Requisição [${requestId}] - Usuário autenticado`, { id: user.id, email: user.email });

    // Inicializa o Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Verificar conexão com o Stripe
    try {
      logStep(`Requisição [${requestId}] - Verificando conexão com o Stripe`);
      await stripe.balance.retrieve();
      logStep(`Requisição [${requestId}] - Conexão com Stripe confirmada`);
    } catch (stripeConnectionError) {
      logStep(`Requisição [${requestId}] - Erro de conexão com Stripe`, { 
        error: stripeConnectionError.message 
      });
      throw new Error(`Não foi possível conectar ao Stripe: ${stripeConnectionError.message}`);
    }

    // Buscar cliente do Stripe pelo email
    logStep(`Requisição [${requestId}] - Buscando cliente no Stripe para o e-mail`, { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep(`Requisição [${requestId}] - Cliente não encontrado no Stripe`);
      throw new Error("Nenhuma assinatura encontrada para este usuário");
    }

    const customerId = customers.data[0].id;
    logStep(`Requisição [${requestId}] - Cliente Stripe encontrado`, { customerId });

    // Cria sessão do portal do cliente
    let returnUrl;
    try {
      const body = await req.json();
      returnUrl = body.url;
      logStep(`Requisição [${requestId}] - URL de retorno fornecida`, { returnUrl });
    } catch (e) {
      logStep(`Requisição [${requestId}] - Nenhum corpo de requisição ou URL de retorno fornecida`);
    }
    
    const finalReturnUrl = returnUrl || new URL(req.url).origin;
    
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: finalReturnUrl,
      });

      logStep(`Requisição [${requestId}] - Sessão do portal criada`, { url: session.url });

      return new Response(
        JSON.stringify({ url: session.url }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (stripeError) {
      logStep(`Requisição [${requestId}] - Erro ao criar sessão do portal no Stripe`, { 
        error: stripeError.message,
        code: stripeError.code,
        type: stripeError.type
      });
      throw new Error(`Erro ao criar sessão do portal: ${stripeError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep(`Requisição [${requestId}] - Erro`, { message: errorMessage, stack: errorStack });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
