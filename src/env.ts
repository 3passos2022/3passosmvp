// Declaração dos tipos para TypeScript
declare global {
  interface Window {
    ENV_GOOGLE_MAPS_API_KEY?: string;
    ENV_SUPABASE_URL?: string;
    ENV_SUPABASE_ANON_KEY?: string;
  }
}

// Valores padrão para quando não estiver no navegador (Lovable)
const defaultEnv = {
  GOOGLE_MAPS_API_KEY: 'AIzaSyCz60dsmYx6T6qHNCs1OZtA7suJGA7xVW8',
  SUPABASE_URL: 'https://jezfwtknzraaykkjjaaf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplemZ3dGtuenJhYXlra2pqYWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MDEyODgsImV4cCI6MjA1ODQ3NzI4OH0.KQi-SMdeDN7gMpWufxctNwoqkHEtDgKEQE0LRbifGsc'
};

// Injeta as variáveis de ambiente no objeto window
if (typeof window !== 'undefined') {
  // Google Maps
  window.ENV_GOOGLE_MAPS_API_KEY = import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || defaultEnv.GOOGLE_MAPS_API_KEY;
  
  // Supabase
  window.ENV_SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || defaultEnv.SUPABASE_URL;
  window.ENV_SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultEnv.SUPABASE_ANON_KEY;
}

// Exporta as variáveis para uso em ambientes não-navegador
export const ENV = {
  GOOGLE_MAPS_API_KEY: typeof window !== 'undefined' ? window.ENV_GOOGLE_MAPS_API_KEY : defaultEnv.GOOGLE_MAPS_API_KEY,
  SUPABASE_URL: typeof window !== 'undefined' ? window.ENV_SUPABASE_URL : defaultEnv.SUPABASE_URL,
  SUPABASE_ANON_KEY: typeof window !== 'undefined' ? window.ENV_SUPABASE_ANON_KEY : defaultEnv.SUPABASE_ANON_KEY
}; 