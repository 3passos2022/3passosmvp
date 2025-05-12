import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import SubscriptionCard from './SubscriptionCard';
import { SubscriptionData } from '@/lib/types/subscriptions';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface PlansComparisonProps {
  showTitle?: boolean;
  onSelectPlan?: (plan: SubscriptionData) => void;
  onPlansLoaded?: (plans: SubscriptionData[]) => void;
  selectedPlanId?: string;
}

// Chave para armazenamento em cache
const CACHE_KEY = 'subscription_plans_cache';
// Tempo de expiração do cache em milissegundos (10 minutos)
const CACHE_EXPIRY = 10 * 60 * 1000;

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
    priceId: 'price_basic'
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
    priceId: 'price_premium'
  }
];

// Interface para o cache
interface PlansCache {
  products: SubscriptionData[];
  timestamp: number;
}

const PlansComparison: React.FC<PlansComparisonProps> = ({ 
  showTitle = true,
  onSelectPlan,
  onPlansLoaded,
  selectedPlanId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionData[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const [retryCount, setRetryCount] = useState(0);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [networkError, setNetworkError] = useState<boolean>(false);
  
  const currentTier = user?.subscription_tier || 'free';
  
  // Função para verificar a conectividade com a rede
  const checkNetworkConnectivity = useCallback(async () => {
    try {
      // Use timeout sem AbortController para evitar problemas de compatibilidade
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido na verificação de conectividade")), 3000);
      });
      
      const fetchPromise = fetch('https://www.google.com', { method: 'HEAD' });
      
      // Usar race para implementar timeout sem signal
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as Response;
      
      return response.ok;
    } catch (error) {
      console.error("Erro ao verificar conectividade:", error);
      return false;
    }
  }, []);
  
  // Função para salvar dados no cache
  const savePlansToCache = useCallback((productsData: SubscriptionData[]) => {
    try {
      const cacheData: PlansCache = {
        products: productsData,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log("Planos salvos em cache:", productsData);
    } catch (error) {
      console.error("Erro ao salvar planos em cache:", error);
    }
  }, []);
  
  // Função para recuperar dados do cache
  const getPlansFromCache = useCallback((): SubscriptionData[] | null => {
    try {
      const cacheJson = localStorage.getItem(CACHE_KEY);
      if (!cacheJson) return null;
      
      const cache: PlansCache = JSON.parse(cacheJson);
      const now = Date.now();
      
      // Verificar se o cache expirou
      if (now - cache.timestamp > CACHE_EXPIRY) {
        console.log("Cache expirado");
        return null;
      }
      
      console.log("Planos recuperados do cache:", cache.products);
      return cache.products;
    } catch (error) {
      console.error("Erro ao recuperar planos do cache:", error);
      return null;
    }
  }, []);

  // Implementação do exponential backoff para retry
  const getBackoffTime = useCallback((retryAttempt: number): number => {
    return Math.min(Math.pow(2, retryAttempt) * 1000, 30000);
  }, []);
  
  const fetchPlans = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setNetworkError(false);
    
    // Se não estamos forçando refresh, verificar cache primeiro
    if (!forceRefresh) {
      const cachedPlans = getPlansFromCache();
      if (cachedPlans) {
        setPlans(cachedPlans);
        setIsUsingCache(true);
        setLoading(false);
        
        if (onPlansLoaded) {
          onPlansLoaded(cachedPlans);
        }
        
        console.log("Usando dados do cache enquanto atualizamos");
        
        // Ainda assim, tentamos atualizar o cache em background
        // mas não bloqueamos a UI esperando pelo resultado
        setTimeout(() => {
          fetchPlansFromApi(true);
        }, 100);
        
        return;
      }
    }
    
    // Se não temos cache ou estamos forçando refresh, buscar da API
    await fetchPlansFromApi(false);
  }, [getPlansFromCache, onPlansLoaded]);
  
  const fetchPlansFromApi = useCallback(async (isBackgroundFetch = false) => {
    if (!isBackgroundFetch) {
      setLoading(true);
      setError(null);
    }
    
    try {
      console.log("Verificando conectividade de rede...");
      const isConnected = await checkNetworkConnectivity();
      
      if (!isConnected) {
        console.log("Sem conectividade de rede detectada");
        setNetworkError(true);
        
        // Se não temos conexão, usar dados do cache ou fallback
        const cachedPlans = getPlansFromCache();
        if (cachedPlans) {
          console.log("Usando dados em cache devido a problemas de rede");
          setPlans(cachedPlans);
          setIsUsingCache(true);
          setIsUsingFallback(false);
        } else {
          console.log("Usando planos padrão devido a problemas de rede");
          setPlans(DEFAULT_SUBSCRIPTION_PLANS);
          setIsUsingCache(false);
          setIsUsingFallback(true);
        }
        
        if (!isBackgroundFetch) {
          setLoading(false);
          setError("Não foi possível conectar à internet. Usando dados disponíveis offline.");
        }
        
        // Notificar mesmo com dados em cache
        if (onPlansLoaded) {
          onPlansLoaded(cachedPlans || DEFAULT_SUBSCRIPTION_PLANS);
        }
        
        return;
      }
      
      console.log("Iniciando busca por planos do Stripe...");
      
      // Implementar timeout sem usar controller.signal
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao buscar planos")), 8000);
      });
      
      const functionPromise = supabase.functions.invoke('get-stripe-products');
      
      // Usar race para implementar timeout
      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise.then(() => {
          throw new Error("Tempo limite excedido ao buscar planos");
        })
      ]);
      
      if (error) {
        console.error("Erro na função get-stripe-products:", error);
        throw new Error(`Falha ao buscar planos: ${error.message}`);
      }
      
      console.log("Resposta da função get-stripe-products:", data);
      
      if (data && data.products && data.products.length > 0) {
        // Garantir que pelo menos temos o plano gratuito
        let stripePlans = data.products;
        
        if (!stripePlans.find(p => p.tier === 'free')) {
          stripePlans = [DEFAULT_SUBSCRIPTION_PLANS[0], ...stripePlans];
        }
        
        // Ordenar por preço
        stripePlans.sort((a, b) => a.price - b.price);
        
        // Atualizar estado e salvar em cache
        setPlans(stripePlans);
        savePlansToCache(stripePlans);
        setIsUsingCache(false);
        setIsUsingFallback(false);
        
        console.log("Planos carregados do Stripe:", stripePlans);

        // Notificar o componente pai sobre os planos carregados
        if (onPlansLoaded) {
          onPlansLoaded(stripePlans);
        }
        
        setError(null);
      } else {
        console.log("Resposta vazia ou inválida, usando planos padrão");
        setPlans(DEFAULT_SUBSCRIPTION_PLANS);
        setIsUsingCache(false);
        setIsUsingFallback(true);
        
        // Mesmo com os planos padrão, notificamos o componente pai
        if (onPlansLoaded) {
          onPlansLoaded(DEFAULT_SUBSCRIPTION_PLANS);
        }
        
        if (!isBackgroundFetch) {
          setError("Não foi possível carregar os planos de assinatura do servidor, usando planos padrão.");
        }
      }
    } catch (error: any) {
      console.error("Erro ao buscar planos do Stripe:", error);
      
      // Verificar se é um erro de rede
      const isNetworkError = 
        error.name === 'AbortError' || 
        error.message.includes('network') || 
        error.message.includes('fetch') || 
        error.message.includes('tempo limite') ||
        error.message.includes('timeout');
      
      if (isNetworkError) {
        setNetworkError(true);
      }
      
      // Tentar usar cache em caso de erro
      const cachedPlans = getPlansFromCache();
      if (cachedPlans) {
        console.log("Usando dados em cache devido a erro na API");
        setPlans(cachedPlans);
        setIsUsingCache(true);
        setIsUsingFallback(false);
      } else {
        console.log("Usando planos padrão devido a erro na API");
        setPlans(DEFAULT_SUBSCRIPTION_PLANS);
        setIsUsingCache(false);
        setIsUsingFallback(true);
      }
      
      if (!isBackgroundFetch) {
        // Mensagem de erro mais detalhada
        setError(`Não foi possível carregar os planos de assinatura. Detalhes: ${error.message || "Erro desconhecido"}`);
      }
      
      // Mesmo com erro, notificamos o componente pai
      if (onPlansLoaded) {
        onPlansLoaded(cachedPlans || DEFAULT_SUBSCRIPTION_PLANS);
      }
    } finally {
      if (!isBackgroundFetch) {
        setLoading(false);
      }
    }
  }, [checkNetworkConnectivity, getPlansFromCache, savePlansToCache, onPlansLoaded]);
  
  useEffect(() => {
    fetchPlans();
    
    // Programar retry automático com backoff exponencial
    if (retryCount > 0) {
      const timeoutId = setTimeout(() => {
        console.log(`Tentativa #${retryCount+1} de carregar planos...`);
        fetchPlans(true);
      }, getBackoffTime(retryCount));
      
      return () => clearTimeout(timeoutId);
    }
  }, [retryCount, fetchPlans, getBackoffTime]);
  
  const handleSelect = (plan: SubscriptionData) => {
    if (onSelectPlan) {
      console.log("Plano selecionado:", plan);
      onSelectPlan(plan);
    } else if (!user) {
      navigate('/login', { state: { returnTo: '/subscription' } });
    } else {
      navigate('/subscription', { state: { selectedPlan: plan } });
    }
  };
  
  const handleRetry = () => {
    toast.info("Tentando novamente carregar os planos...");
    setRetryCount(prev => prev + 1);
    fetchPlans(true);
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
      
      {(isUsingCache || isUsingFallback) && !error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              {isUsingCache 
                ? "Mostrando planos salvos anteriormente. " 
                : "Mostrando planos padrão. "}
              {networkError 
                ? "Verifique sua conexão com a internet." 
                : "Tentando atualizar em segundo plano..."}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry} 
            className="ml-4 whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar agora
          </Button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center mb-6">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry} 
            className="ml-4 whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      )}
      
      {loading && !isUsingCache && !isUsingFallback ? (
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
