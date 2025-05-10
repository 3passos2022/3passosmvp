
import React, { useEffect } from 'react';
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
  const { user, loading, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Atualizar informações de assinatura quando a página carregar
    if (user) {
      refreshSubscription().catch(err => {
        console.error("Erro ao verificar assinatura:", err);
      });
    }
  }, [user, refreshSubscription]);
  
  const handleSelectPlan = async (plan: SubscriptionData) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (plan.tier === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          tier: plan.tier,
          priceId: plan.priceId,
          returnUrl: window.location.origin + '/subscription/success'
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Não foi possível obter o link de checkout');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento: ' + (error.message || 'Tente novamente mais tarde'));
    }
  };

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
            
            {loading ? (
              <div className="w-full py-20 flex justify-center">
                <div className="flex flex-col items-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-gray-500">Carregando informações...</p>
                </div>
              </div>
            ) : (
              <>
                {user && (
                  <div className="mb-10">
                    <SubscriptionManager />
                  </div>
                )}
                
                <PlansComparison onSelectPlan={handleSelectPlan} />
              </>
            )}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subscription;
