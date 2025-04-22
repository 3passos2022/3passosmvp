// Declaração dos tipos para TypeScript
declare global {
  interface Window {
    ENV_GOOGLE_MAPS_API_KEY?: string;
    ENV_SUPABASE_URL?: string;
    ENV_SUPABASE_ANON_KEY?: string;
  }
}

// Injeta as variáveis de ambiente no objeto window
if (typeof window !== 'undefined') {
  // Google Maps
  window.ENV_GOOGLE_MAPS_API_KEY = import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // Supabase
  window.ENV_SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  window.ENV_SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export {}; 