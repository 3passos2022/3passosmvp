
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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Função iniciada");

    // Obtém os parâmetros do corpo da requisição
    const { tier = "basic", returnUrl } = await req.json();
    logStep("Parâmetros recebidos", { tier, returnUrl });

    // Inicializa o cliente Supabase com a chave de serviço para operações administrativas
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    let customerId: string | undefined = undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Cliente Stripe existente encontrado", { customerId });
    }

    // Determina o preço com base no tier solicitado
    let priceId: string;
    let amount: number;
    
    switch (tier) {
      case "premium":
        amount = 7990; // R$79,90/mês
        break;
      case "basic":
      default:
        amount = 3990; // R$39,90/mês
        tier = "basic";
        break;
    }

    // Verifica se o usuário pode iniciar um período de teste (apenas para providers no plano basic)
    let trial_period_days: number | null = null;
    const { data: canStartTrial, error: trialError } = await supabaseClient.rpc("can_start_trial", {
      p_user_id: user.id,
      p_tier: tier
    });
    
    if (trialError) {
      logStep("Erro ao verificar elegibilidade para teste", { error: trialError.message });
    } else if (canStartTrial && tier === "basic") {
      trial_period_days = 30; // 30 dias de teste gratuito para prestadores no plano básico
      logStep("Usuário elegível para período de teste", { trial_period_days });
    }

    // Cria a sessão de checkout
    const origin = new URL(req.url).origin;
    const success_url = returnUrl || `${origin}/subscription/success?tier=${tier}`;
    const cancel_url = `${origin}/subscription/cancel`;

    logStep("Criando sessão de checkout", { 
      tier, 
      amount, 
      customerId, 
      trial_period_days 
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Plano ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
              description: tier === "premium" ? "Acesso completo a todas as funcionalidades" : "Acesso a funcionalidades avançadas",
            },
            unit_amount: amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url,
      cancel_url,
      subscription_data: trial_period_days ? { trial_period_days } : undefined,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
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
