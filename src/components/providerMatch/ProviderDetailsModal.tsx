
import React, { useState } from 'react';
import { ProviderDetails, QuoteDetails } from '@/lib/types/providerMatch';
import { sendQuoteToProvider } from '@/lib/services/providerMatchService';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProviderDetailsModalProps {
  provider: ProviderDetails | null;
  isOpen: boolean;
  onClose: () => void;
  quoteDetails: QuoteDetails;
}

const ProviderDetailsModal: React.FC<ProviderDetailsModalProps> = ({ 
  provider, isOpen, onClose, quoteDetails 
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!provider) return null;

  const handleSendQuote = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para enviar orçamentos",
        variant: "default",
      });
      
      // Salvar detalhes do orçamento e redirecionamento pendente no sessionStorage
      sessionStorage.setItem('pendingQuote', JSON.stringify({
        providerId: provider.provider.userId,
        quoteDetails: quoteDetails
      }));
      
      navigate('/login?redirect=pendingQuote');
      return;
    }

    setIsSending(true);

    // Adicionar o ID do cliente aos detalhes do orçamento
    const quoteWithClientId = {
      ...quoteDetails,
      clientId: user.id
    };

    const result = await sendQuoteToProvider(
      quoteWithClientId, 
      provider.provider.userId
    );

    setIsSending(false);

    if (result.success) {
      setIsSuccess(true);
      toast({
        title: "Orçamento enviado",
        description: "O prestador foi notificado e responderá em breve",
        variant: "default",
      });
    } else {
      toast({
        title: "Erro ao enviar orçamento",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Renderizar estrelas de avaliação
  const renderRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i}
        className={`h-4 w-4 ${i < Math.round(rating) 
          ? 'fill-yellow-400 text-yellow-400' 
          : 'fill-gray-200 text-gray-200'}`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-500">
                {provider.provider.name?.charAt(0) || "P"}
              </span>
            </div>
            <span>{provider.provider.name}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>
              {provider.provider.city && provider.provider.neighborhood 
                ? `${provider.provider.neighborhood}, ${provider.provider.city}` 
                : 'Localização não disponível'}
            </span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              {renderRatingStars(provider.rating)}
              <span className="ml-1">
                {provider.rating > 0 ? provider.rating.toFixed(1) : 'Novo'}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Sobre o prestador</h4>
            <p className="text-sm text-muted-foreground">
              {provider.provider.bio || 'Este prestador não possui uma descrição.'}
            </p>
          </div>

          {provider.portfolioItems && provider.portfolioItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Portfólio</h4>
              <div className="grid grid-cols-2 gap-2">
                {provider.portfolioItems.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-md overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.description || 'Imagem de portfólio'} 
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Valor estimado</h4>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(provider.totalPrice)}
            </p>
          </div>
        </div>

        <DialogFooter>
          {isSuccess ? (
            <div className="w-full flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-md">
              <Check className="mr-2 h-5 w-5" />
              <span>Orçamento enviado com sucesso!</span>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleSendQuote} 
              disabled={isSending}
            >
              {isSending ? 'Enviando...' : 'Enviar meu orçamento'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderDetailsModal;
