
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import PlansComparison from '@/components/subscription/PlansComparison';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { SubscriptionData } from '@/lib/types/subscriptions';
import LoadingSpinner from '@/components/ui/loading-spinner';

const Subscription: React.FC = () => {
  const { user, loading: authLoading, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  
  // Load subscription data only once when the page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const loadInitialData = async () => {
      if (!authLoading && user) {
        try {
          await refreshSubscription();
        } catch (error) {
          console.error("Failed to load subscription data:", error);
        } finally {
          setPageLoading(false);
        }
      } else if (!authLoading) {
        // If not loading and no user, we can show the page
        setPageLoading(false);
      }
    };
    
    loadInitialData();
  }, [authLoading, user]);
  
  const handleSelectPlan = async (plan: SubscriptionData) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (plan.tier === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }
    
    // Prevent multiple clicks
    if (checkoutLoading) {
      return;
    }
    
    setCheckoutLoading(true);
    setSelectedPlan(plan.id);
    
    try {
      console.log(`Iniciando checkout para o plano: ${plan.tier}`);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: plan.tier }
      });
      
      if (error) {
        console.error('Erro na resposta da função:', error);
        throw error;
      }
      
      if (data?.url) {
        console.log('URL de checkout recebida, redirecionando...');
        // Use window.location.href for a full page navigation to the checkout URL
        window.location.href = data.url;
      } else {
        console.error('URL de checkout não recebida na resposta:', data);
        throw new Error('Não foi possível obter o link de checkout');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento: ' + (error.message || 'Tente novamente mais tarde. Se o erro persistir, entre em contato com o suporte.'));
    } finally {
      setCheckoutLoading(false);
      setSelectedPlan(null);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <h1 className="text-2xl font-bold mb-6">Assinatura</h1>
            
            {user && (
              <div className="mb-10">
                <SubscriptionManager />
              </div>
            )}
            
            <PlansComparison 
              onSelectPlan={handleSelectPlan} 
              disabledPlans={checkoutLoading ? [selectedPlan || ''] : []}
            />
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subscription;
