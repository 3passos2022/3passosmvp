/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://jezfwtknzraaykkjjaaf.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplemmZ3dGtuenJhYXlra2pqYWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc0MjY4NzAsImV4cCI6MjAyMzAwMjg3MH0.7QDEbzYPQxvGBzv_BgXs4WpZZPDEbGxcpHFIzNzF5Yw'
  },
  // Adiciona suporte a imagens de domínios externos (como o Supabase Storage)
  images: {
    domains: ['jezfwtknzraaykkjjaaf.supabase.co'],
  }
}

module.exports = nextConfig 