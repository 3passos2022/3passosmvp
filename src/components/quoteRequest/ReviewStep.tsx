
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ReviewStepProps {
  onBack: () => void;
  onSubmit: () => void;
  formData: any;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ onBack, onSubmit, formData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user && !fullName.trim()) {
      toast.error('Por favor, informe seu nome completo');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare final quote data
      const quoteData = {
        ...formData,
        fullName: user ? undefined : fullName, // Only include fullName if user is not logged in
        is_anonymous: !user // Mark as anonymous if not logged in
      };
      
      // Store in local storage to be used in the next page
      localStorage.setItem('quoteData', JSON.stringify(quoteData));
      
      // Proceed to providers page
      toast.success('Orçamento criado com sucesso!');
      navigate('/providers-found');
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Ocorreu um erro ao enviar o orçamento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">Revise seu Orçamento</h2>
        
        <div className="space-y-6">
          {/* Service Details Section */}
          <div>
            <h3 className="text-lg font-medium mb-2">Detalhes do Serviço</h3>
            <CardContent className="p-4 bg-muted/20 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium">{formData.serviceName}</span>
              </div>
              
              {formData.description && (
                <div className="pt-2">
                  <span className="text-muted-foreground block mb-1">Descrição:</span>
                  <p className="text-sm">{formData.description}</p>
                </div>
              )}
            </CardContent>
          </div>
          
          <Separator />
          
          {/* Address Section */}
          <div>
            <h3 className="text-lg font-medium mb-2">Endereço</h3>
            <CardContent className="p-4 bg-muted/20 rounded-md">
              <address className="not-italic">
                {formData.street}, {formData.number}
                {formData.complement && `, ${formData.complement}`}
                <br />
                {formData.neighborhood}, {formData.city} - {formData.state}
                <br />
                CEP: {formData.zipCode}
              </address>
            </CardContent>
          </div>
          
          <Separator />
          
          {/* User Information Section */}
          {!user && (
            <div>
              <h3 className="text-lg font-medium mb-2">Suas Informações</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input 
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800">
                    Você não está logado. Para acompanhar seus orçamentos facilmente,
                    recomendamos criar uma conta ou fazer login.
                  </p>
                </div>
              </div>
            </div>
          )}
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
            {isLoading ? 'Processando...' : 'Encontrar Prestadores'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ReviewStep;
