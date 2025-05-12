
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Expandir headers CORS para garantir compatibilidade em diferentes navegadores
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with, accept",
  "Access-Control-Max-Age": "86400", // 24 horas para reduzir preflight requests
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    logStep("OPTIONS request recebida");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    logStep("Função iniciada");
    const requestId = crypto.randomUUID();
    logStep(`Nova requisição [${requestId}]`, {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers)
    });

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
      httpClient: Stripe.createFetchHttpClient(), // Especificar explicitamente o cliente HTTP
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

    // Adicionar plano gratuito aos planos padrão
    defaultPlans.unshift({
      id: 'free',
      priceId: undefined,
      name: 'Gratuito',
      description: 'Para usuários casuais',
      price: 0,
      tier: 'free',
      features: [
        'Limite de 5 imagens no portfólio',
        'Limite de 1 serviço cadastrado',
        'Visualização de apenas 3 prestadores'
      ]
    });

    try {
      // Verificar conexão com o Stripe antes de continuar
      logStep("Verificando conexão com o Stripe");
      const connectionTest = await stripe.balance.retrieve();
      logStep("Conexão com o Stripe confirmada", { status: "success" });

      // Buscar produtos ativos
      logStep("Enviando requisição para o Stripe.products.list");
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
        // Garantir que pelo menos temos o plano gratuito
        if (!formattedProducts.find(p => p.tier === 'free')) {
          formattedProducts.unshift(defaultPlans[0]);
          logStep("Adicionado plano gratuito aos produtos do Stripe");
        }
        
        // Ordenar por preço
        formattedProducts.sort((a, b) => a.price - b.price);

        const response = {
          products: formattedProducts,
          cached: false,
          timestamp: new Date().toISOString()
        };

        logStep(`Requisição [${requestId}] concluída com sucesso`, { productCount: formattedProducts.length });

        return new Response(
          JSON.stringify(response),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        logStep(`Requisição [${requestId}] - Nenhum produto encontrado, usando planos padrão`);
        return new Response(
          JSON.stringify({ 
            products: defaultPlans,
            cached: false,
            fallback: true,
            timestamp: new Date().toISOString()
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } catch (stripeError) {
      // Erro específico na comunicação com o Stripe, usar planos padrão
      logStep(`Requisição [${requestId}] - Erro ao comunicar com Stripe API`, { 
        error: stripeError.message,
        stack: stripeError.stack
      });
      return new Response(
        JSON.stringify({ 
          products: defaultPlans, 
          warning: "Usando planos padrão devido a erro na comunicação com Stripe",
          cached: false,
          fallback: true,
          error: stripeError.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,  // Retornar 200 mesmo com erro, mas com os planos padrão
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("Erro fatal", { message: errorMessage, stack: errorStack });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
