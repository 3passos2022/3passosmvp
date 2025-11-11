import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'sonner';

// Debug env to verify Supabase variables at runtime
console.info('[Env check]', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  HAS_KEY: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
});

const rootElement = document.getElementById("root");

// Make sure the root element exists
if (!rootElement) {
  console.error("Root element not found");
} else {
  // Wait for the document to be fully loaded before rendering
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createRoot(rootElement).render(
        <React.StrictMode>
          <Toaster position="top-right" richColors />
          <App />
        </React.StrictMode>
      );
    });
  } else {
    createRoot(rootElement).render(
      <React.StrictMode>
        <Toaster position="top-right" richColors />
        <App />
      </React.StrictMode>
    );
  }
}
