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
  const [allStepsCompleted, setAllStepsCompleted] = useState(false);

  // Track required steps
  const [requiredSteps, setRequiredSteps] = useState<string[]>([]);

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
        
        const hasSquareItems = allItems.some(item => item.type === 'square_meter');
        const hasLinearItems = allItems.some(item => item.type === 'linear_meter');
        
        setHasSquareMeterItems(hasSquareItems);
        setHasLinearMeterItems(hasLinearItems);
        
        // Determine required steps
        const neededSteps = [];
        if (serviceQuestions.length > 0 || subServiceQuestions.length > 0 || specialtyQuestions.length > 0) {
          neededSteps.push('quiz');
        }
        if (allItems.length > 0) {
          neededSteps.push('items');
        }
        if (hasSquareItems || hasLinearItems) {
          neededSteps.push('measurements');
        }
        setRequiredSteps(neededSteps);
        
        // Set initial sub-step - choose first available sub-step
        if (neededSteps.length > 0) {
          setDetailsSubStep(neededSteps[0] as 'quiz' | 'items' | 'measurements');
          if (!visitedSteps.includes(neededSteps[0])) {
            setVisitedSteps(prev => [...prev, neededSteps[0]]);
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
    if (detailsSubStep === 'quiz' && allQuestionsAnswered && requiredSteps.includes('items')) {
      setDetailsSubStep('items');
      if (!visitedSteps.includes('items')) {
        setVisitedSteps(prev => [...prev, 'items']);
      }
    } else if (detailsSubStep === 'items' && allItemsFilled && requiredSteps.includes('measurements')) {
      setDetailsSubStep('measurements');
      if (!visitedSteps.includes('measurements')) {
        setVisitedSteps(prev => [...prev, 'items']);
      }
    }
  }, [allQuestionsAnswered, allItemsFilled, detailsSubStep, requiredSteps, visitedSteps]);

  // Check if all steps are completed
  useEffect(() => {
    const checkAllStepsCompleted = () => {
      // If no required steps, then we're done
      if (requiredSteps.length === 0) {
        setAllStepsCompleted(true);
        return;
      }
      
      // All required steps must be visited
      const allVisited = requiredSteps.every(step => visitedSteps.includes(step));
      
      // All necessary data must be filled
      const quizDone = !requiredSteps.includes('quiz') || allQuestionsAnswered;
      const itemsDone = !requiredSteps.includes('items') || allItemsFilled;
      const measurementsDone = !requiredSteps.includes('measurements') || allMeasurementsFilled;
      
      setAllStepsCompleted(allVisited && quizDone && itemsDone && measurementsDone);
    };
    
    checkAllStepsCompleted();
  }, [
    requiredSteps, 
    visitedSteps, 
    allQuestionsAnswered, 
    allItemsFilled, 
    allMeasurementsFilled
  ]);

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
    const currentStepIndex = requiredSteps.indexOf(detailsSubStep);
    if (currentStepIndex < requiredSteps.length - 1) {
      const nextStep = requiredSteps[currentStepIndex + 1] as 'quiz' | 'items' | 'measurements';
      setDetailsSubStep(nextStep);
      if (!visitedSteps.includes(nextStep)) {
        setVisitedSteps(prev => [...prev, nextStep]);
      }
    }
  };

  const prevDetailsSubStep = () => {
    const currentStepIndex = requiredSteps.indexOf(detailsSubStep);
    if (currentStepIndex > 0) {
      setDetailsSubStep(requiredSteps[currentStepIndex - 1] as 'quiz' | 'items' | 'measurements');
    } else {
      onBack();
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

  if (loading) {
    return <div className="text-center py-8">Carregando detalhes do serviço...</div>;
  }

  // If there are no details to collect, just show a simple message and allow proceeding
  if (requiredSteps.length === 0) {
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
    const currentIndex = requiredSteps.indexOf(detailsSubStep);
    return ((currentIndex + 1) / requiredSteps.length) * 100;
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-muted-foreground">
            Passo {requiredSteps.indexOf(detailsSubStep) + 1} de {requiredSteps.length}
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
            <Button type="button" variant="outline" onClick={prevDetailsSubStep}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            {requiredSteps.indexOf('quiz') < requiredSteps.length - 1 && (
              <Button 
                type="button" 
                onClick={nextDetailsSubStep}
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
              onClick={prevDetailsSubStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            
            {requiredSteps.indexOf('items') < requiredSteps.length - 1 && (
              <Button 
                type="button" 
                onClick={nextDetailsSubStep}
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
