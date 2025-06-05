
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface ProviderRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  providerId: string;
  providerName: string;
  onRatingSubmitted: () => void;
}

const ProviderRatingModal: React.FC<ProviderRatingModalProps> = ({
  isOpen,
  onClose,
  quoteId,
  providerId,
  providerName,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    setIsSubmitting(true);
    try {
      // Usar a função do Supabase para adicionar a avaliação
      const { error } = await supabase.rpc('add_provider_rating', {
        p_provider_id: providerId,
        p_quote_id: quoteId,
        p_rating: rating,
        p_comment: comment || null
      });

      if (error) throw error;

      // Marcar o orçamento como concluído
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Atualizar o status do relacionamento quote_providers
      const { error: providerError } = await supabase
        .from('quote_providers')
        .update({ status: 'completed' })
        .eq('quote_id', quoteId)
        .eq('provider_id', providerId);

      if (providerError) throw providerError;

      toast.success('Avaliação enviada e serviço finalizado com sucesso!');
      onRatingSubmitted();
      onClose();
      
      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Prestador</DialogTitle>
          <DialogDescription>
            Avalie o serviço prestado por {providerName}. Sua avaliação ajuda outros usuários.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="text-center">
            <p className="text-sm font-medium mb-3">Como você avalia o serviço?</p>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`h-8 w-8 cursor-pointer transition-colors ${
                    value <= rating 
                      ? 'fill-yellow-400 stroke-yellow-400' 
                      : 'stroke-gray-300 hover:stroke-yellow-300'
                  }`}
                  onClick={() => setRating(value)}
                />
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {rating === 1 && 'Muito ruim'}
                {rating === 2 && 'Ruim'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bom'}
                {rating === 5 && 'Excelente'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Conte como foi sua experiência com este prestador..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner /> : 'Finalizar e Avaliar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderRatingModal;
