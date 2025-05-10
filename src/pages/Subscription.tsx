
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import PlansComparison from '@/components/subscription/PlansComparison';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionData } from '@/lib/types/subscriptions';
import LoadingSpinner from '@/components/ui/loading-spinner';

const Subscription: React.FC = () => {
  const { user, loading: authLoading, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [initAttempted, setInitAttempted] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionData[]>([]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Verificar se há plano na navegação
    if (location.state && location.state.selectedPlan) {
      console.log("Plano encontrado no estado da navegação:", location.state.selectedPlan);
      setSelectedPlan(location.state.selectedPlan);
    }
  }, [location]);
  
  // Separar a inicialização da assinatura em um useEffect isolado
  useEffect(() => {
    if (user && !initAttempted) {
      setInitAttempted(true);
      const timeout = setTimeout(() => {
        // Timeout de segurança para garantir que a página não fique presa carregando
        setInitializing(false);
      }, 5000);
      
      const checkSubscription = async () => {
        try {
          console.log("Verificando status da assinatura...");
          await refreshSubscription();
          console.log("Status da assinatura atualizado com sucesso");
        } catch (error) {
          console.error("Erro ao verificar assinatura:", error);
          toast.error("Não foi possível verificar o status da sua assinatura");
        } finally {
          clearTimeout(timeout);
          setInitializing(false);
        }
      };
      
      checkSubscription();
      
      return () => clearTimeout(timeout);
    } else if (!user && !authLoading) {
      // Se não há usuário e não está carregando a autenticação
      setInitializing(false);
    }
  }, [user, authLoading, initAttempted, refreshSubscription]);
  
  const handleSelectPlan = async (plan: SubscriptionData) => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/subscription' } });
      return;
    }
    
    if (plan.tier === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }
    
    if (!plan.priceId) {
      toast.error('Este plano não possui um ID de preço válido');
      return;
    }
    
    try {
      console.log("Iniciando checkout para o plano:", plan);
      setSelectedPlan(plan);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          tier: plan.tier,
          priceId: plan.priceId,
          returnUrl: window.location.origin + '/subscription/success'
        }
      });
      
      if (error) {
        console.error("Erro na função create-checkout:", error);
        throw new Error(`Erro ao processar pedido: ${error.message}`);
      }
      
      console.log("Resposta da função create-checkout:", data);
      
      if (data?.url) {
        console.log("Redirecionando para URL do checkout:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error('Não foi possível obter o link de checkout');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento: ' + (error.message || 'Tente novamente mais tarde'));
    }
  };

  // Função para receber e atualizar a lista de planos disponíveis
  const handlePlansLoaded = (plans: SubscriptionData[]) => {
    console.log("Planos carregados no componente Subscription:", plans);
    setAvailablePlans(plans);
    
    // Se não houver plano selecionado e houver planos disponíveis, 
    // selecionar o plano básico ou o segundo plano (geralmente o primeiro pago)
    if (!selectedPlan && plans.length > 0) {
      // Tentar encontrar o plano basic primeiro
      const basicPlan = plans.find(plan => plan.tier === 'basic');
      // Se não encontrar o plano basic, pegar o segundo plano (geralmente o primeiro pago)
      const defaultPlan = basicPlan || (plans.length > 1 ? plans[1] : plans[0]);
      console.log("Selecionando plano padrão:", defaultPlan);
      setSelectedPlan(defaultPlan);
    }
  };

  // Determinar se devemos mostrar o spinner de carregamento
  const showLoading = authLoading || (initAttempted && initializing);

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
            
            {showLoading ? (
              <div className="w-full py-20 flex justify-center">
                <div className="flex flex-col items-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-gray-500">Carregando informações...</p>
                </div>
              </div>
            ) : (
              <>
                {user && (
                  <div className="mb-10" id="subscription-manager">
                    <SubscriptionManager 
                      selectedPlan={selectedPlan}
                      onPlanSelect={setSelectedPlan}
                      availablePlans={availablePlans}
                    />
                  </div>
                )}
                
                <PlansComparison 
                  onSelectPlan={(plan) => {
                    console.log("Plano selecionado na comparação:", plan);
                    setSelectedPlan(plan);
                    // Rolar para o topo do SubscriptionManager
                    const element = document.getElementById('subscription-manager');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }} 
                  onPlansLoaded={handlePlansLoaded}
                  selectedPlanId={selectedPlan?.id}
                />
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
