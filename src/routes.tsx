// This file is no longer needed as routing is now handled directly in App.tsx
// We are keeping this file for backward compatibility with existing imports

import { createBrowserRouter } from 'react-router-dom';
import Index from './pages/Index';
import Services from './pages/Services';
import RequestQuote from './pages/RequestQuote';

// This router is maintained for backwards compatibility
// but App.tsx is the source of truth for routing
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />
  },
  {
    path: '/services',
    element: <Services />
  },
  {
    path: '/services/:serviceId',
    element: <Services />
  },
  {
    path: '/request-quote',
    element: <RequestQuote />
  }
]);
