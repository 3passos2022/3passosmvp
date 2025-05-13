
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  console.log(`[STRIPE-CHECKOUT] ${message}`, data ? JSON.stringify(data) : '');
};

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
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      throw new Error("Authentication failed: " + (userError?.message || "User not found"));
    }
    
    const user = userData.user;
    log("User authenticated", { email: user.email });
    
    // Parse request body
    const { priceId, returnUrl } = await req.json();
    
    if (!priceId) {
      throw new Error("Price ID is required");
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient()
    });
    
    // Find or create customer
    log("Looking up Stripe customer", { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      log("Existing customer found", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = newCustomer.id;
      log("New customer created", { customerId });
    }
    
    // Create checkout session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = returnUrl || `${origin}/subscription/success`;
    
    log("Creating checkout session", { customerId, priceId });
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: `${origin}/subscription/cancel`,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id
      }
    });
    
    log("Checkout session created", { sessionId: session.id, url: session.url });
    
    return new Response(
      JSON.stringify({ url: session.url }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[STRIPE-CHECKOUT] Error: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
