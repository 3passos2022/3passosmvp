
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface ServiceStepProps {
  onNext: () => void;
  formData: any;
  updateFormData: (data: any) => void;
  services: any[];
}

const ServiceStep: React.FC<ServiceStepProps> = ({ onNext, formData, updateFormData, services }) => {
  const [selectedService, setSelectedService] = useState(formData.serviceId || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      toast.error('Por favor, selecione um serviço');
      return;
    }

    setIsLoading(true);

    // Find the selected service to get its name
    const service = services.find(s => s.id === selectedService);
    
    // Update form data
    updateFormData({
      serviceId: selectedService,
      serviceName: service?.name || ''
    });

    // Proceed to next step
    setIsLoading(false);
    onNext();
  };

  if (services.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">Selecione o Tipo de Serviço</h2>

        <RadioGroup
          value={selectedService}
          onValueChange={handleServiceSelect}
          className="space-y-3"
        >
          {services.map(service => (
            <div key={service.id} className="flex items-center space-x-2 border rounded-md p-4">
              <RadioGroupItem value={service.id} id={service.id} />
              <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                <div className="font-medium">{service.name}</div>
                {service.description && (
                  <div className="text-sm text-muted-foreground">{service.description}</div>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end mt-8">
          <Button 
            type="submit" 
            disabled={isLoading || !selectedService}
          >
            {isLoading ? 'Processando...' : 'Continuar'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ServiceStep;
