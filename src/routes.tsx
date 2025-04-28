
import { createBrowserRouter } from 'react-router-dom';
import Index from './pages/Index';
import Services from './pages/Services';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import RequestQuote from './pages/RequestQuote';
import ProvidersFound from './pages/ProvidersFound';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import PrivateRoute from './components/PrivateRoute';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import { UserRole } from './lib/types';

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
    path: '/login',
    element: <Login />
  },
  {
    path: '/request-quote',
    element: <RequestQuote />
  },
  {
    path: '/prestadoresencontrados',
    element: <ProvidersFound />
  },
  {
    path: '/subscription',
    element: <Subscription />
  },
  {
    path: '/subscription/success',
    element: <SubscriptionSuccess />
  },
  {
    path: '/subscription/cancel',
    element: <SubscriptionCancel />
  },
  {
    path: '/profile/*',
    element: (
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    )
  },
  {
    path: '/admin/*',
    element: (
      <PrivateRoute requiredRole={'admin' as UserRole}>
        <Admin />
      </PrivateRoute>
    )
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
