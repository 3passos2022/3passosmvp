
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import SubscriptionCard from './SubscriptionCard';
import { SubscriptionData } from '@/lib/types/subscriptions';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlansComparisonProps {
  showTitle?: boolean;
  onSelectPlan?: (plan: SubscriptionData) => void;
  onPlansLoaded?: (plans: SubscriptionData[]) => void;
  selectedPlanId?: string;
}

// Planos padrão para fallback caso não consiga carregar os do Stripe
const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionData[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para usuários casuais',
    price: 0,
    features: [
      'Limite de 5 imagens no portfólio',
      'Limite de 1 serviço cadastrado',
      'Visualização de apenas 3 prestadores'
    ],
    tier: 'free'
  },
  {
    id: 'basic',
    name: 'Básico',
    description: 'Para prestadores em crescimento',
    price: 1499,
    features: [
      'Limite de 15 imagens no portfólio',
      'Limite de 3 serviços cadastrados',
      'Visualização de todos os prestadores',
      'Prioridade nos resultados de busca'
    ],
    popular: true,
    tier: 'basic',
    priceId: 'price_basic'  // ID de exemplo, precisa ser substituído pelo real do Stripe
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Para prestadores profissionais',
    price: 2499,
    features: [
      'Imagens ilimitadas no portfólio',
      'Serviços ilimitados',
      'Visualização de todos os prestadores',
      'Destaque especial nos resultados de busca',
      'Suporte prioritário'
    ],
    tier: 'premium',
    priceId: 'price_premium'  // ID de exemplo, precisa ser substituído pelo real do Stripe
  }
];

const PlansComparison: React.FC<PlansComparisonProps> = ({ 
  showTitle = true,
  onSelectPlan,
  onPlansLoaded,
  selectedPlanId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionData[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const currentTier = user?.subscription_tier || 'free';
  
  useEffect(() => {
    const fetchStripePlans = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-products');
        
        if (error) {
          throw error;
        }
        
        if (data && data.products && data.products.length > 0) {
          // Garantir que pelo menos temos o plano gratuito
          let stripePlans = data.products;
          
          if (!stripePlans.find(p => p.tier === 'free')) {
            stripePlans = [DEFAULT_SUBSCRIPTION_PLANS[0], ...stripePlans];
          }
          
          // Ordenar por preço
          stripePlans.sort((a, b) => a.price - b.price);
          
          setPlans(stripePlans);
          console.log("Planos carregados do Stripe:", stripePlans);

          // Notificar o componente pai sobre os planos carregados
          if (onPlansLoaded) {
            onPlansLoaded(stripePlans);
          }
        } else {
          console.log("Usando planos padrão (nenhum encontrado no Stripe)");
          // Mesmo com os planos padrão, notificamos o componente pai
          if (onPlansLoaded) {
            onPlansLoaded(DEFAULT_SUBSCRIPTION_PLANS);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar planos do Stripe:", error);
        toast.error("Erro ao carregar planos de assinatura");
        
        // Mesmo com erro, notificamos o componente pai com os planos padrão
        if (onPlansLoaded) {
          onPlansLoaded(DEFAULT_SUBSCRIPTION_PLANS);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchStripePlans();
  }, [onPlansLoaded]);
  
  const handleSelect = (plan: SubscriptionData) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else if (!user) {
      navigate('/login', { state: { returnTo: '/subscription' } });
    } else {
      navigate('/subscription', { state: { selectedPlan: plan } });
    }
  };
  
  return (
    <div className="space-y-8">
      {showTitle && (
        <div className="text-center">
          <h2 className="text-3xl font-bold">Escolha seu Plano</h2>
          <p className="mt-2 text-muted-foreground">
            Selecione o plano ideal para suas necessidades
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-lg border p-6 shadow-sm opacity-70">
              <div className="animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-16 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <SubscriptionCard
              key={plan.id}
              plan={plan}
              currentTier={currentTier}
              onSelect={handleSelect}
              isSelected={plan.id === selectedPlanId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansComparison;
