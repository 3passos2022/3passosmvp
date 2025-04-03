
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from '@/components/ui/loading-spinner';

interface QuoteDetailsProps {
  quote: any;
  refreshQuotes: () => Promise<void>;
  isProvider: boolean;
}

const QuoteDetails: React.FC<QuoteDetailsProps> = ({ quote, refreshQuotes, isProvider }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [completeLoading, setCompleteLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_providers')
        .update({ status: 'accepted' })
        .eq('id', quote.provider_id)
        .eq('quote_id', quote.id);

      if (error) throw error;
      toast.success('Orçamento aceito com sucesso!');
      await refreshQuotes();
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error('Erro ao aceitar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_providers')
        .update({ status: 'rejected' })
        .eq('id', quote.provider_id)
        .eq('quote_id', quote.id);

      if (error) throw error;
      toast.success('Orçamento recusado');
      await refreshQuotes();
    } catch (error) {
      console.error('Error declining quote:', error);
      toast.error('Erro ao recusar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const openRatingDialog = (providerId: string) => {
    setSelectedProviderId(providerId);
    setShowRatingDialog(true);
  };

  const handleCompleteQuote = async (providerId: string) => {
    if (!providerId) {
      toast.error('Prestador não selecionado');
      return;
    }

    setCompleteLoading(true);
    try {
      // 1. Marcar o orçamento como concluído
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      // 2. Marcar o relacionamento do prestador com orçamento como concluído
      const { error: providerError } = await supabase
        .from('quote_providers')
        .update({ status: 'completed' })
        .eq('quote_id', quote.id)
        .eq('provider_id', providerId);

      if (providerError) throw providerError;

      // 3. Remover outros prestadores deste orçamento
      const { error: deleteError } = await supabase
        .from('quote_providers')
        .delete()
        .eq('quote_id', quote.id)
        .neq('provider_id', providerId);

      if (deleteError) throw deleteError;

      // 4. Salvar a avaliação
      const { error: ratingError } = await supabase.rpc(
        "add_provider_rating",
        {
          p_provider_id: providerId,
          p_quote_id: quote.id,
          p_rating: rating,
          p_comment: comment || null
        }
      );

      if (ratingError) throw ratingError;

      setShowRatingDialog(false);
      toast.success('Serviço finalizado e avaliação enviada com sucesso!');
      await refreshQuotes();
    } catch (error) {
      console.error('Error completing quote:', error);
      toast.error('Erro ao finalizar orçamento');
    } finally {
      setCompleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {quote.service_name} {quote.sub_service_name ? `- ${quote.sub_service_name}` : ''} {quote.specialty_name ? `- ${quote.specialty_name}` : ''}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
            quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
            quote.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {
              quote.status === 'pending' ? 'Pendente' :
              quote.status === 'accepted' ? 'Aceito' :
              quote.status === 'rejected' ? 'Recusado' :
              quote.status === 'completed' ? 'Concluído' :
              'Desconhecido'
            }
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Data da solicitação</p>
          <p>{formatDate(quote.created_at)}</p>
        </div>

        {!isProvider && (
          <div>
            <p className="text-sm text-muted-foreground">Prestador</p>
            <p>{quote.provider_name}</p>
          </div>
        )}

        {isProvider && (
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p>{quote.client_name || 'Cliente anônimo'}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-muted-foreground">Endereço</p>
          <p>
            {quote.street}, {quote.number}
            {quote.complement && `, ${quote.complement}`}
          </p>
          <p>
            {quote.neighborhood}, {quote.city} - {quote.state}
          </p>
        </div>

        {quote.description && (
          <div>
            <p className="text-sm text-muted-foreground">Descrição</p>
            <p>{quote.description}</p>
          </div>
        )}
      </div>

      {isProvider && quote.status === 'pending' && (
        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : 'Recusar'}
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : 'Aceitar'}
          </Button>
        </div>
      )}

      {!isProvider && quote.status === 'accepted' && (
        <div className="flex justify-end gap-4 pt-4">
          <Button 
            onClick={() => openRatingDialog(quote.provider_id)}
          >
            Finalizar serviço
          </Button>
        </div>
      )}

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar prestador</DialogTitle>
            <DialogDescription>
              Finalize o serviço avaliando o prestador. Isso marcará o orçamento como concluído.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`h-8 w-8 cursor-pointer ${
                    value <= rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-300'
                  }`}
                  onClick={() => setRating(value)}
                />
              ))}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Comentário (opcional)
              </label>
              <Textarea
                id="comment"
                placeholder="Conte como foi sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={completeLoading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              onClick={() => selectedProviderId && handleCompleteQuote(selectedProviderId)}
              disabled={rating === 0 || completeLoading}
            >
              {completeLoading ? <LoadingSpinner /> : 'Finalizar e avaliar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteDetails;
