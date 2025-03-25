
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Service, SubService, Specialty, ServiceQuestion, QuestionOption, ServiceItem } from '@/lib/types';
import { getAllServices, getQuestions, getServiceItems } from '@/lib/api/services';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';

const addressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP é obrigatório'),
});

// Component for address form
const AddressStep: React.FC<{
  onNext: () => void;
  formData: any;
  updateFormData: (data: any) => void;
}> = ({ onNext, formData, updateFormData }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: formData.street || '',
      number: formData.number || '',
      complement: formData.complement || '',
      neighborhood: formData.neighborhood || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
    },
  });

  const onSubmit = (data: any) => {
    updateFormData(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="street">Rua</Label>
          <Input id="street" {...register('street')} />
          {errors.street && (
            <p className="text-sm text-red-500">{errors.street.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input id="number" {...register('number')} />
          {errors.number && (
            <p className="text-sm text-red-500">{errors.number.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="complement">Complemento (opcional)</Label>
        <Input id="complement" {...register('complement')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" {...register('neighborhood')} />
          {errors.neighborhood && (
            <p className="text-sm text-red-500">{errors.neighborhood.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" {...register('city')} />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input id="state" {...register('state')} />
          {errors.state && (
            <p className="text-sm text-red-500">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <Input id="zipCode" {...register('zipCode')} />
          {errors.zipCode && (
            <p className="text-sm text-red-500">{errors.zipCode.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4 text-right">
        <Button type="submit">Próximo</Button>
      </div>
    </form>
  );
};

// Component for service selection
const ServiceStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  formData: any;
  updateFormData: (data: any) => void;
}> = ({ onNext, onBack, formData, updateFormData }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>(formData.serviceId || '');
  const [selectedSubService, setSelectedSubService] = useState<string>(formData.subServiceId || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(formData.specialtyId || '');
  
  // Get current subservices and specialties based on selections
  const subServices = services.find(s => s.id === selectedService)?.subServices || [];
  const specialties = subServices.find(s => s.id === selectedSubService)?.specialties || [];

  useEffect(() => {
    async function loadServices() {
      try {
        const servicesData = await getAllServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Error loading services:', error);
        toast.error('Erro ao carregar serviços');
      } finally {
        setLoading(false);
      }
    }
    
    loadServices();
  }, []);

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedSubService('');
    setSelectedSpecialty('');
  };

  const handleSubServiceChange = (subServiceId: string) => {
    setSelectedSubService(subServiceId);
    setSelectedSpecialty('');
  };

  const handleSpecialtyChange = (specialtyId: string) => {
    setSelectedSpecialty(specialtyId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedSubService || !selectedSpecialty) {
      toast.error('Por favor, selecione o serviço completo');
      return;
    }
    
    // Get the names for display
    const serviceName = services.find(s => s.id === selectedService)?.name;
    const subServiceName = subServices.find(s => s.id === selectedSubService)?.name;
    const specialtyName = specialties.find(s => s.id === selectedSpecialty)?.name;
    
    updateFormData({
      serviceId: selectedService,
      subServiceId: selectedSubService,
      specialtyId: selectedSpecialty,
      serviceName,
      subServiceName,
      specialtyName,
    });
    
    onNext();
  };

  if (loading) {
    return <div className="text-center py-8">Carregando serviços...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service">Selecione o serviço</Label>
          <Select 
            value={selectedService} 
            onValueChange={handleServiceChange}
          >
            <SelectTrigger id="service">
              <SelectValue placeholder="Selecione um serviço" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedService && (
          <div className="space-y-2">
            <Label htmlFor="subService">Selecione o tipo de serviço</Label>
            <Select 
              value={selectedSubService} 
              onValueChange={handleSubServiceChange}
            >
              <SelectTrigger id="subService">
                <SelectValue placeholder="Selecione um tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {subServices.map((subService) => (
                  <SelectItem key={subService.id} value={subService.id}>
                    {subService.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedSubService && (
          <div className="space-y-2">
            <Label htmlFor="specialty">Selecione a especialidade</Label>
            <Select 
              value={selectedSpecialty} 
              onValueChange={handleSpecialtyChange}
            >
              <SelectTrigger id="specialty">
                <SelectValue placeholder="Selecione uma especialidade" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição do serviço (opcional)</Label>
        <Textarea 
          id="description" 
          placeholder="Descreva detalhes adicionais sobre o serviço que você precisa..."
          value={formData.description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="h-32"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button type="submit">
          Próximo <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

// Component for service details step (quiz, items, measurements)
const ServiceDetailsStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  formData: any;
  updateFormData: (data: any) => void;
}> = ({ onNext, onBack, formData, updateFormData }) => {
  const [activeTab, setActiveTab] = useState('quiz');
  const [questions, setQuestions] = useState<ServiceQuestion[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [answers, setAnswers] = useState<{[key: string]: string}>(formData.answers || {});
  const [itemQuantities, setItemQuantities] = useState<{[key: string]: number}>(formData.itemQuantities || {});
  const [measurements, setMeasurements] = useState<{
    id: string;
    roomName: string;
    width: number;
    length: number;
    height?: number;
  }[]>(formData.measurements || []);
  const [loading, setLoading] = useState(true);
  const [hasSquareMeterItems, setHasSquareMeterItems] = useState(false);
  const [hasLinearMeterItems, setHasLinearMeterItems] = useState(false);

  useEffect(() => {
    async function loadServiceDetails() {
      setLoading(true);
      try {
        // Load questions from service, subservice, and specialty
        const serviceQuestions = await getQuestions(formData.serviceId);
        const subServiceQuestions = await getQuestions(undefined, formData.subServiceId);
        const specialtyQuestions = await getQuestions(undefined, undefined, formData.specialtyId);
        
        setQuestions([...serviceQuestions, ...subServiceQuestions, ...specialtyQuestions]);
        
        // Load service items
        const serviceItems = await getServiceItems(formData.serviceId);
        const subServiceItems = await getServiceItems(undefined, formData.subServiceId);
        const specialtyItems = await getServiceItems(undefined, undefined, formData.specialtyId);
        
        const allItems = [...serviceItems, ...subServiceItems, ...specialtyItems];
        setItems(allItems);
        
        // Check if we have square meter or linear meter items
        setHasSquareMeterItems(allItems.some(item => item.type === 'square_meter'));
        setHasLinearMeterItems(allItems.some(item => item.type === 'linear_meter'));
        
        // Determine which tab to show first
        if (questions.length > 0) {
          setActiveTab('quiz');
        } else if (allItems.length > 0) {
          setActiveTab('items');
        } else if (hasSquareMeterItems || hasLinearMeterItems) {
          setActiveTab('measurements');
        }
      } catch (error) {
        console.error('Error loading service details:', error);
        toast.error('Erro ao carregar detalhes do serviço');
      } finally {
        setLoading(false);
      }
    }
    
    loadServiceDetails();
  }, [formData]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const addMeasurement = () => {
    const newId = `temp-${Date.now()}`;
    setMeasurements(prev => [
      ...prev,
      { id: newId, roomName: '', width: 0, length: 0 }
    ]);
  };

  const updateMeasurement = (index: number, field: string, value: any) => {
    setMeasurements(prev => 
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateFormData({
      answers,
      itemQuantities,
      measurements
    });
    
    onNext();
  };

  if (loading) {
    return <div className="text-center py-8">Carregando detalhes do serviço...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          {questions.length > 0 && (
            <TabsTrigger value="quiz">Questionário</TabsTrigger>
          )}
          {items.length > 0 && (
            <TabsTrigger value="items">Itens do Serviço</TabsTrigger>
          )}
          {(hasSquareMeterItems || hasLinearMeterItems) && (
            <TabsTrigger value="measurements">Medidas</TabsTrigger>
          )}
        </TabsList>

        {questions.length > 0 && (
          <TabsContent value="quiz" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Responda as perguntas abaixo</h3>
            
            {questions.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {questions.map((question) => (
                    <CarouselItem key={question.id}>
                      <Card>
                        <CardHeader>
                          <CardTitle>{question.question}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <RadioGroup 
                            value={answers[question.id] || ''} 
                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                          >
                            {question.options.map((option) => (
                              <div key={option.id} className="flex items-center space-x-2 py-2">
                                <RadioGroupItem value={option.id} id={option.id} />
                                <Label htmlFor={option.id}>{option.optionText}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-4">
                  <CarouselPrevious className="mr-2" />
                  <CarouselNext className="ml-2" />
                </div>
              </Carousel>
            ) : (
              <p>Não há perguntas disponíveis para este serviço.</p>
            )}
          </TabsContent>
        )}

        {items.length > 0 && (
          <TabsContent value="items" className="pt-4">
            <h3 className="text-lg font-medium mb-4">Informe as quantidades necessárias</h3>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border p-4 rounded-md">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.type === 'quantity' ? 'Quantidade' : 
                       item.type === 'square_meter' ? 'Metro Quadrado' : 'Metro Linear'}
                    </p>
                  </div>
                  <div className="w-24">
                    <Input 
                      type="number" 
                      min="0" 
                      step={item.type === 'quantity' ? '1' : '0.01'}
                      value={itemQuantities[item.id] || ''}
                      onChange={(e) => handleItemQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {(hasSquareMeterItems || hasLinearMeterItems) && (
          <TabsContent value="measurements" className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Informe as medidas necessárias</h3>
              <Button type="button" onClick={addMeasurement} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            
            {measurements.length > 0 ? (
              <div className="space-y-6">
                {measurements.map((measurement, index) => (
                  <Card key={measurement.id} className="relative">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2"
                      onClick={() => removeMeasurement(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome do cômodo/área (opcional)</Label>
                          <Input 
                            value={measurement.roomName} 
                            onChange={(e) => updateMeasurement(index, 'roomName', e.target.value)}
                            placeholder="Ex: Sala, Quarto, Cozinha"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Largura (m)</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              value={measurement.width || ''} 
                              onChange={(e) => updateMeasurement(index, 'width', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Comprimento (m)</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              value={measurement.length || ''} 
                              onChange={(e) => updateMeasurement(index, 'length', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          {hasSquareMeterItems && (
                            <div className="space-y-2">
                              <Label>Altura (m) (opcional)</Label>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                value={measurement.height || ''} 
                                onChange={(e) => updateMeasurement(index, 'height', parseFloat(e.target.value) || undefined)}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium">
                            Área total: {(measurement.width * measurement.length).toFixed(2)} m²
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                Clique em "Adicionar" para incluir as medidas necessárias para o serviço.
              </p>
            )}
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button type="submit">
          Próximo <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

// Component for quote review
const ReviewStep: React.FC<{
  onSubmit: () => void;
  onBack: () => void;
  formData: any;
}> = ({ onSubmit, onBack, formData }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Revise seu pedido de orçamento</h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Serviço Solicitado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Serviço:</span>
                <span className="font-medium">{formData.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo de serviço:</span>
                <span className="font-medium">{formData.subServiceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Especialidade:</span>
                <span className="font-medium">{formData.specialtyName}</span>
              </div>
              {formData.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-gray-500">Descrição:</p>
                    <p className="mt-1">{formData.description}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p>{formData.street}, {formData.number}</p>
              {formData.complement && <p>{formData.complement}</p>}
              <p>{formData.neighborhood}, {formData.city} - {formData.state}</p>
              <p>CEP: {formData.zipCode}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={onSubmit}>
          Solicitar Orçamentos
        </Button>
      </div>
    </div>
  );
};

// Main component
const QuoteRequestForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      toast.error('Você precisa estar logado para solicitar orçamentos');
      navigate('/login');
    }
  }, [user, navigate]);

  const updateFormData = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para solicitar orçamentos');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          client_id: user.id,
          service_id: formData.serviceId,
          sub_service_id: formData.subServiceId,
          specialty_id: formData.specialtyId,
          description: formData.description,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city, 
          state: formData.state,
          zip_code: formData.zipCode
        })
        .select()
        .single();
      
      if (quoteError) throw quoteError;
      
      // Insert answers
      if (formData.answers) {
        const answerRows = Object.entries(formData.answers).map(([questionId, optionId]) => ({
          quote_id: quote.id,
          question_id: questionId,
          option_id: optionId as string
        }));
        
        if (answerRows.length > 0) {
          const { error: answersError } = await supabase
            .from('quote_answers')
            .insert(answerRows);
          
          if (answersError) throw answersError;
        }
      }
      
      // Insert item quantities
      if (formData.itemQuantities) {
        const itemRows = Object.entries(formData.itemQuantities)
          .filter(([_, quantity]) => quantity > 0) // Only insert items with quantity > 0
          .map(([itemId, quantity]) => ({
            quote_id: quote.id,
            item_id: itemId,
            quantity: quantity as number
          }));
        
        if (itemRows.length > 0) {
          const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(itemRows);
          
          if (itemsError) throw itemsError;
        }
      }
      
      // Insert measurements
      if (formData.measurements && formData.measurements.length > 0) {
        const measurementRows = formData.measurements.map((m) => ({
          quote_id: quote.id,
          room_name: m.roomName,
          width: m.width,
          length: m.length,
          height: m.height
        }));
        
        const { error: measurementsError } = await supabase
          .from('quote_measurements')
          .insert(measurementRows);
        
        if (measurementsError) throw measurementsError;
      }
      
      toast.success('Orçamento solicitado com sucesso!');
      navigate('/profile'); // Redirect to profile page to see the quote
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Erro ao enviar orçamento. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Solicitar Orçamento</h2>
          
          <div className="flex justify-between relative mb-6">
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
            
            {/* Step indicators */}
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    s <= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                <div className="text-xs text-center mt-1">
                  {s === 1 && 'Endereço'}
                  {s === 2 && 'Serviço'}
                  {s === 3 && 'Detalhes'}
                  {s === 4 && 'Revisar'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <AddressStep 
              onNext={() => handleStepChange(2)} 
              formData={formData} 
              updateFormData={updateFormData} 
            />
          )}
          
          {step === 2 && (
            <ServiceStep 
              onNext={() => handleStepChange(3)} 
              onBack={() => handleStepChange(1)} 
              formData={formData} 
              updateFormData={updateFormData} 
            />
          )}
          
          {step === 3 && (
            <ServiceDetailsStep 
              onNext={() => handleStepChange(4)} 
              onBack={() => handleStepChange(2)} 
              formData={formData} 
              updateFormData={updateFormData} 
            />
          )}
          
          {step === 4 && (
            <ReviewStep 
              onSubmit={handleSubmit} 
              onBack={() => handleStepChange(3)} 
              formData={formData} 
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuoteRequestForm;
