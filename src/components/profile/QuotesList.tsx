import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';
import { QuoteWithProviders } from '@/lib/types/providerMatch';
import QuoteDetails from './QuoteDetails';

const QuotesList: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteWithProviders[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithProviders | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedProviderName, setSelectedProviderName] = useState<string>('');
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
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id, 
          status, 
          description, 
          city, 
          neighborhood,
          street,
          number,
          complement,
          state,
          created_at,
          services!service_id (name),
          sub_services!sub_service_id (name),
          specialties!specialty_id (name),
          quote_providers (
            id,
            provider_id,
            status,
            profiles!provider_id (name)
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      const quotesWithProviders: QuoteWithProviders[] = quotesData.map(quote => ({
        id: quote.id,
        status: quote.status,
        description: quote.description,
        city: quote.city,
        neighborhood: quote.neighborhood,
        created_at: quote.created_at,
        serviceName: quote.services?.name || 'Serviço não encontrado',
        subServiceName: quote.sub_services?.name || '',
        specialtyName: quote.specialties?.name || '',
        providers: quote.quote_providers.map(provider => ({
          id: provider.id,
          providerId: provider.provider_id,
          providerName: provider.profiles?.name || 'Nome não encontrado',
          status: provider.status
        }))
      }));

      // Filtra os orçamentos de acordo com a aba selecionada
      let filteredQuotes;
      if (tab === 'all') {
        filteredQuotes = quotesWithProviders;
      } else {
        filteredQuotes = quotesWithProviders.filter(quote => quote.status === tab);
      }
      
      setQuotes(filteredQuotes);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const showQuoteDetails = (quote: QuoteWithProviders, providerId: string, providerName: string) => {
    setSelectedQuote(quote);
    setSelectedProviderId(providerId);
    setSelectedProviderName(providerName);
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
        <h2 className="text-2xl font-bold tracking-tight">Meus Orçamentos</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="accepted">Aceitos</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <p>Carregando orçamentos...</p>
            ) : quotes.length === 0 ? (
              <p className="text-muted-foreground">Nenhum orçamento encontrado.</p>
            ) : (
              quotes.map((quote) => (
                <Card key={quote.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <h3 className="text-lg font-semibold">{quote.specialtyName}</h3>
                          {getStatusBadge(quote.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {quote.serviceName} {quote.subServiceName ? ` > ${quote.subServiceName}` : ''}
                        </p>
                        <p className="text-sm">
                          {quote.neighborhood}, {quote.city}
                        </p>
                        {quote.description && (
                          <p className="text-sm line-clamp-2">{quote.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Criado em {formatDate(quote.created_at)}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Prestadores:</h4>
                          {quote.providers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum prestador atribuído</p>
                          ) : (
                            <div className="space-y-2">
                              {quote.providers.map((provider) => (
                                <div key={provider.id} className="flex items-center justify-between gap-4">
                                  <span className="text-sm">{provider.providerName}</span>
                                  {quote.status === 'pending' && provider.status === 'accepted' && (
                                    <Button 
                                      size="sm"
                                      onClick={() => showQuoteDetails(quote, provider.providerId, provider.providerName)}
                                    >
                                      Finalizar
                                    </Button>
                                  )}
                                  {provider.status !== 'pending' && (
                                    <Badge variant="outline" className={
                                      provider.status === 'completed' ? "bg-green-50 text-green-700" :
                                      provider.status === 'accepted' ? "bg-blue-50 text-blue-700" :
                                      "bg-red-50 text-red-700"
                                    }>
                                      {provider.status === 'completed' ? 'Concluído' :
                                       provider.status === 'accepted' ? 'Aceito' : 'Rejeitado'}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedQuote && showDetailsModal && (
        <QuoteDetails
          quote={{
            ...selectedQuote,
            provider_id: selectedProviderId,
            provider_name: selectedProviderName
          }}
          refreshQuotes={fetchQuotes}
          isProvider={false}
        />
      )}
    </div>
  );
};

export default QuotesList;
