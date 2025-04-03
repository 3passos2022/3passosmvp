
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuoteDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  providerId: string;
  providerName: string;
}

const QuoteDetails: React.FC<QuoteDetailsProps> = ({ isOpen, onClose, quoteId, providerId, providerName }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'confirm' | 'rate'>('confirm');

  const handleCompleteQuote = async () => {
    setIsSubmitting(true);
    try {
      // Atualiza esta relação quote-provider como completed
      const { error: updateError } = await supabase
        .from('quote_providers')
        .update({ status: 'completed' })
        .eq('quote_id', quoteId)
        .eq('provider_id', providerId);

      if (updateError) throw updateError;
      
      // Exclui as outras relações do mesmo quote com outros providers
      const { error: deleteError } = await supabase
        .from('quote_providers')
        .delete()
        .eq('quote_id', quoteId)
        .neq('provider_id', providerId);

      if (deleteError) throw deleteError;

      // Atualiza o status do orçamento para completed
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Passa para a etapa de avaliação
      setStep('rate');
    } catch (error) {
      console.error('Erro ao finalizar orçamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o orçamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma classificação para o prestador.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Salvar a avaliação do prestador
      const { error } = await supabase
        .from('provider_ratings')
        .insert({
          provider_id: providerId,
          quote_id: quoteId,
          rating: rating,
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada",
        description: "Obrigado por avaliar o serviço!",
      });

      // Fechar o modal
      onClose();
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {step === 'confirm' ? (
            <>
              <DialogTitle>Finalizar Orçamento</DialogTitle>
              <DialogDescription>
                Você está confirmando que o serviço foi concluído por {providerName}.
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>Avaliar Prestador</DialogTitle>
              <DialogDescription>
                Como você avalia o serviço prestado por {providerName}?
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {step === 'rate' && (
          <div className="py-4">
            <Label className="block text-center mb-2">Sua avaliação</Label>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'confirm' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCompleteQuote} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Finalização'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Pular
              </Button>
              <Button 
                onClick={handleSubmitRating} 
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDetails;
