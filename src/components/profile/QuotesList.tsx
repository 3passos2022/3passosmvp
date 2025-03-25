
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Quote, QuoteStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const QuotesList: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotes() {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            *,
            services(name),
            sub_services(name),
            specialties(name),
            quote_providers(
              id,
              provider_id,
              status,
              total_price,
              profiles(name)
            )
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setQuotes(data || []);
      } catch (error) {
        console.error('Error loading quotes:', error);
        toast.error('Erro ao carregar orçamentos');
      } finally {
        setLoading(false);
      }
    }
    
    loadQuotes();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pendente</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Enviado</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Aceito</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejeitado</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Carregando seus orçamentos...</p>
      </div>
    );
  }

  if (!quotes.length) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center"
      >
        <p className="text-gray-500">Você ainda não possui orçamentos solicitados.</p>
        <Button className="mt-4" asChild>
          <a href="/request-quote">Solicitar orçamento</a>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Meus Orçamentos</h2>
      
      {quotes.map((quote) => (
        <Card key={quote.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">
                  {quote.services?.name} &gt; {quote.sub_services?.name} &gt; {quote.specialties?.name}
                </CardTitle>
                <CardDescription>
                  Solicitado {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true, locale: ptBR })}
                </CardDescription>
              </div>
              {getStatusBadge(quote.status)}
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Endereço</h4>
                <p>{quote.street}, {quote.number}</p>
                {quote.complement && <p>{quote.complement}</p>}
                <p>{quote.neighborhood}, {quote.city} - {quote.state}</p>
              </div>
              
              {quote.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Descrição</h4>
                  <p>{quote.description}</p>
                </div>
              )}
              
              {quote.quote_providers && quote.quote_providers.length > 0 && (
                <>
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Prestadores</h4>
                    
                    <div className="space-y-3">
                      {quote.quote_providers.map((provider) => (
                        <div key={provider.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">{provider.profiles?.name}</p>
                            {getStatusBadge(provider.status)}
                          </div>
                          
                          <div className="text-right">
                            {provider.total_price && (
                              <p className="font-bold text-lg">
                                R$ {provider.total_price.toFixed(2)}
                              </p>
                            )}
                            
                            <Button size="sm" variant="outline" className="mt-2">
                              Ver detalhes
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="ml-auto">
              Ver detalhes completos
            </Button>
          </CardFooter>
        </Card>
      ))}
    </motion.div>
  );
};

export default QuotesList;
