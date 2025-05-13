
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// Create a query client
const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/login" element={<Login />} />
            <Route path="/request-quote" element={<RequestQuote />} />
            <Route path="/prestadoresencontrados" element={<ProvidersFound />} />
            
            {/* Subscription Routes */}
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            
            {/* Protected Routes - Profile and nested routes */}
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/profile/quotes" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/profile/requested" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/profile/subscription" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/profile/settings" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/profile/services" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/profile/portfolio" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <PrivateRoute requiredRole={UserRole.ADMIN}>
                <Admin />
              </PrivateRoute>
            } />
            
            {/* Add an unauthorized route */}
            <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Acesso não autorizado</h1>
                <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
                <a href="/" className="text-primary hover:underline">Voltar para a página inicial</a>
              </div>
            </div>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
