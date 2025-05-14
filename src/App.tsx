
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Services from './pages/Services';
import Admin from './pages/Admin';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import RequestQuote from './pages/RequestQuote';
import ProvidersFound from './pages/ProvidersFound';
import makeAndreAdmin from './pages/makeAndreAdmin';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceNavBarWrapper } from './components/ServiceNavBarWrapper';
import { Toaster as SonnerToaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ServiceNavBarWrapper />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:serviceId" element={<Services />} />
            <Route path="/request-quote" element={<RequestQuote />} />
            <Route path="/prestadoresencontrados" element={<ProvidersFound />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="/profile/*" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/makementor" element={<makeAndreAdmin />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>
          <SonnerToaster position="top-right" richColors />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
