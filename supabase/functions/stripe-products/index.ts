
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Comprehensive CORS headers implementation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

// Helper function for logging
const log = (message: string, data?: any) => {
  console.log(`[STRIPE-PRODUCTS] ${message}`, data ? JSON.stringify(data) : '');
};

// Default plans as fallback
const defaultPlans = [
  {
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
  },
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

serve(async (req) => {
  // Always handle OPTIONS request first
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  try {
    log("Function invoked");
    
    // Get Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log("STRIPE_SECRET_KEY not configured, returning default plans");
      return new Response(
        JSON.stringify({ 
          products: defaultPlans, 
          fallback: true,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient()
    });
    
    // Get products with prices
    log("Fetching products from Stripe");
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });
    
    log(`Retrieved ${products.data.length} products from Stripe`);
    
    if (products.data.length === 0) {
      log("No products found, returning default plans");
      return new Response(
        JSON.stringify({ 
          products: defaultPlans, 
          fallback: true,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Format products for the frontend
    const formattedProducts = products.data
      .filter(product => product.metadata?.type === 'subscription' || product.metadata?.tier)
      .map(product => {
        const defaultPrice = product.default_price as Stripe.Price;
        
        let tier = product.metadata?.tier || 'basic';
        if (!['free', 'basic', 'premium'].includes(tier)) {
          const amount = defaultPrice?.unit_amount || 0;
          if (amount === 0) tier = 'free';
          else if (amount < 2000) tier = 'basic';
          else tier = 'premium';
        }
        
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
    
    // Add free plan if not present
    if (formattedProducts.length > 0 && !formattedProducts.find(p => p.tier === 'free')) {
      formattedProducts.unshift(defaultPlans[0]);
      log("Added free plan to Stripe products");
    }
    
    // Sort by price
    formattedProducts.sort((a, b) => a.price - b.price);
    
    log(`Returning ${formattedProducts.length} formatted products`);
    
    return new Response(
      JSON.stringify({ 
        products: formattedProducts || defaultPlans,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[STRIPE-PRODUCTS] Error: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        products: defaultPlans,
        fallback: true,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
