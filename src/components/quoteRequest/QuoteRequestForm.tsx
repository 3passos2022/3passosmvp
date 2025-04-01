
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";

const addressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP é obrigatório'),
});

interface AddressFormData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface FormData {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
  serviceName?: string;
  subServiceName?: string;
  specialtyName?: string;
  description?: string;
  answers?: {[key: string]: string};
  itemQuantities?: {[key: string]: number};
  measurements?: {
    id: string;
    roomName: string;
    width: number;
    length: number;
    height?: number;
  }[];
}

// Component for address form
const AddressStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}> = ({ onNext, onBack, formData, updateFormData }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<AddressFormData>({
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
    mode: 'onChange'
  });

  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const zipCode = watch('zipCode');

  // Watch for CEP changes and fetch address data
  useEffect(() => {
    const fetchAddressFromCep = async () => {
      const cleanZipCode = zipCode?.replace(/\D/g, '');
      
      if (cleanZipCode?.length === 8) {
        setIsFetchingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
          const data = await response.json();
          
          if (!data.erro) {
            setValue('street', data.logradouro, { shouldValidate: true });
            setValue('neighborhood', data.bairro, { shouldValidate: true });
            setValue('city', data.localidade, { shouldValidate: true });
            setValue('state', data.uf, { shouldValidate: true });
            // Focus on the number field after CEP is successfully processed
            setTimeout(() => {
              document.getElementById('number')?.focus();
            }, 100);
          } else {
            toast.error('CEP não encontrado');
          }
        } catch (error) {
          console.error('Error fetching address:', error);
          toast.error('Erro ao buscar o endereço');
        } finally {
          setIsFetchingCep(false);
        }
      }
    };

    fetchAddressFromCep();
  }, [zipCode, setValue]);

  const onSubmit = (data: AddressFormData) => {
    updateFormData(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="zipCode">CEP</Label>
        <div className="flex items-center">
          <Input 
            id="zipCode" 
            {...register('zipCode')}
            placeholder="00000-000"
            className="flex-grow"
          />
          {isFetchingCep && <Loader2 className="animate-spin ml-2 h-4 w-4 text-primary" />}
          {!isFetchingCep && zipCode?.length >= 8 && !errors.zipCode && 
            <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
          }
        </div>
        {errors.zipCode && (
          <p className="text-sm text-red-500">{errors.zipCode.message}</p>
        )}
      </div>

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
      </div>

      <div className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button type="submit" disabled={!isValid}>
          Revisar Orçamento
        </Button>
      </div>
    </form>
  );
};

// Component for service selection
const ServiceStep: React.FC<{
  onNext: () => void;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}> = ({ onNext, formData, updateFormData }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>(formData.serviceId || '');
  const [selectedSubService, setSelectedSubService] = useState<string>(formData.subServiceId || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(formData.specialtyId || '');
  
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
    
    if (!selectedService) {
      toast.error('Por favor, selecione pelo menos um serviço');
      return;
    }
    
    const serviceName = services.find(s => s.id === selectedService)?.name;
    const subServiceName = subServices.find(s => s.id === selectedSubService)?.name;
    const specialtyName = specialties.find(s => s.id === selectedSpecialty)?.name;
    
    updateFormData({
      serviceId: selectedService,
      subServiceId: selectedSubService || undefined,
      specialtyId: selectedSpecialty || undefined,
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
            required
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
            <Label htmlFor="subService">Selecione o tipo de serviço (opcional)</Label>
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
            <Label htmlFor="specialty">Selecione a especialidade (opcional)</Label>
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

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={!selectedService}>
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
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}> = ({ onNext, onBack, formData, updateFormData }) => {
  // Define sub-steps for the service details
  const [detailsSubStep, setDetailsSubStep] = useState<'quiz' | 'items' | 'measurements'>('quiz');
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
  const [showReview, setShowReview] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [allItemsFilled, setAllItemsFilled] = useState(false);
  const [allMeasurementsFilled, setAllMeasurementsFilled] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<string[]>([]);

  useEffect(() => {
    async function loadServiceDetails() {
      setLoading(true);
      try {
        if (!formData.serviceId) return;
        
        const serviceQuestions = formData.serviceId ? await getQuestions(formData.serviceId) : [];
        const subServiceQuestions = formData.subServiceId ? await getQuestions(undefined, formData.subServiceId) : [];
        const specialtyQuestions = formData.specialtyId ? await getQuestions(undefined, undefined, formData.specialtyId) : [];
        
        setQuestions([...serviceQuestions, ...subServiceQuestions, ...specialtyQuestions]);
        
        const serviceItems = formData.serviceId ? await getServiceItems(formData.serviceId) : [];
        const subServiceItems = formData.subServiceId ? await getServiceItems(undefined, formData.subServiceId) : [];
        const specialtyItems = formData.specialtyId ? await getServiceItems(undefined, undefined, formData.specialtyId) : [];
        
        const allItems = [...serviceItems, ...subServiceItems, ...specialtyItems];
        setItems(allItems);
        
        setHasSquareMeterItems(allItems.some(item => item.type === 'square_meter'));
        setHasLinearMeterItems(allItems.some(item => item.type === 'linear_meter'));
        
        // Set initial sub-step - choose first available sub-step
        if (serviceQuestions.length > 0 || subServiceQuestions.length > 0 || specialtyQuestions.length > 0) {
          setDetailsSubStep('quiz');
          if (!visitedSteps.includes('quiz')) {
            setVisitedSteps(prev => [...prev, 'quiz']);
          }
        } else if (allItems.length > 0) {
          setDetailsSubStep('items');
          if (!visitedSteps.includes('items')) {
            setVisitedSteps(prev => [...prev, 'items']);
          }
        } else if (hasSquareMeterItems || hasLinearMeterItems) {
          setDetailsSubStep('measurements');
          if (!visitedSteps.includes('measurements')) {
            setVisitedSteps(prev => [...prev, 'measurements']);
          }
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

  // Check if all questions are answered
  useEffect(() => {
    const checkQuestionsAnswered = () => {
      if (questions.length === 0) {
        setAllQuestionsAnswered(true);
        return;
      }
      
      const answeredQuestions = questions.filter(q => answers[q.id]);
      setAllQuestionsAnswered(answeredQuestions.length === questions.length);
    };
    
    checkQuestionsAnswered();
  }, [answers, questions]);

  // Check if all required items are filled
  useEffect(() => {
    const checkItemsFilled = () => {
      if (items.length === 0) {
        setAllItemsFilled(true);
        return;
      }
      
      // Consider item filled if it has any quantity or is zero
      const filledItems = items.filter(item => itemQuantities[item.id] !== undefined);
      setAllItemsFilled(filledItems.length === items.length);
    };
    
    checkItemsFilled();
  }, [itemQuantities, items]);

  // Check if measurements are filled
  useEffect(() => {
    const checkMeasurementsFilled = () => {
      if (!hasSquareMeterItems && !hasLinearMeterItems) {
        setAllMeasurementsFilled(true);
        return;
      }
      
      // If we need measurements, require at least one
      setAllMeasurementsFilled(measurements.length > 0);
    };
    
    checkMeasurementsFilled();
  }, [measurements, hasSquareMeterItems, hasLinearMeterItems]);

  // Auto advance to next sub-step when current is complete
  useEffect(() => {
    if (detailsSubStep === 'quiz' && allQuestionsAnswered) {
      if (items.length > 0) {
        setDetailsSubStep('items');
        if (!visitedSteps.includes('items')) {
          setVisitedSteps(prev => [...prev, 'items']);
        }
      } else if ((hasSquareMeterItems || hasLinearMeterItems) && !allMeasurementsFilled) {
        setDetailsSubStep('measurements');
        if (!visitedSteps.includes('measurements')) {
          setVisitedSteps(prev => [...prev, 'measurements']);
        }
      }
    } else if (detailsSubStep === 'items' && allItemsFilled) {
      if ((hasSquareMeterItems || hasLinearMeterItems) && !allMeasurementsFilled) {
        setDetailsSubStep('measurements');
        if (!visitedSteps.includes('measurements')) {
          setVisitedSteps(prev => [...prev, 'measurements']);
        }
      }
    }
  }, [allQuestionsAnswered, allItemsFilled, detailsSubStep, items.length, hasSquareMeterItems, hasLinearMeterItems]);

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

  const nextDetailsSubStep = () => {
    if (detailsSubStep === 'quiz') {
      setDetailsSubStep('items');
      if (!visitedSteps.includes('items')) {
        setVisitedSteps(prev => [...prev, 'items']);
      }
    } else if (detailsSubStep === 'items') {
      setDetailsSubStep('measurements');
      if (!visitedSteps.includes('measurements')) {
        setVisitedSteps(prev => [...prev, 'measurements']);
      }
    }
  };

  const prevDetailsSubStep = () => {
    if (detailsSubStep === 'items') {
      setDetailsSubStep('quiz');
    } else if (detailsSubStep === 'measurements') {
      setDetailsSubStep('items');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateFormData({
      answers,
      itemQuantities,
      measurements
    });
    
    onNext();
  };

  const allSubStepsVisited = () => {
    const requiredSteps = [];
    
    if (questions.length > 0) requiredSteps.push('quiz');
    if (items.length > 0) requiredSteps.push('items');
    if (hasSquareMeterItems || hasLinearMeterItems) requiredSteps.push('measurements');
    
    return requiredSteps.every(step => visitedSteps.includes(step));
  };

  if (loading) {
    return <div className="text-center py-8">Carregando detalhes do serviço...</div>;
  }

  // If there are no details to collect, just show a simple message and allow proceeding
  if (questions.length === 0 && items.length === 0 && !hasSquareMeterItems && !hasLinearMeterItems) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p>Não há detalhes adicionais necessários para este serviço.</p>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button onClick={onNext}>
            Próximo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Progress bar calculation
  const calculateProgress = () => {
    const steps = [];
    if (questions.length > 0) steps.push('quiz');
    if (items.length > 0) steps.push('items');
    if (hasSquareMeterItems || hasLinearMeterItems) steps.push('measurements');
    
    const currentIndex = steps.indexOf(detailsSubStep);
    const totalSteps = steps.length;
    
    return ((currentIndex + 1) / totalSteps) * 100;
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-muted-foreground">
            Passo {
              detailsSubStep === 'quiz' ? '1' : 
              detailsSubStep === 'items' ? '2' : '3'
            } de {
              [questions.length > 0, items.length > 0, (hasSquareMeterItems || hasLinearMeterItems)].filter(Boolean).length
            }
          </p>
          <p className="text-sm font-medium">
            {
              detailsSubStep === 'quiz' ? 'Questionário' :
              detailsSubStep === 'items' ? 'Itens do Serviço' : 'Medidas'
            }
          </p>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
      </div>

      {detailsSubStep === 'quiz' && (
        <div className="space-y-4">
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
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            {items.length > 0 ? (
              <Button 
                type="button" 
                onClick={nextDetailsSubStep}
              >
                Próximo <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (hasSquareMeterItems || hasLinearMeterItems) ? (
              <Button 
                type="button" 
                onClick={nextDetailsSubStep}
              >
                Próximo <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={!allSubStepsVisited()}
              >
                Próximo <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {detailsSubStep === 'items' && (
        <div className="space-y-4">
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
          
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={questions.length > 0 ? prevDetailsSubStep : onBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            
            {(hasSquareMeterItems || hasLinearMeterItems) ? (
              <Button 
                type="button" 
                onClick={nextDetailsSubStep}
              >
                Próximo <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={!allSubStepsVisited()}
              >
                Próximo <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {detailsSubStep === 'measurements' && (
        <div className="space-y-4">
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
          
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevDetailsSubStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button 
              type="submit"
              disabled={!allSubStepsVisited() || (measurements.length === 0 && (hasSquareMeterItems || hasLinearMeterItems))}
            >
              Próximo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};

// Review Step Component
const ReviewStep: React.FC<{
  onSubmit: () => void;
  onBack: () => void;
  onEditSection: (section: string) => void;
  formData: FormData;
}> = ({ onSubmit, onBack, onEditSection, formData }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-center">Revise seu pedido de orçamento</h3>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">Serviço Solicitado</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditSection('service')}>
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Serviço:</span>
              <span className="font-medium">{formData.serviceName}</span>
            </div>
            {formData.subServiceName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo de serviço:</span>
                <span className="font-medium">{formData.subServiceName}</span>
              </div>
            )}
            {formData.specialtyName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Especialidade:</span>
                <span className="font-medium">{formData.specialtyName}</span>
              </div>
            )}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">Endereço</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditSection('address')}>
            Editar
          </Button>
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
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={onSubmit}>
          Enviar Orçamento
        </Button>
      </div>
    </div>
  );
};

// Login Dialog Component
const LoginDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  formData: FormData;
}> = ({ isOpen, onOpenChange, onLogin, formData }) => {
  const navigate = useNavigate();
  
  const handleLoginRedirect = () => {
    onOpenChange(false);
    navigate('/login', { state: { returnTo: '/request-quote' } });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login necessário</DialogTitle>
          <DialogDescription>
            Para enviar seu pedido de orçamento, é necessário fazer login ou criar uma conta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-500">
            Você precisa ter uma conta para receber cotações dos prestadores de serviço.
            As informações do seu orçamento serão salvas.
          </p>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Voltar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleLoginRedirect}>
            Fazer login ou criar conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
const QuoteRequestForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedFormData = localStorage.getItem('quoteFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  const updateFormData = (data: Partial<FormData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);
    localStorage.setItem('quoteFormData', JSON.stringify(updatedData));
  };

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    window.scrollTo(0, 0);
  };

  const handleEditSection = (section: string) => {
    if (section === 'service') {
      handleStepChange(1);
    } else if (section === 'details') {
      handleStepChange(2);
    } else if (section === 'address') {
      handleStepChange(3);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          client_id: user.id,
          service_id: formData.serviceId || '',
          sub_service_id: formData.subServiceId || null,
          specialty_id: formData.specialtyId || null,
          description: formData.description || '',
          street: formData.street || '',
          number: formData.number || '',
          complement: formData.complement || '',
          neighborhood: formData.neighborhood || '',
          city: formData.city || '', 
          state: formData.state || '',
          zip_code: formData.zipCode || ''
        })
        .select()
        .single();
      
      if (quoteError) throw quoteError;
      
      if (formData.answers) {
        const answerRows = Object.entries(formData.answers).map(([questionId, optionId]) => ({
          quote_id: quote.id,
          question_id: questionId,
          option_id: optionId
        }));
        
        if (answerRows.length > 0) {
          const { error: answersError } = await supabase
            .from('quote_answers')
            .insert(answerRows);
          
          if (answersError) throw answersError;
        }
      }
      
      if (formData.itemQuantities) {
        const itemRows = Object.entries(formData.itemQuantities)
          .filter(([_, quantity]) => quantity && quantity > 0)
          .map(([itemId, quantity]) => ({
            quote_id: quote.id,
            item_id: itemId,
            quantity: quantity
          }));
        
        if (itemRows.length > 0) {
          const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(itemRows);
          
          if (itemsError) throw itemsError;
        }
      }
      
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
      
      localStorage.removeItem('quoteFormData');
      
      toast.success('Orçamento solicitado com sucesso!');
      navigate('/profile');
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Erro ao enviar orçamento. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedAfterLogin = () => {
    handleSubmit();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Solicitar Orçamento</h2>
          
          <div className="flex justify-between relative mb-6">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
            
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
                  {s === 1 && 'Serviço'}
                  {s === 2 && 'Detalhes'}
                  {s === 3 && 'Endereço'}
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
            <ServiceStep 
              onNext={() => handleStepChange(2)} 
              formData={formData} 
              updateFormData={updateFormData} 
            />
          )}
          
          {step === 2 && (
            <ServiceDetailsStep 
              onNext={() => handleStepChange(3)} 
              onBack={() => handleStepChange(1)} 
              formData={formData} 
              updateFormData={updateFormData} 
            />
          )}
          
          {step === 3 && (
            <AddressStep 
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
              onEditSection={handleEditSection}
              formData={formData}
            />
          )}
        </motion.div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Enviando orçamento...</p>
          </div>
        </div>
      )}

      <LoginDialog 
        isOpen={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
        onLogin={proceedAfterLogin}
        formData={formData}
      />
    </div>
  );
};

export default QuoteRequestForm;
