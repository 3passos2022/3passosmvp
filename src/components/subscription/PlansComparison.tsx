
import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionData } from '@/lib/types/subscriptions';

interface PlansComparisonProps {
  onSelectPlan: (plan: SubscriptionData) => void;
  onPlansLoaded?: (plans: SubscriptionData[]) => void;
  selectedPlanId?: string;
  showTitle?: boolean;
}

const PlansComparison: React.FC<PlansComparisonProps> = ({ 
  onSelectPlan, 
  onPlansLoaded, 
  selectedPlanId,
  showTitle = true
}) => {
  const [plans, setPlans] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPlans = async () => {
    setLoading(true);
    try {
      console.log("Fetching subscription plans...");
      
      const { data, error } = await supabase.functions.invoke('stripe-products');
      
      if (error) {
        console.error("Error fetching subscription plans:", error);
        throw new Error(error.message);
      }
      
      console.log("Subscription plans response:", data);
      
      if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
        console.warn("No plans received from API, using fallback plans");
        
        // Use fallback plans if none received from API
        const fallbackPlans = [
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
        ];
        
        setPlans(fallbackPlans);
        if (onPlansLoaded) onPlansLoaded(fallbackPlans);
        return;
      }
      
      console.log("Plans data:", data.products);
      setPlans(data.products);
      
      // Notify parent component
      if (onPlansLoaded) onPlansLoaded(data.products);
      
    } catch (error) {
      console.error("Error loading plans:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos de assinatura",
        variant: "destructive"
      });
      
      // Use fallback plans on error
      const fallbackPlans = [
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
      ];
      
      setPlans(fallbackPlans);
      if (onPlansLoaded) onPlansLoaded(fallbackPlans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Nossos Planos</h2>
          <p className="text-muted-foreground">Escolha o plano que melhor atende às suas necessidades</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col h-full ${selectedPlanId === plan.id ? 'border-primary' : ''} ${plan.popular ? 'shadow-md' : ''}`}
          >
            <CardHeader className={`${plan.popular ? 'bg-primary/5' : ''}`}>
              {plan.popular && (
                <Badge variant="outline" className="mb-2 w-fit">
                  Mais popular
                </Badge>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-2xl font-bold">
                  {plan.price === 0 ? 'Grátis' : `R$${(plan.price / 100).toFixed(2)}`}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground">/mês</span>}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => onSelectPlan(plan)} 
                className="w-full"
                variant={selectedPlanId === plan.id ? "default" : "outline"}
              >
                {selectedPlanId === plan.id ? 'Plano selecionado' : 'Selecionar plano'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlansComparison;
