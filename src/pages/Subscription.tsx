
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import PlansComparison from '@/components/subscription/PlansComparison';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionData } from '@/lib/types/subscriptions';
import LoadingSpinner from '@/components/ui/loading-spinner';

const Subscription: React.FC = () => {
  const { user, loading: authLoading, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [initAttempted, setInitAttempted] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionData[]>([]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check for plan in navigation state
    if (location.state && location.state.selectedPlan) {
      console.log("Plan found in navigation state:", location.state.selectedPlan);
      setSelectedPlan(location.state.selectedPlan);
    }
  }, [location]);
  
  // Initialize subscription status
  useEffect(() => {
    if (user && !initAttempted) {
      setInitAttempted(true);
      const timeout = setTimeout(() => {
        // Safety timeout to ensure page doesn't get stuck loading
        setInitializing(false);
      }, 5000);
      
      const checkSubscription = async () => {
        try {
          console.log("Checking subscription status...");
          await refreshSubscription();
          console.log("Subscription status updated successfully");
        } catch (error) {
          console.error("Error checking subscription:", error);
          toast({
            title: "Erro",
            description: "Não foi possível verificar o status da sua assinatura",
            variant: "destructive"
          });
        } finally {
          clearTimeout(timeout);
          setInitializing(false);
        }
      };
      
      checkSubscription();
      
      return () => clearTimeout(timeout);
    } else if (!user && !authLoading) {
      // No user and not loading authentication
      setInitializing(false);
    }
  }, [user, authLoading, initAttempted, refreshSubscription]);
  
  const handleSelectPlan = (plan: SubscriptionData) => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/subscription' } });
      return;
    }
    
    if (plan.tier === 'free') {
      toast({
        title: "Plano gratuito",
        description: "Você já está no plano gratuito"
      });
      return;
    }
    
    if (!plan.priceId) {
      toast({
        title: "Erro",
        description: "Este plano não possui um ID de preço válido",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Starting checkout for plan:", plan);
    setSelectedPlan(plan);
  };

  // Handle plans loaded from PlansComparison
  const handlePlansLoaded = (plans: SubscriptionData[]) => {
    console.log("Plans loaded in Subscription component:", plans);
    setAvailablePlans(plans);
    
    // If no plan selected and plans are available, select a default plan
    if (!selectedPlan && plans.length > 0) {
      // Try to find the basic plan first
      const basicPlan = plans.find(plan => plan.tier === 'basic');
      // If not found, use the second plan (usually first paid plan)
      const defaultPlan = basicPlan || (plans.length > 1 ? plans[1] : plans[0]);
      console.log("Selecting default plan:", defaultPlan);
      setSelectedPlan(defaultPlan);
    }
  };

  // Determine if loading spinner should be shown
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
                    console.log("Plan selected in comparison:", plan);
                    setSelectedPlan(plan);
                    // Scroll to SubscriptionManager
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
