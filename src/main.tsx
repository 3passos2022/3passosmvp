
import './env'; // Importa as variáveis de ambiente
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx'
import './index.css'
import { Toaster } from 'sonner';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster position="top-right" richColors />
    <App />
  </React.StrictMode>
);
