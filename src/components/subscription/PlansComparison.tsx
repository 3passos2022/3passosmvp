
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SubscriptionCard from './SubscriptionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionData } from '@/lib/types/subscriptions';
import { Check } from 'lucide-react';

interface PlansComparisonProps {
  onSelectPlan: (plan: SubscriptionData) => void;
  onPlansLoaded?: (plans: SubscriptionData[]) => void;
  selectedPlanId?: string;
}

const PlansComparison: React.FC<PlansComparisonProps> = ({
  onSelectPlan,
  onPlansLoaded,
  selectedPlanId
}) => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Default plans as fallback
  const defaultPlans: SubscriptionData[] = useMemo(() => [
    {
      id: 'free',
      priceId: undefined,
      name: 'Gratuito',
      description: 'Para usuários casuais',
      price: 0,
      tier: 'free',
      features: [
        'Limite de 5 imagens no portfólio',
        'Limite de 1 serviço cadastrado',
        'Visualização de apenas 3 prestadores'
      ]
    },
    {
      id: 'basic',
      priceId: 'price_basic',
      name: 'Básico',
      description: 'Para prestadores em crescimento',
      price: 1499,
      tier: 'basic',
      popular: true,
      features: [
        'Limite de 15 imagens no portfólio',
        'Limite de 3 serviços cadastrados',
        'Visualização de todos os prestadores',
        'Prioridade nos resultados de busca'
      ]
    },
    {
      id: 'premium',
      priceId: 'price_premium',
      name: 'Premium',
      description: 'Para prestadores profissionais',
      price: 2499,
      tier: 'premium',
      features: [
        'Imagens ilimitadas no portfólio',
        'Serviços ilimitados',
        'Visualização de todos os prestadores',
        'Destaque especial nos resultados de busca',
        'Suporte prioritário'
      ]
    }
  ], []);

  useEffect(() => {
    fetchPlansData();
  }, []);

  useEffect(() => {
    if (plans.length > 0 && onPlansLoaded) {
      console.log('Notifying parent component about loaded plans:', plans);
      onPlansLoaded(plans);
    }
  }, [plans, onPlansLoaded]);

  const fetchPlansData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching subscription plans data...');
      const { data, error } = await supabase.functions.invoke('get-stripe-products');

      if (error) {
        console.error('Error fetching plans:', error);
        setError('Erro ao carregar planos: ' + error.message);
        setPlans(defaultPlans);
      } else if (data?.products && data.products.length > 0) {
        console.log('Plans loaded successfully:', data.products);
        // Make sure they have the correct tier property
        const processedPlans = data.products.map((plan: any) => ({
          ...plan,
          tier: plan.tier || (plan.price === 0 ? 'free' : plan.price <= 1999 ? 'basic' : 'premium')
        })) as SubscriptionData[];

        setPlans(processedPlans);
      } else {
        console.log('No plans returned from API, using default plans');
        setPlans(defaultPlans);
      }
    } catch (err: any) {
      console.error('Error in fetchPlansData:', err);
      setError('Erro ao carregar planos: ' + (err.message || 'Erro desconhecido'));
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanTier = (): 'free' | 'basic' | 'premium' => {
    if (!user || !subscription) return 'free';
    return (subscription.subscribed && subscription.subscription_tier) 
      ? (subscription.subscription_tier as 'free' | 'basic' | 'premium') 
      : 'free';
  };

  const currentPlanTier = getCurrentPlanTier();

  const handleSelectPlan = (plan: SubscriptionData) => {
    // Check if need to upgrade
    if (currentPlanTier === 'premium' && plan.tier !== 'premium') {
      toast({
        title: "Downgrade necessário",
        description: "Entre em contato com o suporte para fazer downgrade do seu plano",
        variant: "destructive"
      });
      return;
    }

    // Allow selection or upgrade
    console.log('Selected plan:', plan);
    onSelectPlan(plan);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Nossos Planos</h2>
        <p className="text-gray-500 mt-2">Escolha o plano que melhor se adapta às suas necessidades</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 bg-white shadow-sm">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-6" />
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center mb-3">
                  <Skeleton className="h-4 w-4 rounded-full mr-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = user?.subscription_tier === plan.tier && 
                                user?.subscribed;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <SubscriptionCard
                  plan={plan}
                  isCurrentPlan={isCurrentPlan}
                  onSelect={() => handleSelectPlan(plan)}
                  isSelected={selectedPlanId === plan.id}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Comparativo de Recursos</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4 text-left">Recurso</th>
                {plans.map(plan => (
                  <th key={plan.id} className="py-3 px-4 text-center">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Imagens no portfólio</td>
                <td className="py-3 px-4 text-center">5</td>
                <td className="py-3 px-4 text-center">15</td>
                <td className="py-3 px-4 text-center">Ilimitadas</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Serviços cadastrados</td>
                <td className="py-3 px-4 text-center">1</td>
                <td className="py-3 px-4 text-center">3</td>
                <td className="py-3 px-4 text-center">Ilimitados</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Visualização de prestadores</td>
                <td className="py-3 px-4 text-center">3 por dia</td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-5 w-5 mx-auto text-green-500" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-5 w-5 mx-auto text-green-500" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Posição nos resultados de busca</td>
                <td className="py-3 px-4 text-center">Normal</td>
                <td className="py-3 px-4 text-center">Prioridade</td>
                <td className="py-3 px-4 text-center">Destaque especial</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Suporte prioritário</td>
                <td className="py-3 px-4 text-center">-</td>
                <td className="py-3 px-4 text-center">-</td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-5 w-5 mx-auto text-green-500" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlansComparison;
