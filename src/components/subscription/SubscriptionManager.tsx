
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ExternalLink } from 'lucide-react';

const SubscriptionManager: React.FC = () => {
  const { user, checkSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const handleCheckout = async (tier: 'basic' | 'premium') => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar um plano');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Não foi possível obter o link de checkout');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento: ' + (error.message || 'Tente novamente mais tarde'));
    } finally {
      setLoading(false);
    }
  };
  
  const handlePortal = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { url: window.location.origin }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Não foi possível obter o link do portal');
      }
    } catch (error: any) {
      console.error('Erro ao acessar portal:', error);
      toast.error('Erro ao acessar portal de assinatura: ' + (error.message || 'Tente novamente mais tarde'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshStatus = async () => {
    if (!checkSubscription) return;
    
    setCheckingStatus(true);
    try {
      const result = await checkSubscription();
      if (result) {
        toast.success('Status de assinatura atualizado');
      } else {
        toast.error('Não foi possível verificar o status da assinatura');
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      toast.error('Erro ao verificar status da assinatura');
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    // Verificar assinatura automaticamente na montagem do componente
    if (user && !user.subscription_tier) {
      handleRefreshStatus();
    }
  }, [user]);

  if (!user) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status da Assinatura</span>
          <Button
            variant="outline" 
            size="sm"
            onClick={handleRefreshStatus}
            disabled={checkingStatus}
          >
            {checkingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Atualizar Status
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Plano atual:</span>
              <Badge variant={user.subscribed ? "default" : "outline"}>
                {user.subscription_tier === 'premium' ? 'Premium' : 
                 user.subscription_tier === 'basic' ? 'Básico' : 'Gratuito'}
              </Badge>
            </div>
            
            {user.subscribed && user.subscription_end && (
              <p className="text-sm text-muted-foreground">
                Validade: {format(new Date(user.subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {user.subscribed ? (
              <Button 
                onClick={handlePortal}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Gerenciar Assinatura
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => handleCheckout('basic')}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Assinar Plano Básico
                </Button>
                <Button 
                  onClick={() => handleCheckout('premium')}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Assinar Plano Premium
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
