
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface RequestedQuote {
  id: string;
  quote_id: string;
  status: string;
  created_at: string;
  quote: {
    id: string;
    description: string;
    service_id: string;
    sub_service_id: string;
    specialty_id: string;
    city: string;
    neighborhood: string;
    created_at: string;
    service: {
      name: string;
    };
    sub_service: {
      name: string;
    };
    specialty: {
      name: string;
    };
    client: {
      name: string;
    };
  };
}

const RequestedQuotes: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<RequestedQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchRequestedQuotes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('quote_providers')
          .select(`
            id, 
            quote_id, 
            status,
            created_at,
            quote:quotes (
              id, 
              description,
              service_id, 
              sub_service_id, 
              specialty_id, 
              city, 
              neighborhood, 
              created_at,
              service:services (name),
              sub_service:sub_services (name),
              specialty:specialties (name),
              client:profiles (name)
            )
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setQuotes(data || []);
      } catch (error) {
        console.error('Erro ao buscar orçamentos:', error);
        toast({
          title: "Erro ao carregar orçamentos",
          description: "Não foi possível carregar seus orçamentos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequestedQuotes();
  }, [user, toast]);

  const handleUpdateStatus = async (quoteProviderId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('quote_providers')
        .update({ status })
        .eq('id', quoteProviderId);

      if (error) {
        throw error;
      }

      // Atualizar o estado local
      setQuotes(prev => 
        prev.map(item => 
          item.id === quoteProviderId 
            ? { ...item, status } 
            : item
        )
      );

      toast({
        title: status === 'accepted' ? "Orçamento aceito" : "Orçamento rejeitado",
        description: status === 'accepted' 
          ? "Você aceitou este orçamento. O cliente será notificado." 
          : "Você rejeitou este orçamento.",
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do orçamento.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Nenhum orçamento solicitado</h3>
        <p className="text-muted-foreground mt-2">
          Você ainda não recebeu solicitações de orçamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Orçamentos Solicitados</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quotes.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">
                    {item.quote.service?.name || 'Serviço'} &gt; {item.quote.sub_service?.name || 'Subserviço'} &gt; {item.quote.specialty?.name || 'Especialidade'}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    Cliente: {item.quote.client?.name || 'Cliente anônimo'}
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    Local: {item.quote.neighborhood}, {item.quote.city}
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    Recebido em: {formatDate(item.created_at)}
                  </p>
                </div>
                
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100">
                  {item.status === 'pending' ? 'Pendente' : 
                   item.status === 'accepted' ? 'Aceito' :
                   item.status === 'rejected' ? 'Rejeitado' : 
                   item.status === 'completed' ? 'Concluído' : 'Status desconhecido'}
                </div>
              </div>
              
              {item.quote.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">
                    {item.quote.description}
                  </p>
                </div>
              )}
            </CardContent>
            
            {item.status === 'pending' && (
              <CardFooter className="p-4 bg-gray-50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(item.id, 'rejected')}
                >
                  <X className="h-4 w-4 mr-1" /> Recusar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUpdateStatus(item.id, 'accepted')}
                >
                  <Check className="h-4 w-4 mr-1" /> Aceitar
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RequestedQuotes;
