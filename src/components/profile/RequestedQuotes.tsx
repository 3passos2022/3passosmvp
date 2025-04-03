
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface RequestedQuote {
  id: string;
  quoteId: string;
  status: string;
  created_at: string;
  quote: {
    id: string;
    service: string;
    subService: string;
    specialty: string;
    description: string;
    city: string;
    neighborhood: string;
    created_at: string;
  };
}

const RequestedQuotes: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<RequestedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user, tab]);

  const fetchQuotes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: quoteProviders, error: quoteProvidersError } = await supabase
        .from('quote_providers')
        .select(`
          id,
          quote_id,
          status,
          created_at,
          quotes!quote_id (
            id,
            description,
            city,
            neighborhood,
            created_at,
            services:service_id (name),
            sub_services:sub_service_id (name),
            specialties:specialty_id (name)
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (quoteProvidersError) throw quoteProvidersError;

      // Transform the data
      const transformedData: RequestedQuote[] = quoteProviders.map((item) => ({
        id: item.id,
        quoteId: item.quote_id,
        status: item.status,
        created_at: item.created_at,
        quote: {
          id: item.quotes?.id || '',
          service: item.quotes?.services?.name || 'Serviço não encontrado',
          subService: item.quotes?.sub_services?.name || 'Subserviço não encontrado',
          specialty: item.quotes?.specialties?.name || 'Especialidade não encontrada',
          description: item.quotes?.description || '',
          city: item.quotes?.city || '',
          neighborhood: item.quotes?.neighborhood || '',
          created_at: item.quotes?.created_at || '',
        }
      }));

      // Filter by tab
      const filteredQuotes = tab === 'all' 
        ? transformedData 
        : transformedData.filter(quote => quote.status === tab);

      setQuotes(filteredQuotes);
    } catch (error) {
      console.error('Erro ao buscar orçamentos solicitados:', error);
      toast.error('Erro ao carregar orçamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (quoteProviderId: string, action: 'accepted' | 'rejected') => {
    setActionLoading(quoteProviderId);
    try {
      const { error } = await supabase
        .from('quote_providers')
        .update({ status: action })
        .eq('id', quoteProviderId);

      if (error) throw error;

      toast.success(`Orçamento ${action === 'accepted' ? 'aceito' : 'rejeitado'} com sucesso!`);
      fetchQuotes();
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      toast.error('Erro ao processar sua solicitação. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Aceito</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Orçamentos Solicitados</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="accepted">Aceitos</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <p>Carregando orçamentos...</p>
            ) : quotes.length === 0 ? (
              <p className="text-muted-foreground">Nenhum orçamento encontrado.</p>
            ) : (
              quotes.map((quoteProvider) => (
                <Card key={quoteProvider.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <h3 className="text-lg font-semibold">{quoteProvider.quote.specialty}</h3>
                          {getStatusBadge(quoteProvider.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {quoteProvider.quote.service} &gt; {quoteProvider.quote.subService}
                        </p>
                        <p className="text-sm">
                          {quoteProvider.quote.neighborhood}, {quoteProvider.quote.city}
                        </p>
                        {quoteProvider.quote.description && (
                          <p className="text-sm line-clamp-2">{quoteProvider.quote.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Solicitado em {formatDate(quoteProvider.created_at)}
                        </p>
                      </div>

                      {quoteProvider.status === 'pending' && (
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline"
                            disabled={!!actionLoading}
                            onClick={() => handleAction(quoteProvider.id, 'rejected')}
                          >
                            {actionLoading === quoteProvider.id ? 'Processando...' : 'Rejeitar'}
                          </Button>
                          <Button
                            disabled={!!actionLoading}
                            onClick={() => handleAction(quoteProvider.id, 'accepted')}
                          >
                            {actionLoading === quoteProvider.id ? 'Processando...' : 'Aceitar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RequestedQuotes;
