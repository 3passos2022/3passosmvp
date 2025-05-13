
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionStatus, SubscriptionData } from '@/lib/types/subscriptions';
import { useLocation, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SubscriptionManagerProps {
  selectedPlan: SubscriptionData | null;
  onPlanSelect: (plan: SubscriptionData) => void;
  availablePlans: SubscriptionData[];
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  selectedPlan, 
  onPlanSelect,
  availablePlans 
}) => {
  const { user, subscription, refreshSubscription, subscriptionLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [portalLoading, setPortalLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for plan in URL params
    const searchParams = new URLSearchParams(location.search);
    const planFromQuery = searchParams.get('plan');
    
    if (planFromQuery) {
      try {
        const parsedPlan = JSON.parse(decodeURIComponent(planFromQuery));
        if (parsedPlan && parsedPlan.id) {
          console.log("Plan found in URL:", parsedPlan);
          onPlanSelect(parsedPlan);
          
          // Clean URL
          window.history.replaceState({}, document.title, location.pathname);
        }
      } catch (error) {
        console.error("Error parsing plan data:", error);
      }
    }
    
    // Check subscription status on mount
    if (user) {
      refreshSubscription().catch(error => {
        console.error("Error checking subscription:", error);
      });
    }
  }, [user, location, onPlanSelect, refreshSubscription]);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar"
      });
      navigate('/login', { state: { returnTo: '/subscription' } });
      return;
    }
    
    if (!selectedPlan || !selectedPlan.priceId) {
      toast({
        title: "Erro",
        description: "Selecione um plano com preço válido para continuar"
      });
      return;
    }
    
    // If free plan, no checkout needed
    if (selectedPlan.tier === 'free') {
      toast({
        title: "Plano gratuito",
        description: 'Você já está no plano gratuito'
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log("Starting checkout for plan:", selectedPlan);
      
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId: selectedPlan.priceId,
          returnUrl: window.location.origin + '/subscription/success'
        }
      });
      
      if (error) {
        console.error("Error in stripe-checkout function:", error);
        throw new Error(`Erro ao processar pedido: ${error.message}`);
      }
      
      console.log("stripe-checkout response:", data);
      
      if (data?.url) {
        console.log("Redirecting to checkout URL:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error('Não foi possível obter o link de checkout');
      }
    } catch (error: any) {
      console.error('Error starting checkout:', error);
      toast({
        title: "Erro de pagamento",
        description: 'Erro ao processar pagamento: ' + (error.message || 'Tente novamente mais tarde'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !subscription?.subscribed) {
      return;
    }
    
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: { returnUrl: window.location.origin + '/subscription' }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        console.log("Redirecting to portal:", data.url);
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Erro",
        description: "Erro ao abrir portal do cliente: " + error.message,
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      toast({
        title: "Sucesso",
        description: "Informações de assinatura atualizadas"
      });
    } catch (error) {
      console.error("Error updating subscription data:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados da assinatura",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    console.log("Changing plan to ID:", planId);
    const plan = availablePlans.find(p => p.id === planId);
    if (plan) {
      onPlanSelect(plan);
      console.log("Selected plan:", plan);
    }
  };

  return (
    <Card className="z-10 relative" id="subscription-manager">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gerenciar Assinatura</CardTitle>
            <CardDescription>
              {subscriptionLoading ? 'Verificando status da assinatura...' : 
               (subscription?.subscribed 
                ? `Você tem uma assinatura ${subscription.subscription_tier === 'premium' ? 'Premium' : 'Básica'} ativa`
                : "Você não tem uma assinatura ativa")}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing || subscriptionLoading}
            title="Atualizar status da assinatura"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing || subscriptionLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptionLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : subscription?.subscribed ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">Plano atual:</p>
            <p className="font-medium">{subscription.subscription_tier === 'premium' ? 'Premium' : 'Básico'}</p>
            
            {subscription.subscription_end && (
              <>
                <p className="text-sm text-gray-500 mt-4 mb-2">Próxima cobrança:</p>
                <p className="font-medium">
                  {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
                </p>
              </>
            )}
          </div>
        ) : (
          <div>
            {availablePlans.length > 0 ? (
              <>
                <label className="text-sm text-gray-500 mb-2 block">Selecione um plano:</label>
                <Select 
                  value={selectedPlan?.id || ''} 
                  onValueChange={handlePlanChange}
                >
                  <SelectTrigger className="w-full mb-4">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price === 0 ? 'Grátis' : `R$${(plan.price / 100).toFixed(2)}/mês`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : null}

            {selectedPlan && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium mb-1">{selectedPlan.name}</p>
                <p className="text-sm mb-2">
                  {selectedPlan.price === 0 ? 'Grátis' : `R$${(selectedPlan.price / 100).toFixed(2)}/mês`}
                </p>
                <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {subscription?.subscribed ? (
          <Button 
            onClick={handleManageSubscription} 
            variant="outline" 
            className="w-full"
            disabled={portalLoading || subscriptionLoading}
          >
            {portalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Gerenciar Assinatura
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleSubscribe}
            className="w-full"
            disabled={loading || (selectedPlan && selectedPlan.tier === 'free') || !selectedPlan}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : !selectedPlan ? (
              "Ver Planos"
            ) : selectedPlan.tier === 'free' ? (
              "Plano gratuito já disponível"
            ) : (
              "Assinar Agora"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SubscriptionManager;
