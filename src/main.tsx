
import './env'; // Import environment variables
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
