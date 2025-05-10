
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    logStep("OPTIONS request recebida");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    logStep("Função iniciada");

    // Verificar chave do Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Erro: STRIPE_SECRET_KEY não configurada");
      throw new Error("STRIPE_SECRET_KEY não configurada no ambiente");
    }
    logStep("STRIPE_SECRET_KEY verificada");

    // Inicializa o Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    logStep("Buscando produtos e preços ativos");

    // Definir planos padrão para fallback
    const defaultPlans = [
      {
        id: 'basic',
        priceId: 'price_basic',
        name: 'Básico',
        description: 'Para prestadores em crescimento',
        price: 1499,
        tier: 'basic',
        popular: true,
        features: [
          'Limite de 15 imagens no portfólio',
          'Limite de 3 serviços cadastrados',
          'Visualização de todos os prestadores',
          'Prioridade nos resultados de busca'
        ]
      },
      {
        id: 'premium',
        priceId: 'price_premium',
        name: 'Premium',
        description: 'Para prestadores profissionais',
        price: 2499,
        tier: 'premium',
        features: [
          'Imagens ilimitadas no portfólio',
          'Serviços ilimitados',
          'Visualização de todos os prestadores',
          'Destaque especial nos resultados de busca',
          'Suporte prioritário'
        ]
      }
    ];

    try {
      // Buscar produtos ativos
      const products = await stripe.products.list({
        active: true,
        limit: 10,
        expand: ['data.default_price']
      });
      
      logStep("Produtos recebidos do Stripe", { count: products.data.length });

      // Mapear produtos para o formato esperado pela UI
      const formattedProducts = products.data
        .filter(product => product.metadata?.type === 'subscription' || product.metadata?.tier)
        .map(product => {
          // Obter o preço padrão do produto
          const defaultPrice = product.default_price as Stripe.Price;
          
          // Determinar o tier com base nos metadados do produto
          let tier = product.metadata?.tier || 'basic';
          if (!['free', 'basic', 'premium'].includes(tier)) {
            // Fallback baseado no preço
            const amount = defaultPrice?.unit_amount || 0;
            if (amount === 0) tier = 'free';
            else if (amount < 2000) tier = 'basic';
            else tier = 'premium';
          }
          
          // Verificar se é o plano popular
          const popular = product.metadata?.popular === 'true' || tier === 'basic';

          return {
            id: product.id,
            priceId: defaultPrice?.id,
            name: product.name,
            description: product.description || `Plano ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
            price: defaultPrice?.unit_amount || 0,
            tier,
            popular,
            features: product.features?.map(f => f.name) || 
                      product.metadata?.features?.split(',') || 
                      []
          };
        });

      logStep("Produtos formatados", { count: formattedProducts.length });
      
      if (formattedProducts.length > 0) {
        return new Response(
          JSON.stringify({ products: formattedProducts }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        logStep("Nenhum produto encontrado, usando planos padrão");
        return new Response(
          JSON.stringify({ products: defaultPlans }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } catch (stripeError) {
      // Erro específico na comunicação com o Stripe, usar planos padrão
      logStep("Erro ao comunicar com Stripe API", { error: stripeError.message });
      return new Response(
        JSON.stringify({ 
          products: defaultPlans, 
          warning: "Usando planos padrão devido a erro na comunicação com Stripe" 
        }),
        {
          status: 200,  // Retornar 200 mesmo com erro, mas com os planos padrão
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Erro fatal", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
