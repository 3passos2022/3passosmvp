
import './env'; // Importa as variáveis de ambiente
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'sonner';

// Get the root element
const rootElement = document.getElementById("root");

// Make sure the root element exists
if (!rootElement) {
  console.error("Root element not found");
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <Toaster position="top-right" richColors />
      <App />
    </React.StrictMode>
  );
}
