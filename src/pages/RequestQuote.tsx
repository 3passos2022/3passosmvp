
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QuoteRequestForm from '@/components/quoteRequest/QuoteRequestForm';
import { getAllServices } from '@/lib/api/services';
import { Service } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const RequestQuote: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // Fetch services on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await getAllServices();
        if (data.length === 0) {
          setError('Nenhum serviço encontrado. Por favor, tente novamente mais tarde.');
        } else {
          setServices(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Erro ao carregar serviços. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-3xl mx-auto">
              {loading ? (
                <div className="p-8 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-lg text-gray-600">Carregando serviços...</p>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              ) : (
                // Pass services as prop instead of initialServices
                <QuoteRequestForm services={services} />
              )}
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RequestQuote;
