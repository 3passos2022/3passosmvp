import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Star, MapPin, Send, Phone } from 'lucide-react';
import { ProviderDetails, QuoteDetails } from '@/lib/types/providerMatch';
import { useToast } from '@/components/ui/use-toast';
import { sendQuoteToProvider } from '@/lib/services/providerMatchService';
import { useNavigate } from 'react-router-dom';

interface ProviderDetailsModalProps {
  provider: ProviderDetails;
  isOpen: boolean;
  onClose: () => void;
  quoteDetails: QuoteDetails;
  onLoginRequired?: () => void;
  isLoggedIn: boolean;
}

const ProviderDetailsModal: React.FC<ProviderDetailsModalProps> = ({
  provider,
  isOpen,
  onClose,
  quoteDetails,
  onLoginRequired,
  isLoggedIn
}) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendQuote = async () => {
    setIsSending(true);
    try {
      const result = await sendQuoteToProvider(quoteDetails, provider.provider.userId);
      
      if (result.requiresLogin) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para enviar um orçamento"
        });
        
        if (onLoginRequired) {
          onLoginRequired();
        }
        return;
      }
      
      if (result.success) {
        toast({
          title: "Orçamento enviado",
          description: "Seu orçamento foi enviado com sucesso para o prestador"
        });
        onClose();
      } else {
        toast({
          title: "Erro",
          description: result.message
        });
      }
    } catch (error) {
      console.error("Erro ao enviar orçamento:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar o orçamento"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-primary text-white">
              <AvatarFallback>{provider.provider.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {provider.provider.name}
            {provider.provider.averageRating > 0 && (
              <Badge variant="outline" className="ml-2 flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{provider.provider.averageRating.toFixed(1)}</span>
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-2/3">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                {provider.provider.bio && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Sobre</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{provider.provider.bio}</p>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Detalhes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {provider.provider.city && provider.provider.neighborhood
                          ? `${provider.provider.neighborhood}, ${provider.provider.city}`
                          : "Localização não informada"}
                        {provider.distance > 0 && ` (${provider.distance.toFixed(2)} km)`}
                      </span>
                    </div>
                    
                    {provider.isWithinRadius ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        Atende na sua região
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                        Fora da área de atendimento
                      </Badge>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Preço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(provider.totalPrice)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      *Preço estimado para o serviço solicitado
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="portfolio" className="space-y-4 mt-4">
                {provider.portfolioItems.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">Este prestador ainda não adicionou itens ao portfólio</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {provider.portfolioItems.map((item) => (
                      <Card key={item.id}>
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt="Portfolio"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        {item.description && (
                          <CardContent className="pt-3">
                            <p className="text-sm">{item.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="contact" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Informações de contato</CardTitle>
                    <CardDescription>
                      Contate o prestador diretamente ou envie um orçamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {provider.provider.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${provider.provider.phone}`}
                          className="text-sm hover:underline text-primary"
                        >
                          {provider.provider.phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="md:w-1/3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Orçamento para</CardTitle>
                <CardDescription>
                  {quoteDetails.serviceName} &gt; {quoteDetails.subServiceName} &gt; {quoteDetails.specialtyName}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm line-clamp-3">
                  <span className="font-medium">Endereço:</span> {quoteDetails.address.street}, {quoteDetails.address.number}, {quoteDetails.address.neighborhood}, {quoteDetails.address.city}
                </p>
                {quoteDetails.description && (
                  <p className="text-sm mt-2 line-clamp-3">
                    <span className="font-medium">Descrição:</span> {quoteDetails.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          <Button
            onClick={handleSendQuote}
            disabled={isSending}
            className="w-full sm:w-auto"
          >
            {isSending ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> 
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar orçamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderDetailsModal;
