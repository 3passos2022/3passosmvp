
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ServiceNavBar from './ServiceNavBar';
import { Toaster } from 'sonner';

const ServiceNavBarWrapper: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <ServiceNavBar />
    </BrowserRouter>
  );
};

export default ServiceNavBarWrapper;
