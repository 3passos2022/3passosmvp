
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface RequestedQuote {
  id: string;
  quoteId: string;
  status: string;
  created_at: string;
  total_price?: number;
  quote: {
    id: string;
    service: string;
    subService: string;
    specialty: string;
    description: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    complement?: string;
    state: string;
    zip_code: string;
    created_at: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
  };
}

const RequestedQuotes: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<RequestedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState('pending');
  const [selectedQuote, setSelectedQuote] = useState<RequestedQuote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user, tab]);

  const fetchQuotes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar quote_providers com informações dos orçamentos
      const { data: quoteProviders, error: quoteProvidersError } = await supabase
        .from('quote_providers')
        .select(`
          id,
          quote_id,
          status,
          created_at,
          total_price,
          quotes!quote_id (
            id,
            description,
            city,
            neighborhood,
            street,
            number,
            complement,
            state,
            zip_code,
            created_at,
            client_id,
            status,
            services:service_id (name),
            sub_services:sub_service_id (name),
            specialties:specialty_id (name)
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (quoteProvidersError) throw quoteProvidersError;

      const quotesWithClientInfo = await Promise.all(
        quoteProviders.map(async (quoteProvider) => {
          let clientName = 'Cliente anônimo';
          let clientEmail = '';
          let clientPhone = '';

          if (quoteProvider.quotes?.client_id) {
            const { data: clientData, error: clientError } = await supabase
              .from('profiles')
              .select('name, phone')
              .eq('id', quoteProvider.quotes.client_id)
              .single();

            if (!clientError && clientData) {
              clientName = clientData.name || 'Nome não informado';
              clientPhone = clientData.phone || '';
              clientEmail = quoteProvider.quotes.client_id || '';
            }
          }

          // Verificar se existe avaliação para este orçamento
          // Se existe avaliação, o status deve ser 'completed'
          let finalStatus = quoteProvider.status;
          if (quoteProvider.status === 'accepted') {
            const { data: rating, error: ratingError } = await supabase
              .from('provider_ratings')
              .select('id')
              .eq('provider_id', user.id)
              .eq('quote_id', quoteProvider.quote_id)
              .single();

            if (!ratingError && rating) {
              finalStatus = 'completed';
            }
          }

          return {
            id: quoteProvider.id,
            quoteId: quoteProvider.quote_id,
            status: finalStatus,
            created_at: quoteProvider.created_at,
            total_price: quoteProvider.total_price,
            quote: {
              id: quoteProvider.quotes?.id || '',
              service: quoteProvider.quotes?.services?.name || 'Serviço não encontrado',
              subService: quoteProvider.quotes?.sub_services?.name || 'Subserviço não encontrado',
              specialty: quoteProvider.quotes?.specialties?.name || 'Especialidade não encontrada',
              description: quoteProvider.quotes?.description || '',
              city: quoteProvider.quotes?.city || '',
              neighborhood: quoteProvider.quotes?.neighborhood || '',
              street: quoteProvider.quotes?.street || '',
              number: quoteProvider.quotes?.number || '',
              complement: quoteProvider.quotes?.complement || '',
              state: quoteProvider.quotes?.state || '',
              zip_code: quoteProvider.quotes?.zip_code || '',
              created_at: quoteProvider.quotes?.created_at || '',
              clientName,
              clientEmail,
              clientPhone,
            }
          };
        })
      );

      // Filtrar os orçamentos de acordo com a aba selecionada
      let filteredQuotes;
      if (tab === 'all') {
        filteredQuotes = quotesWithClientInfo;
      } else {
        filteredQuotes = quotesWithClientInfo.filter(quote => quote.status === tab);
      }

      console.log(`Aba atual: ${tab}, Total orçamentos: ${quotesWithClientInfo.length}, Filtrados: ${filteredQuotes.length}`);
      console.log('Status dos orçamentos:', quotesWithClientInfo.map(q => q.status));
      
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
      console.log(`Atualizando orçamento ${quoteProviderId} para ${action}`);
      
      const { error } = await supabase
        .from('quote_providers')
        .update({ 
          status: action 
        })
        .eq('id', quoteProviderId)
        .eq('provider_id', user?.id);

      if (error) {
        console.error('Erro ao atualizar orçamento:', error);
        throw error;
      }

      // Atualiza o estado local imediatamente
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote.id === quoteProviderId 
            ? { ...quote, status: action } 
            : quote
        )
      );

      // Se estamos em uma aba específica, e o status mudou, esse item deve ser removido da lista atual
      if (tab !== 'all' && tab !== action) {
        setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteProviderId));
      }
      
      toast.success(`Orçamento ${action === 'accepted' ? 'aceito' : 'rejeitado'} com sucesso!`);
      
      // Recarrega todos os orçamentos após uma pequena pausa para dar tempo ao banco de dados sincronizar
      setTimeout(() => {
        fetchQuotes();
      }, 500);
    } catch (error: any) {
      console.error('Erro ao processar orçamento:', error);
      toast.error(`Erro ao ${action === 'accepted' ? 'aceitar' : 'rejeitar'} orçamento. Tente novamente.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (quote: RequestedQuote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
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
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : quotes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum orçamento encontrado.
              </p>
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

                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => handleViewDetails(quoteProvider)}
                        >
                          Ver Detalhes
                        </Button>

                        {quoteProvider.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline"
                              disabled={!!actionLoading}
                              onClick={() => handleAction(quoteProvider.id, 'rejected')}
                            >
                              {actionLoading === quoteProvider.id ? (
                                <LoadingSpinner />
                              ) : null}
                              Rejeitar
                            </Button>
                            <Button
                              disabled={!!actionLoading}
                              onClick={() => handleAction(quoteProvider.id, 'accepted')}
                            >
                              {actionLoading === quoteProvider.id ? (
                                <LoadingSpinner />
                              ) : null}
                              Aceitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent>
          {selectedQuote && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Orçamento</DialogTitle>
                <DialogDescription>
                  Solicitado em {formatDate(selectedQuote.created_at)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Informações do Serviço</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Serviço</p>
                        <p>{selectedQuote.quote.service}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Subserviço</p>
                        <p>{selectedQuote.quote.subService}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Especialidade</p>
                        <p>{selectedQuote.quote.specialty}</p>
                      </div>
                      {selectedQuote.quote.description && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Descrição</p>
                          <p>{selectedQuote.quote.description}</p>
                        </div>
                      )}
                      {selectedQuote.total_price && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Valor Estimado</p>
                          <p className="font-medium">R$ {selectedQuote.total_price.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Informações do Cliente</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nome</p>
                        <p>{selectedQuote.quote.clientName}</p>
                      </div>
                      {selectedQuote.quote.clientEmail && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p>{selectedQuote.quote.clientEmail}</p>
                        </div>
                      )}
                      {selectedQuote.quote.clientPhone && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Telefone</p>
                          <p>{selectedQuote.quote.clientPhone}</p>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold mb-2 mt-4">Endereço</h3>
                    <div className="space-y-2">
                      <p>
                        {selectedQuote.quote.street}, {selectedQuote.quote.number}
                        {selectedQuote.quote.complement && `, ${selectedQuote.quote.complement}`}
                      </p>
                      <p>
                        {selectedQuote.quote.neighborhood}, {selectedQuote.quote.city} - {selectedQuote.quote.state}
                      </p>
                      <p>CEP: {selectedQuote.quote.zip_code}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestedQuotes;
