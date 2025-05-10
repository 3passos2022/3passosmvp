
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Função iniciada");

    // Inicializa o Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    logStep("Buscando produtos e preços ativos");

    // Buscar produtos ativos
    const products = await stripe.products.list({
      active: true,
      limit: 10,
      expand: ['data.default_price']
    });

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

    return new Response(
      JSON.stringify({ products: formattedProducts }),
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
