
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionStatus } from '@/lib/types/subscriptions';

const SubscriptionManager: React.FC = () => {
  const { user, subscription, refreshSubscription, subscriptionLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [portalLoading, setPortalLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const checkUserSubscription = async () => {
      if (user) {
        try {
          await refreshSubscription();
        } catch (error) {
          console.error("Failed to check subscription:", error);
        }
      }
    };
    
    checkUserSubscription();
    
    // Poll for subscription status changes every 30 seconds while on this page
    const interval = setInterval(async () => {
      if (user) {
        try {
          await refreshSubscription();
        } catch (error) {
          console.error("Failed to check subscription in interval:", error);
        }
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar");
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao iniciar checkout: " + (error as Error).message);
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
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao abrir portal do cliente: " + (error as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      toast.success("Informações de assinatura atualizadas");
    } catch (error) {
      console.error("Error refreshing subscription data:", error);
      toast.error("Erro ao atualizar dados da assinatura");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
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
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
          <p className="text-sm">
            Assine agora para acessar recursos premium e impulsionar seu negócio.
          </p>
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
            disabled={loading || subscriptionLoading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
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
