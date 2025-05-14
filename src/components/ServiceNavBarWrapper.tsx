
import React from 'react';
import ServiceNavBar from './ServiceNavBar';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client
const queryClient = new QueryClient();

const ServiceNavBarWrapper: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <ServiceNavBar />
    </QueryClientProvider>
  );
};

export default ServiceNavBarWrapper;
