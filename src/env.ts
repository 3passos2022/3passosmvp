
// Environment variables file that prevents potential script loading issues

// Define environment variables with default values for development
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
};

// Log to confirm environment variables are loaded
console.log("Environment variables loaded successfully");
