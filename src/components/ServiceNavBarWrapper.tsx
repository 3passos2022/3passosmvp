
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ServiceNavBar from './ServiceNavBar';

const ServiceNavBarWrapper: React.FC = () => {
  return (
    <BrowserRouter>
      <ServiceNavBar />
    </BrowserRouter>
  );
};

export default ServiceNavBarWrapper;
