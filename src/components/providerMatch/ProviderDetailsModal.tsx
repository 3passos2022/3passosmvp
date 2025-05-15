
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Send, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ProviderDetails, QuoteDetails, PriceDetail } from '@/lib/types/providerMatch';
import { sendQuoteToProvider } from '@/lib/services/providerMatchService';
import { toast } from 'sonner';

interface ProviderDetailsModalProps {
  provider: ProviderDetails;
  isOpen: boolean;
  onClose: () => void;
  quoteDetails: QuoteDetails;
  onLoginRequired: () => void;
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
  const [quoteSent, setQuoteSent] = useState(false);
  
  const { name, averageRating, city, neighborhood, bio, avatar_url } = provider.provider;
  const { portfolioItems, distance, totalPrice, isWithinRadius, priceDetails } = provider;

  const handleSendQuote = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    setIsSending(true);
    
    try {
      console.log('Sending quote with client ID:', quoteDetails.clientId);
      
      const result = await sendQuoteToProvider(quoteDetails, provider.provider.userId);
      
      if (result.requiresLogin) {
        onLoginRequired();
        return;
      }
      
      if (result.success) {
        toast.success(result.message || "Orçamento enviado com sucesso!");
        setQuoteSent(true);
      } else {
        toast.error(result.message || "Erro ao enviar orçamento. Tente novamente.");
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error("Ocorreu um erro. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  // Render price details if available
  const renderPriceDetails = () => {
    if (!priceDetails || Object.keys(priceDetails).length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Detalhes do preço:</h4>
        <div className="space-y-1 text-sm">
          {Object.entries(priceDetails).map(([itemId, detail]) => (
            <div key={itemId} className="flex justify-between">
              <span>{detail.itemName || `Item ${itemId}`}</span>
              <span>{formatCurrency(detail.total)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-primary text-primary-foreground">
              {avatar_url ? (
                <AvatarImage src={avatar_url} alt={name || 'Provider'} />
              ) : null}
              <AvatarFallback>{name?.charAt(0) || 'P'}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                {city && neighborhood && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {neighborhood}, {city}
                  </span>
                )}
                {distance !== null && distance !== undefined && (
                  <span>• {distance.toFixed(2)} km</span>
                )}
                {averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    • <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {averageRating.toFixed(1)}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isWithinRadius && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Fora da área de atendimento</h4>
              <p className="text-sm text-amber-700">
                Este prestador está localizado fora da área selecionada. 
                Ele ainda pode atender sua solicitação, mas pode haver custos adicionais.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da esquerda */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Sobre</h3>
              <p className="text-sm text-gray-600">{bio || 'Nenhuma descrição disponível.'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Preço</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalPrice)}
                </div>
                <p className="text-sm text-muted-foreground">
                  *Preço estimado para o serviço solicitado
                </p>
                {renderPriceDetails()}
              </div>
            </div>
          </div>

          {/* Coluna da direita */}
          <div className="space-y-6">
            {portfolioItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
                <div className="grid grid-cols-2 gap-2">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-md overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.description || 'Portfolio item'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="sm:flex-1"
          >
            Fechar
          </Button>
          
          <Button 
            onClick={handleSendQuote} 
            disabled={isSending || quoteSent} 
            className="sm:flex-1"
          >
            {isSending ? (
              <><span className="animate-spin mr-2">◌</span>Enviando...</>
            ) : quoteSent ? (
              <>Orçamento Enviado</>
            ) : (
              <><Send className="h-4 w-4 mr-2" />Enviar Orçamento</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderDetailsModal;
