
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QuoteRequestForm from '@/components/quoteRequest/QuoteRequestForm';
import { useQuery } from '@tanstack/react-query';
import { getAllServices } from '@/lib/api/services';
import { useAuth } from '@/context/AuthContext';
import { clearQuoteData } from '@/lib/utils/quoteStorage';
import { useToast } from '@/hooks/use-toast';

const RequestQuote: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use React Query for fetching services with caching
  const { isLoading, error, data: services } = useQuery({
    queryKey: ['services'],
    queryFn: getAllServices,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
  });
  
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("RequestQuote: Component mounted");
    
    // Clear any incomplete quote from previous sessions
    const currentRoute = window.location.pathname;
    if (currentRoute === '/request-quote') {
      // Only clear if we're starting a new quote
      console.log("RequestQuote: Clearing any previous incomplete quote data");
      clearQuoteData();
    }
  }, []);

  // Display a welcome toast for non-logged in users
  useEffect(() => {
    if (!user) {
      toast({
        title: "Informação",
        description: "Você não está logado, mas pode continuar! Para acompanhar seu orçamento depois, faça login antes de enviar.",
        duration: 7000,
      });
    } else {
      console.log("RequestQuote: User is logged in", user.id);
    }
  }, [user, toast]);

  useEffect(() => {
    if (services) {
      console.log("RequestQuote: Services loaded", services.length);
    }
  }, [services]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold mb-6 text-center">Solicite um Orçamento</h1>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Carregando serviços...</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-12">
                  <p>Erro ao carregar serviços. Por favor, tente novamente mais tarde.</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
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
