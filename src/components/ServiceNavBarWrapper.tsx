
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ServiceNavBar from './ServiceNavBar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client
const queryClient = new QueryClient();

const ServiceNavBarWrapper: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ServiceNavBar />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default ServiceNavBarWrapper;
