import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw, Calendar, Receipt } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PlansComparison from './PlansComparison';

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const SubscriptionManager: React.FC = () => {
  const { user, subscription, refreshSubscription, subscriptionLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [portalLoading, setPortalLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (user && !hasLoaded) {
      const checkUserSubscription = async () => {
        try {
          await refreshSubscription();
          loadNotifications();
          setLastRefreshTime(Date.now());
          setHasLoaded(true);
        } catch (error) {
          console.error("Failed to check subscription:", error);
        }
      };
      checkUserSubscription();
    }
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    
    setNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('type', 'subscription')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: 'basic' } // Default to basic plan
      });
      
      if (error) {
        console.error("Checkout error:", error);
        throw new Error(error.message || "Erro ao iniciar checkout");
      }
      
      if (data?.url) {
        console.log("Redirecting to checkout:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erro no checkout",
        description: "Erro ao iniciar checkout: " + error.message,
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
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Erro",
        description: "Erro ao abrir portal do cliente: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Prevent refreshing if it happened in the last 5 seconds
    const currentTime = Date.now();
    if (currentTime - lastRefreshTime < 5000) {
      toast({
        title: "Aguarde",
        description: "Por favor aguarde alguns segundos entre atualizações"
      });
      return;
    }

    setRefreshing(true);
    try {
      await refreshSubscription();
      await loadNotifications();
      toast({
        title: "Atualizado",
        description: "Informações de assinatura atualizadas"
      });
      setLastRefreshTime(currentTime);
    } catch (error) {
      console.error("Error refreshing subscription data:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados da assinatura",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500">Período de Teste</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-500">Gratuito</Badge>;
    }
  };

  // If no subscription is active, render the PlansComparison component
  if (!subscriptionLoading && subscription && !subscription.subscribed) {
    return (
      <div className="space-y-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Gerencie sua Assinatura</CardTitle>
            <CardDescription>
              Selecione um dos nossos planos para acessar recursos exclusivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Você não possui uma assinatura ativa. Escolha um dos planos abaixo para desbloquear recursos premium.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <PlansComparison />
      </div>
    );
  }

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
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Plano atual:</p>
                <p className="font-medium">{subscription.subscription_tier === 'premium' ? 'Premium' : 'Básico'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Status:</p>
                {subscription.subscription_status && getStatusBadge(subscription.subscription_status)}
              </div>
            </div>
            
            {subscription.trial_end && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">Período de teste ativo</p>
                    <p className="text-xs text-blue-600">
                      Seu período de teste termina em {new Date(subscription.trial_end).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {subscription.subscription_end && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Próxima cobrança:</p>
                  <p className="font-medium">
                    {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
            
            {subscription.last_invoice_url && (
              <div className="flex items-center">
                <Receipt className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Último pagamento:</p>
                  <a 
                    href={subscription.last_invoice_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    Ver fatura <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
            
            {subscription.next_invoice_amount && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Próxima cobrança:</p>
                <p className="font-medium">
                  {formatCurrency(subscription.next_invoice_amount)}
                </p>
              </div>
            )}
            
            {subscription.subscription_status === 'past_due' && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  Detectamos um problema com seu pagamento. Por favor, atualize seus dados de pagamento 
                  para evitar a suspensão do serviço.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Assine agora para acessar recursos premium e impulsionar seu negócio.
            </p>
            
            {user?.role === 'provider' && (
              <Alert className="bg-blue-50 border-blue-200">
                <div className="flex items-start">
                  <div className="rounded-full bg-blue-100 p-1 mr-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <AlertDescription className="text-blue-800 text-sm">
                    <span className="font-semibold">Prestadores ganham 30 dias grátis!</span> Experimente o plano básico sem compromisso.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        )}
        
        {notifications.length > 0 && !subscriptionLoading && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">Atualizações recentes</p>
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-3 rounded-md text-sm ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
              >
                <p className="font-medium">{notification.title}</p>
                <p className="text-gray-600 text-xs">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleDateString('pt-BR', { 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
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
            disabled={loading || subscriptionLoading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : user?.role === 'provider' ? (
              "Assinar com 30 dias grátis"
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
