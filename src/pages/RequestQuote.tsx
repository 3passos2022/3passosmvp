import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QuoteRequestForm from '@/components/quoteRequest/QuoteRequestForm';
import { useQuery } from '@tanstack/react-query';
import { getAllServices } from '@/lib/api/services';
import { useAuth } from '@/context/AuthContext';
import { clearQuoteData } from '@/lib/utils/quoteStorage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const RequestQuote: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

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

  // Show modal for non-logged in users
  useEffect(() => {
    if (!user) {
      // Small delay to ensure smooth loading perception
      const timer = setTimeout(() => {
        setShowLoginModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      console.log("RequestQuote: User is logged in", user.id);
    }
  }, [user]);

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

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Identifique-se</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Você não está logado, mas pode continuar! <br />
              Para acompanhar seu orçamento depois, faça login antes de enviar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLoginModal(false)}
              className="w-full sm:w-auto"
            >
              Continuar sem login
            </Button>
            <Button
              onClick={() => navigate('/login', { state: { from: '/request-quote' } })}
              className="w-full sm:w-auto"
            >
              Fazer Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestQuote;
