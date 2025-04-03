
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/lib/types';
import QuoteDetails from './QuoteDetails';

interface QuoteProvider {
  id: string;
  provider_id: string;
  status: string;
  provider: {
    name: string;
    phone: string;
  };
}

interface Quote {
  id: string;
  service_name: string;
  sub_service_name: string;
  specialty_name: string;
  status: string;
  created_at: string;
  description?: string;
  city: string;
  neighborhood: string;
  providers?: QuoteProvider[];
}

const QuotesList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteProvider, setSelectedQuoteProvider] = useState<{
    quoteId: string;
    providerId: string;
    providerName: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchQuotes = async () => {
      setLoading(true);
      try {
        // Query diferente dependendo do tipo de usuário
        if (user.role === UserRole.CLIENT) {
          const { data, error } = await supabase
            .from('quotes')
            .select(`
              id,
              status,
              description,
              city,
              neighborhood,
              created_at,
              service_name:services(name),
              sub_service_name:sub_services(name),
              specialty_name:specialties(name),
              providers:quote_providers(
                id,
                provider_id,
                status,
                provider:profiles(name, phone)
              )
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const formattedQuotes = data.map((quote: any) => ({
            id: quote.id,
            service_name: quote.service_name?.name || 'Serviço não disponível',
            sub_service_name: quote.sub_service_name?.name || 'Subserviço não disponível',
            specialty_name: quote.specialty_name?.name || 'Especialidade não disponível',
            status: quote.status,
            created_at: quote.created_at,
            description: quote.description,
            city: quote.city,
            neighborhood: quote.neighborhood,
            providers: quote.providers || []
          }));

          setQuotes(formattedQuotes);
        } else {
          const { data, error } = await supabase
            .from('quotes')
            .select(`
              id,
              status,
              description,
              city,
              neighborhood,
              created_at,
              service_name:services(name),
              sub_service_name:sub_services(name),
              specialty_name:specialties(name)
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          setQuotes(data || []);
        }
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

    fetchQuotes();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quotes.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Nenhum orçamento encontrado</h3>
        <p className="text-muted-foreground mt-2">
          {user?.role === UserRole.CLIENT 
            ? "Você ainda não solicitou nenhum orçamento." 
            : "Você ainda não tem orçamentos."}
        </p>
        
        {user?.role === UserRole.CLIENT && (
          <Button className="mt-4" onClick={() => window.location.href = '/request-quote'}>
            Solicitar Orçamento
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Meus Orçamentos</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {quote.service_name} &gt; {quote.sub_service_name} &gt; {quote.specialty_name}
                </CardTitle>
                
                <Badge 
                  variant={quote.status === 'completed' ? 'default' : 'outline'}
                  className={
                    quote.status === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                    quote.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                    'bg-gray-100 text-gray-800 hover:bg-gray-100'
                  }
                >
                  {quote.status === 'pending' ? 'Pendente' : 
                   quote.status === 'completed' ? 'Concluído' : 
                   quote.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Local: {quote.neighborhood}, {quote.city}</p>
                <p>Data: {formatDate(quote.created_at)}</p>
              </div>
              
              {quote.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                  <p>{quote.description}</p>
                </div>
              )}
              
              {user?.role === UserRole.CLIENT && quote.providers && quote.providers.length > 0 && (
                <Collapsible className="mt-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      Ver prestadores ({quote.providers.length})
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-3 space-y-3">
                    {quote.providers.map((provider) => (
                      <div 
                        key={provider.id} 
                        className="p-3 border rounded-md flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{provider.provider.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.provider.phone || 'Sem telefone'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            provider.status === 'pending' ? 'outline' :
                            provider.status === 'accepted' ? 'default' :
                            provider.status === 'rejected' ? 'destructive' :
                            provider.status === 'completed' ? 'secondary' : 'outline'
                          }>
                            {provider.status === 'pending' ? 'Pendente' :
                             provider.status === 'accepted' ? 'Aceito' :
                             provider.status === 'rejected' ? 'Rejeitado' :
                             provider.status === 'completed' ? 'Finalizado' : provider.status}
                          </Badge>
                          
                          {provider.status === 'accepted' && quote.status !== 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="ml-2"
                              onClick={() => setSelectedQuoteProvider({
                                quoteId: quote.id,
                                providerId: provider.provider_id,
                                providerName: provider.provider.name
                              })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <div className="text-xs text-muted-foreground">
                ID: {quote.id}
              </div>
              
              {user?.role === UserRole.CLIENT && quote.status === 'pending' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.href = `/request-quote?edit=${quote.id}`}
                >
                  Editar
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {selectedQuoteProvider && (
        <QuoteDetails 
          isOpen={!!selectedQuoteProvider}
          onClose={() => setSelectedQuoteProvider(null)}
          quoteId={selectedQuoteProvider.quoteId}
          providerId={selectedQuoteProvider.providerId}
          providerName={selectedQuoteProvider.providerName}
        />
      )}
    </div>
  );
};

export default QuotesList;
