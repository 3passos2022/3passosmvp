import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw, ChevronDown, AlertCircle, WifiOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
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
  const [networkAvailable, setNetworkAvailable] = useState<boolean>(true);
  const [connectionChecking, setConnectionChecking] = useState<boolean>(false);
  const [retryAttempts, setRetryAttempts] = useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Função para verificar a conectividade com a rede
  const checkNetworkConnectivity = useCallback(async () => {
    setConnectionChecking(true);
    try {
      // Use AbortController para implementar timeout sem usar signal na função
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Tentativa de fetch para um serviço confiável
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        // Não usamos controller.signal aqui para compatibilidade
      });
      
      clearTimeout(timeoutId);
      const isConnected = response.ok;
      setNetworkAvailable(isConnected);
      return isConnected;
    } catch (error) {
      console.error("Erro ao verificar conectividade:", error);
      setNetworkAvailable(false);
      return false;
    } finally {
      setConnectionChecking(false);
    }
  }, []);

  useEffect(() => {
    // Verificar se há plano selecionado no navegador
    const searchParams = new URLSearchParams(location.search);
    const planFromQuery = searchParams.get('plan');
    
    if (planFromQuery) {
      try {
        const parsedPlan = JSON.parse(decodeURIComponent(planFromQuery));
        if (parsedPlan && parsedPlan.id) {
          console.log("Plano encontrado na URL:", parsedPlan);
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
        }
      }
    };
    
    // Verificar conectividade de rede primeiro
    checkNetworkConnectivity().then(isConnected => {
      if (isConnected) {
        checkUserSubscription();
      } else {
        console.log("Sem conectividade de rede detectada, não verificando assinatura");
        toast({
          title: "Erro de conexão",
          description: "Sem conexão com a internet. Algumas funcionalidades podem estar limitadas.",
          variant: "destructive"
        });
      }
    });
    
    // Verificar mudanças de assinatura a cada 30 segundos se estiver na página de assinatura
    const interval = setInterval(async () => {
      if (user && location.pathname.includes('subscription')) {
        const isConnected = await checkNetworkConnectivity();
        if (isConnected) {
          try {
            await refreshSubscriptionWithTimeout();
          } catch (error) {
            console.error("Erro ao verificar assinatura no intervalo:", error);
          }
        }
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, location, onPlanSelect, checkNetworkConnectivity]);

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
    
    // Se o plano for gratuito, não iniciar checkout
    if (selectedPlan.tier === 'free') {
      toast({
        title: "Plano gratuito",
        description: 'Você já está no plano gratuito'
      });
      return;
    }
    
    // Verificar conectividade primeiro
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      toast({
        title: "Erro de conexão",
        description: "Sem conexão com a internet. Não é possível iniciar o checkout.",
        variant: "destructive"
      });
      setCheckoutError("Sem conexão com a internet. Tente novamente quando estiver online.");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Iniciando checkout para o plano:", selectedPlan);
      
      // Implementar timeout sem usar controller.signal
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao iniciar checkout")), 10000);
      });
      
      const functionPromise = supabase.functions.invoke('create-checkout', {
        body: {
          tier: selectedPlan.tier,
          priceId: selectedPlan.priceId,
          returnUrl: window.location.origin + '/subscription/success'
        }
      });
      
      // Usar race para implementar timeout
      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise.then(() => {
          throw new Error("Tempo limite excedido ao iniciar checkout");
        })
      ]);
      
      console.log("Resposta do create-checkout:", data, error);
      
      if (error) {
        throw new Error(error.message || "Erro ao iniciar checkout");
      }
      
      if (data?.url) {
        console.log("Redirecionando para checkout:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error: any) {
      console.error("Erro ao iniciar checkout:", error);
      
      // Análise específica de erros de timeout ou rede
      const isNetworkError = 
        error.name === 'AbortError' || 
        error.message.includes('network') || 
        error.message.includes('fetch') || 
        error.message.includes('tempo limite') ||
        error.message.includes('timeout');
      
      if (isNetworkError) {
        setRetryAttempts(prev => prev + 1);
        
        if (retryAttempts < 2) {
          toast({
            title: "Erro de conexão",
            description: "Problemas de conexão detectados. Tentando novamente..."
          });
          setTimeout(() => handleSubscribe(), 1000 * Math.pow(2, retryAttempts));
          return;
        }
      }
      
      const errorMsg = isNetworkError
        ? "Não foi possível conectar ao servidor de pagamentos. Verifique sua conexão e tente novamente."
        : (error.message || "Tente novamente mais tarde");
      
      setCheckoutError(errorMsg);
      toast({
        title: "Erro de pagamento",
        description: "Erro ao processar pagamento: " + errorMsg,
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
    
    // Verificar conectividade primeiro
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      toast({
        title: "Erro de conexão",
        description: "Sem conexão com a internet. Não é possível acessar o portal de gerenciamento.",
        variant: "destructive"
      });
      return;
    }
    
    setPortalLoading(true);
    try {
      // Implementar timeout sem usar controller.signal
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao acessar portal do cliente")), 10000);
      });
      
      const functionPromise = supabase.functions.invoke('customer-portal', {
        body: { url: window.location.origin + '/profile/subscription' }
      });
      
      // Usar race para implementar timeout
      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise.then(() => {
          throw new Error("Tempo limite excedido ao acessar portal do cliente");
        })
      ]);
      
      console.log("Resposta do customer-portal:", data, error);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        console.log("Redirecionando para portal:", data.url);
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Erro ao abrir portal do cliente:", error);
      
      // Análise específica de erros de timeout ou rede
      const isNetworkError = 
        error.name === 'AbortError' || 
        error.message.includes('network') || 
        error.message.includes('fetch') || 
        error.message.includes('tempo limite') ||
        error.message.includes('timeout');
      
      const errorMsg = isNetworkError
        ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
        : error.message;
      
      toast({
        title: "Erro",
        description: "Erro ao abrir portal do cliente: " + errorMsg,
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Verificar conectividade primeiro
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        toast({
          title: "Erro de conexão",
          description: "Sem conexão com a internet. Não é possível atualizar as informações.",
          variant: "destructive"
        });
        return;
      }
      
      await refreshSubscriptionWithTimeout();
      toast({
        title: "Sucesso",
        description: "Informações de assinatura atualizadas"
      });
    } catch (error) {
      console.error("Erro ao atualizar dados da assinatura:", error);
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
    console.log("Alterando plano para ID:", planId);
    const plan = availablePlans.find(p => p.id === planId);
    if (plan) {
      onPlanSelect(plan);
      console.log("Plano selecionado:", plan);
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

  const handleVerifyConnection = async () => {
    const isConnected = await checkNetworkConnectivity();
    if (isConnected) {
      toast({
        title: "Conexão restaurada",
        description: "Conexão com a internet restaurada!"
      });
      setTimeout(() => handleRefresh(), 500);
    } else {
      toast({
        title: "Sem conexão",
        description: "Ainda sem conexão com a internet.",
        variant: "destructive"
      });
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
          <div className="flex items-center gap-2">
            {!networkAvailable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVerifyConnection}
                disabled={connectionChecking}
                title="Verificar conexão"
                className="text-orange-500"
              >
                <WifiOff className={`h-4 w-4 ${connectionChecking ? 'animate-pulse' : ''}`} />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing || subscriptionLoading || !networkAvailable}
              title="Atualizar status da assinatura"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing || subscriptionLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!networkAvailable && (
          <div className="flex items-center p-3 mb-4 bg-orange-50 border border-orange-200 rounded-md">
            <WifiOff className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-700">
                Sem conexão com a internet. Algumas funcionalidades estão indisponíveis.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleVerifyConnection}
              disabled={connectionChecking}
              className="ml-2 whitespace-nowrap"
            >
              {connectionChecking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar
            </Button>
          </div>
        )}
        
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            <p className="font-medium">Erro: {checkoutError}</p>
            <p className="mt-1">Por favor, tente novamente ou entre em contato com o suporte.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {subscription?.subscribed ? (
          <Button 
            onClick={handleManageSubscription} 
            variant="outline" 
            className="w-full"
            disabled={portalLoading || subscriptionLoading || !networkAvailable}
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
            disabled={loading || (selectedPlan && selectedPlan.tier === 'free') || !selectedPlan || !networkAvailable}
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
            ) : !networkAvailable ? (
              "Sem conexão com a internet"
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
