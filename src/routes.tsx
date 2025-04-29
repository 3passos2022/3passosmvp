
// This file is deprecated and will be removed in future updates.
// All routing is now handled directly in App.tsx

import { createBrowserRouter } from 'react-router-dom';
import Index from './pages/Index';

// This is a placeholder to maintain compatibility
// Use App.tsx for all routing configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />
  }
]);
