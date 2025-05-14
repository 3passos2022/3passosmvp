
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { SubscriptionData } from '@/lib/types/subscriptions';
import { cn } from '@/lib/utils';
import SubscriptionCard from './SubscriptionCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PlansComparisonProps {
  showTitle?: boolean;
  onSelectPlan?: (plan: SubscriptionData) => void;
}

const SUBSCRIPTION_PLANS: SubscriptionData[] = [
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
    price: 3990,
    features: [
      'Limite de 15 imagens no portfólio',
      'Limite de 3 serviços cadastrados',
      'Visualização de todos os prestadores',
      'Prioridade nos resultados de busca',
      'Suporte por email'
    ],
    popular: true,
    tier: 'basic'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Para prestadores profissionais',
    price: 7990,
    features: [
      'Imagens ilimitadas no portfólio',
      'Serviços ilimitados',
      'Visualização de todos os prestadores',
      'Destaque especial nos resultados de busca',
      'Suporte prioritário',
      'Dashboard de análises avançadas'
    ],
    tier: 'premium'
  }
];

const PlansComparison: React.FC<PlansComparisonProps> = ({ 
  showTitle = true,
  onSelectPlan 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const currentTier = user?.subscription_tier || 'free';
  
  const handleSelect = (plan: SubscriptionData) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else if (!user) {
      navigate('/login', { state: { returnTo: '/subscription' } });
    } else {
      navigate('/subscription');
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
          {user?.role === 'provider' && (
            <div className="mt-4 inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
              Prestadores ganham 30 dias grátis no plano Básico! 🎁
            </div>
          )}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <SubscriptionCard
            key={plan.id}
            plan={plan}
            currentTier={currentTier}
            onSelect={handleSelect}
            showTrialBadge={user?.role === 'provider' && plan.tier === 'basic'}
          />
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Todas as assinaturas são renovadas automaticamente. Cancele a qualquer momento.</p>
      </div>
    </div>
  );
};

export default PlansComparison;
