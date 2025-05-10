import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há plano selecionado no navegador
    const searchParams = new URLSearchParams(location.search);
    const planFromQuery = searchParams.get('plan');
    
    if (planFromQuery) {
      try {
        const parsedPlan = JSON.parse(decodeURIComponent(planFromQuery));
        if (parsedPlan && parsedPlan.id) {
          onPlanSelect(parsedPlan);
          
          // Limpar parâmetro da URL
          const newUrl = location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (error) {
        console.error("Error parsing plan data:", error);
      }
    }
    
    const checkUserSubscription = async () => {
      if (user) {
        try {
          await refreshSubscriptionWithTimeout();
        } catch (error) {
          console.error("Erro ao verificar assinatura:", error);
          toast.error("Não foi possível verificar o status da sua assinatura");
        }
      }
    };
    
    checkUserSubscription();
    
    // Verificar mudanças de assinatura a cada 30 segundos
    const interval = setInterval(async () => {
      if (user) {
        try {
          await refreshSubscriptionWithTimeout();
        } catch (error) {
          console.error("Erro ao verificar assinatura no intervalo:", error);
        }
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, location, onPlanSelect]);

  // Função para atualizar assinatura com timeout
  const refreshSubscriptionWithTimeout = async () => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Tempo limite excedido ao verificar assinatura")), 10000);
    });

    try {
      await Promise.race([refreshSubscription(), timeoutPromise]);
    } catch (error) {
      console.error("Erro ao verificar assinatura (timeout):", error);
      // Não mostrar toast aqui para evitar múltiplos toasts
    }
  };

  const handleSubscribe = async () => {
    setCheckoutError(null);
    
    if (!user) {
      toast.error("Você precisa estar logado para assinar");
      return;
    }
    
    if (!selectedPlan || !selectedPlan.priceId) {
      toast.error("Selecione um plano válido para continuar");
      return;
    }
    
    // Se o plano for gratuito, não iniciar checkout
    if (selectedPlan.tier === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }
    
    setLoading(true);
    try {
      console.log("Iniciando checkout para o plano:", selectedPlan);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          tier: selectedPlan.tier,
          priceId: selectedPlan.priceId,
          returnUrl: window.location.origin + '/subscription/success'
        }
      });
      
      if (error) {
        throw new Error(error.message || "Erro ao iniciar checkout");
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      const errorMsg = (error as Error).message || "Tente novamente mais tarde";
      setCheckoutError(errorMsg);
      toast.error("Erro ao processar pagamento: " + errorMsg);
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
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { url: window.location.origin + '/profile/subscription' }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Erro ao abrir portal do cliente:", error);
      toast.error("Erro ao abrir portal do cliente: " + (error as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSubscriptionWithTimeout();
      toast.success("Informações de assinatura atualizadas");
    } catch (error) {
      console.error("Erro ao atualizar dados da assinatura:", error);
      toast.error("Erro ao atualizar dados da assinatura");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    const plan = availablePlans.find(p => p.id === planId);
    if (plan) {
      onPlanSelect(plan);
    }
  };

  const handleSubscribeAction = () => {
    if (!selectedPlan) {
      // If no plan is selected, navigate to subscription page
      navigate('/subscription');
      return;
    }
    
    // Otherwise proceed with normal subscription flow
    handleSubscribe();
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
            ) : (
              <div className="flex items-center p-3 bg-amber-50 rounded-md text-amber-700 mb-3">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">Não foi possível carregar os planos. Tente atualizar a página.</p>
              </div>
            )}

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
        
        {checkoutError && (
          <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            <p>Erro: {checkoutError}</p>
            <p className="mt-1">Por favor, tente novamente mais tarde ou entre em contato com o suporte.</p>
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
            onClick={handleSubscribeAction}
            className="w-full"
            disabled={loading || (selectedPlan && selectedPlan.tier === 'free')}
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
