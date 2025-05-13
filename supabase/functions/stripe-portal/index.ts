
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
  console.log(`[STRIPE-PORTAL] ${message}`, data ? JSON.stringify(data) : '');
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
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient()
    });
    
    // Find customer
    log("Looking up Stripe customer", { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    
    const customerId = customers.data[0].id;
    log("Customer found", { customerId });
    
    // Parse request for return URL
    let returnUrl;
    try {
      const body = await req.json();
      returnUrl = body.returnUrl;
    } catch (e) {
      log("No request body or return URL provided");
    }
    
    // Create portal session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const finalReturnUrl = returnUrl || `${origin}/subscription`;
    
    log("Creating portal session", { customerId, returnUrl: finalReturnUrl });
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: finalReturnUrl,
    });
    
    log("Portal session created", { sessionId: session.id, url: session.url });
    
    return new Response(
      JSON.stringify({ url: session.url }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[STRIPE-PORTAL] Error: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
