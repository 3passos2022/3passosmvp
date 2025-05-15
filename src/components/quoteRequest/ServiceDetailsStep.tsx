
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ServiceDetailsStepProps {
  onNext: () => void;
  onBack: () => void;
  formData: any;
  updateFormData: (data: any) => void;
}

const ServiceDetailsStep: React.FC<ServiceDetailsStepProps> = ({ 
  onNext, 
  onBack, 
  formData, 
  updateFormData 
}) => {
  const [description, setDescription] = useState(formData.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Description is optional, but if provided, ensure it's not too short
    if (description.trim().length > 0 && description.trim().length < 10) {
      toast.error('A descrição é muito curta. Por favor, forneça mais detalhes.');
      return;
    }

    setIsLoading(true);

    // Update form data
    updateFormData({ description });

    // Proceed to next step
    setIsLoading(false);
    onNext();
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">Detalhes do Serviço</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-md">
            <h3 className="font-medium">Serviço Selecionado</h3>
            <p>{formData.serviceName}</p>
          </div>

          <div>
            <Label htmlFor="description" className="mb-1 block">
              Descrição do Serviço (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes adicionais sobre o serviço que você precisa..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Adicione informações específicas que podem ajudar os prestadores a entenderem melhor o serviço necessário.
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Processando...' : 'Continuar'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ServiceDetailsStep;
