
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Calendar, Loader2 } from 'lucide-react';
import { SubscriptionData } from '@/lib/types/subscriptions';
import { cn } from '@/lib/utils';

interface SubscriptionCardProps {
  plan: SubscriptionData;
  currentTier?: 'free' | 'basic' | 'premium';
  onSelect: (plan: SubscriptionData) => void;
  disabled?: boolean;
  showTrialBadge?: boolean;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  currentTier,
  onSelect,
  disabled = false,
  showTrialBadge = false
}) => {
  const isCurrentPlan = currentTier === plan.tier;
  
  return (
    <div
      className={cn(
        'rounded-lg border p-6 shadow-sm transition-all',
        isCurrentPlan 
          ? 'border-primary/50 bg-primary/5 shadow-primary/10' 
          : 'border-border bg-card hover:shadow',
        plan.popular && 'relative border-primary'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
          Popular
        </div>
      )}

      {showTrialBadge && (
        <div className="absolute -top-3 right-4 rounded-full bg-blue-500 px-3 py-1 text-xs text-white flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          30 Dias Grátis
        </div>
      )}
      
      <div className="mb-4 mt-2 space-y-2 text-center">
        <h3 className="font-semibold">{plan.name}</h3>
        <div>
          <span className="text-3xl font-bold">
            {plan.price === 0 ? 'Grátis' : `R$${(plan.price / 100).toFixed(2)}`}
          </span>
          {plan.price > 0 && <span className="text-muted-foreground">/mês</span>}
        </div>
      </div>
      
      <ul className="mb-6 mt-4 space-y-2 text-sm">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button
        className="w-full"
        disabled={disabled || isCurrentPlan}
        onClick={() => onSelect(plan)}
        variant={plan.popular ? "default" : "outline"}
      >
        {disabled ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : isCurrentPlan ? 'Seu Plano Atual' : (
          showTrialBadge ? 'Experimente Grátis' : 'Escolher Plano'
        )}
      </Button>
    </div>
  );
};

export default SubscriptionCard;
