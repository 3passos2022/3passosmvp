
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
  console.log(`[STRIPE-SUBSCRIPTION] ${message}`, data ? JSON.stringify(data) : '');
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
    
    // Initialize Supabase client with service role for writing to the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
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

    // Check if record exists in subscribers table
    const { data: existingSubscriber } = await supabase
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    // If no customer found in Stripe or if we need to update existing record
    if (customers.data.length === 0) {
      log("No customer found, marking as non-subscriber");
      
      // Create or update subscribers table
      await supabase.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: "free",
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" });
      
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const customerId = customers.data[0].id;
    log("Customer found", { customerId });
    
    // Check for active subscriptions
    log("Checking active subscriptions");
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = "free";
    let subscriptionEnd = null;
    
    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      log("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd
      });
      
      // Determine tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount >= 2000) {
        subscriptionTier = "premium";
      } else if (amount >= 1000) {
        subscriptionTier = "basic";
      } else {
        subscriptionTier = "free";
      }
      
      log("Subscription tier determined", { priceId, amount, subscriptionTier });
    } else {
      log("No active subscription found");
    }
    
    // Update subscribers table
    log("Updating subscriber record");
    await supabase.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: hasActiveSub ? subscriptionTier : "free",
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });
    
    log("Subscriber record updated");
    
    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        subscription_tier: hasActiveSub ? subscriptionTier : "free",
        subscription_end: subscriptionEnd
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[STRIPE-SUBSCRIPTION] Error: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        subscribed: false,
        subscription_tier: "free",
        subscription_end: null
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
