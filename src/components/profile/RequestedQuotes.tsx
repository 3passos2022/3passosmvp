
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import QuoteDetailsSummary from '@/components/quoteRequest/QuoteDetailsSummary';

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
    service_date?: string;
    service_end_date?: string;
    service_time_preference?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    items?: Record<string, number>;
    itemNames?: Record<string, string>;
    questions?: Record<string, { question: string, answer: string }>;
    measurements?: {
      id: string;
      roomName: string;
      width: number;
      length: number;
      height?: number;
      measurementType?: 'square_meter' | 'linear_meter';
    }[];
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
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

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
          total_price,
          allow_contact,
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
            service_date,
            service_end_date,
            service_time_preference,
            services:service_id (name),
            sub_services:sub_service_id (name),
            specialties:specialty_id (name),
            quote_items (
              quantity,
              service_items (id, name)
            ),
            quote_measurements (
              id, room_name, width, length, height
            ),
            quote_answers (
              service_questions (id, question),
              question_options (option_text)
            )
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
              if (quoteProvider.allow_contact) {
                clientName = clientData.name || 'Nome não informado';
                clientPhone = clientData.phone || '';
                clientEmail = quoteProvider.quotes.client_id || '';
              } else {
                clientName = 'Cliente (Contato protegido)';
                clientPhone = 'Confidencial';
                clientEmail = 'Confidencial';
              }
            }
          }

          const items: Record<string, number> = {};
          const itemNames: Record<string, string> = {};
          if (quoteProvider.quotes?.quote_items) {
            quoteProvider.quotes.quote_items.forEach((item: any) => {
              if (item.service_items) {
                const itemId = item.service_items.id;
                items[itemId] = item.quantity;
                itemNames[itemId] = item.service_items.name;
              }
            });
          }

          const measurements = quoteProvider.quotes?.quote_measurements?.map((m: any) => ({
            id: m.id,
            roomName: m.room_name || 'Ambiente',
            width: m.width,
            length: m.length,
            height: m.height,
            measurementType: 'square_meter' as 'square_meter' | 'linear_meter'
          })) || [];

          const questions: Record<string, { question: string, answer: string }> = {};
          if (quoteProvider.quotes?.quote_answers) {
            quoteProvider.quotes.quote_answers.forEach((ans: any) => {
              if (ans.service_questions && ans.question_options) {
                questions[ans.service_questions.id] = {
                  question: ans.service_questions.question,
                  answer: ans.question_options.option_text
                };
              }
            });
          }

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
              service_date: quoteProvider.quotes?.service_date,
              service_end_date: quoteProvider.quotes?.service_end_date,
              service_time_preference: quoteProvider.quotes?.service_time_preference,
              clientName,
              clientEmail,
              clientPhone,
              items,
              itemNames,
              questions,
              measurements
            }
          };
        })
      );

      let filteredQuotes;
      if (tab === 'all') {
        filteredQuotes = quotesWithClientInfo;
      } else {
        filteredQuotes = quotesWithClientInfo.filter(quote => quote.status === tab);
      }

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
        .eq('id', quoteProviderId)
        .eq('provider_id', user?.id);

      if (error) throw error;

      setQuotes(prevQuotes =>
        prevQuotes.map(quote =>
          quote.id === quoteProviderId
            ? { ...quote, status: action }
            : quote
        )
      );

      if (tab !== 'all' && tab !== action) {
        setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteProviderId));
      }

      toast.success(`Orçamento ${action === 'accepted' ? 'aceito' : 'rejeitado'} com sucesso!`);
      setTimeout(() => fetchQuotes(), 500);
    } catch (error: any) {
      console.error('Erro ao processar orçamento:', error);
      toast.error('Erro ao atualizar orçamento. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!quoteToDelete) return;

    try {
      const { data, error } = await supabase
        .from('quote_providers')
        .delete()
        .eq('id', quoteToDelete)
        .eq('provider_id', user?.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Não foi possível excluir. Verifique suas permissões.');
        return;
      }

      setQuotes(prev => prev.filter(q => q.id !== quoteToDelete));
      toast.success('Orçamento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast.error('Erro ao excluir orçamento');
    } finally {
      setQuoteToDelete(null);
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
                        <p className="text-xs text-muted-foreground">
                          Solicitado em {formatDate(quoteProvider.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleViewDetails(quoteProvider)}
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setQuoteToDelete(quoteProvider.id)}
                            title="Excluir orçamento"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>

                        {quoteProvider.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              disabled={!!actionLoading}
                              onClick={() => handleAction(quoteProvider.id, 'rejected')}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              {actionLoading === quoteProvider.id ? <LoadingSpinner /> : 'Rejeitar'}
                            </Button>
                            <Button
                              disabled={!!actionLoading}
                              onClick={() => handleAction(quoteProvider.id, 'accepted')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === quoteProvider.id ? <LoadingSpinner /> : 'Aceitar'}
                            </Button>
                          </div>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedQuote && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Orçamento</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <QuoteDetailsSummary
                  formData={{
                    fullName: selectedQuote.quote.clientName,
                    serviceName: selectedQuote.quote.service,
                    subServiceName: selectedQuote.quote.subService,
                    specialtyName: selectedQuote.quote.specialty,
                    description: selectedQuote.quote.description,
                    street: selectedQuote.quote.street,
                    number: selectedQuote.quote.number,
                    complement: selectedQuote.quote.complement,
                    neighborhood: selectedQuote.quote.neighborhood,
                    city: selectedQuote.quote.city,
                    state: selectedQuote.quote.state,
                    zipCode: selectedQuote.quote.zip_code,
                    questions: selectedQuote.quote.questions,
                    itemQuantities: selectedQuote.quote.items,
                    itemNames: selectedQuote.quote.itemNames,
                    measurements: selectedQuote.quote.measurements,
                    serviceDate: selectedQuote.quote.service_date ? new Date(selectedQuote.quote.service_date) : undefined,
                    serviceEndDate: selectedQuote.quote.service_end_date ? new Date(selectedQuote.quote.service_end_date) : undefined,
                    serviceTimePreference: selectedQuote.quote.service_time_preference
                  }}
                  totalPrice={selectedQuote.total_price}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!quoteToDelete} onOpenChange={() => setQuoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento da sua lista? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RequestedQuotes;
