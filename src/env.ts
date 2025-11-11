
// Environment variables file that prevents potential script loading issues

// Define environment variables with default values for development
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://jezfwtknzraaykkjjaaf.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplemZ3dGtuenJhYXlra2pqYWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MDEyODgsImV4cCI6MjA1ODQ3NzI4OH0.KQi-SMdeDN7gMpWufxctNwoqkHEtDgKEQE0LRbifGsc',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCz60dsmYx6T6qHNCs1OZtA7suJGA7xVW8'
};

// Log to confirm environment variables are loaded
console.log("Environment variables loaded successfully");
