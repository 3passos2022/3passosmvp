
// Environment variables file that prevents potential script loading issues

// Define environment variables with fallbacks and validation
const getEnvVar = (viteKey: string, nextKey: string, fallback: string) => {
  const value = import.meta.env[viteKey] || import.meta.env[nextKey] || fallback;

  // Se o valor for a string "undefined" ou estiver vazio (e não for o fallback)
  if (value === 'undefined' || value === '' || !value) {
    console.warn(`[ENV] Variável ${viteKey}/${nextKey} não encontrada. Usando fallback.`);
    return fallback;
  }

  return value;
};

export const ENV = {
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'https://jezfwtknzraaykkjjaaf.supabase.co'),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplemZ3dGtuenJhYXlra2pqYWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MDEyODgsImV4cCI6MjA1ODQ3NzI4OH0.KQi-SMdeDN7gMpWufxctNwoqkHEtDgKEQE0LRbifGsc'),
  GOOGLE_MAPS_API_KEY: getEnvVar('VITE_GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_MAPS_API_KEY', 'AIzaSyCz60dsmYx6T6qHNCs1OZtA7suJGA7xVW8')
};

// Log to confirm environment variables are loaded
console.log("Environment variables loaded successfully");
