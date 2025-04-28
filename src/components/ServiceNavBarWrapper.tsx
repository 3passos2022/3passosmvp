
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ServiceNavBar from './ServiceNavBar';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client
const queryClient = new QueryClient();

const ServiceNavBarWrapper: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <ServiceNavBar />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default ServiceNavBarWrapper;
