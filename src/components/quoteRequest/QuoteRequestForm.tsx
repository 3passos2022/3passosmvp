import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Service, SubService, Specialty, ServiceQuestion, QuestionOption, ServiceItem } from '@/lib/types';
import { getQuestions, getServiceItems } from '@/lib/api/services';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
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

interface QuoteRequestFormProps {
  services?: Service[];
}

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

const ServiceStep: React.FC<{
  onNext: () => void;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  services?: Service[];
}> = ({ onNext, formData, updateFormData, services = [] }) => {
  const [loading, setLoading] = useState(!services || services.length === 0);
  const [selectedService, setSelectedService] = useState<string>(formData.serviceId || '');
  const [selectedSubService, setSelectedSubService] = useState<string>(formData.subServiceId || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(formData.specialtyId || '');
  const [servicesList, setServicesList] = useState<Service[]>(services || []);
  
  const subServices = servicesList.find(s => s.id === selectedService)?.subServices || [];
  const specialties = subServices.find(s => s.id === selectedSubService)?.specialties || [];

  useEffect(() => {
    if (services && services.length > 0) {
      setServicesList(services);
      setLoading(false);
      return;
    }
  }, [services]);

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

const ServiceDetailsStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}> = ({ onNext, onBack, formData, updateFormData }) => {
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
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [requiredSteps, setRequiredSteps] = useState<string[]>(['quiz']);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<string[]>(['quiz']);

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
        
        if (neededSteps.length > 0) {
          setDetailsSubStep(neededSteps[0] as 'quiz' | 'items' | 'measurements');
        }
      } catch (error) {
        console.error('Error loading service details:', error);
        toast.error('Erro ao carregar detalhes do serviço');
      } finally {
        setLoading(false);
      }
    }
    
    loadServiceDetails();
  }, [formData, formData.serviceId, formData.subServiceId, formData.specialtyId]);

  useEffect(() => {
    if (!carouselApi) return;

    function handleSelect() {
      setCurrentQuestionIndex(carouselApi.selectedScrollSnap());
    }

    carouselApi.on("select", handleSelect);
    setCurrentQuestionIndex(carouselApi.selectedScrollSnap());

    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);

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

  const goToSubStep = (step: 'quiz' | 'items' | 'measurements') => {
    setDetailsSubStep(step);
    if (!visitedSteps.includes(step)) {
      setVisitedSteps(prev => [...prev, step]);
    }
  };

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
      goToSubStep(nextStep);
    }
  };

  const prevDetailsSubStep = () => {
    const currentStepIndex = requiredSteps.indexOf(detailsSubStep);
    if (currentStepIndex > 0) {
      goToSubStep(requiredSteps[currentStepIndex - 1] as 'quiz' | 'items' | 'measurements');
    } else {
      onBack();
    }
  };

  const nextQuestion = () => {
    if (carouselApi && currentQuestionIndex < questions.length - 1) {
      carouselApi.scrollNext();
    }
  };

  const prevQuestion = () => {
    if (carouselApi && currentQuestionIndex > 0) {
      carouselApi.scrollPrev();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (detailsSubStep === 'quiz' && !allQuestionsAnswered) {
      toast.error('Por favor, responda todas as perguntas');
      return;
    }
    
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

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="flex justify-center mb-6">
        {requiredSteps.map((step, index) => (
          <div key={step} className="flex items-center">
            <Button 
              type="button"
              variant={detailsSubStep === step ? "default" : "outline"}
              size="sm"
              className={`rounded-full px-4 ${index === 0 ? "" : "ml-2"}`}
              onClick={() => goToSubStep(step as 'quiz' | 'items' | 'measurements')}
            >
              {step === 'quiz' ? 'Questionário' : 
               step === 'items' ? 'Itens' : 'Medidas'}
            </Button>
            {index < requiredSteps.length - 1 && (
              <div className="h-px w-4 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>

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
        <Progress 
          segments={requiredSteps.length} 
          activeSegment={requiredSteps.indexOf(detailsSubStep)}
          className="h-2"
        />
      </div>

      {detailsSubStep === 'quiz' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-4">Responda as perguntas abaixo</h3>
          
          {questions.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">
                  Pergunta {currentQuestionIndex + 1} de {questions.length}
                </p>
              </div>
              <Progress 
                value={((currentQuestionIndex + 1) / questions.length) * 100}
                className="h-1 mb-4"
              />
              
              <Carousel 
                className="w-full" 
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  dragFree: false
                }}
              >
                <CarouselContent>
                  {questions.map((question) => (
                    <CarouselItem key={question.id} className="w-full">
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
              </Carousel>
              
              <div className="flex justify-between mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevQuestion} 
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Pergunta Anterior
                </Button>
                <Button 
                  type="button"
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Próxima Pergunta <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <p>Não há perguntas disponíveis para este serviço.</p>
          )}
          
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={prevDetailsSubStep}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            {requiredSteps.indexOf('quiz') < requiredSteps.length - 1 && (
              <Button 
                type="button" 
                onClick={nextDetailsSubStep}
                disabled={!allQuestionsAnswered}
              >
                Próximo Sub-passo <ChevronRight className="ml-2 h-4 w-4" />
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
          
          <div className="flex justify-between pt-6 border-t mt-6">
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
                Próximo Sub-passo <ChevronRight className="ml-2 h-4 w-4" />
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
                        <Label>Nome do c�����modo/área (opcional)</Label>
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
          
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevDetailsSubStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button 
              type="submit"
            >
              Finalizar <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};

const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({ services }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  
  const nextStep = () => setCurrentStep(prev => prev + 1);
  
  const prevStep = () => setCurrentStep(prev => prev - 1);
  
  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  const canSubmit = () => {
    return !!(
      formData.serviceId &&
      formData.street &&
      formData.number &&
      formData.neighborhood &&
      formData.city &&
      formData.state &&
      formData.zipCode
    );
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!canSubmit()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Enviando dados de cotação via RPC...");
      
      const { data: quoteId, error } = await supabase.rpc(
        "submit_quote" as any,
        {
          p_service_id: formData.serviceId,
          p_sub_service_id: formData.subServiceId || null,
          p_specialty_id: formData.specialtyId || null,
          p_description: formData.description || null,
          p_street: formData.street || '',
          p_number: formData.number || '',
          p_complement: formData.complement || null,
          p_neighborhood: formData.neighborhood || '',
          p_city: formData.city || '',
          p_state: formData.state || '',
          p_zip_code: formData.zipCode || '',
          p_is_anonymous: !user
        }
      );
      
      if (error) {
        console.error('Erro ao enviar cotação:', error);
        toast.error(`Erro ao enviar o orçamento: ${error.message}`);
        return;
      }
      
      console.log("Cotação criada com sucesso. ID:", quoteId);
      
      if (formData.answers && Object.keys(formData.answers).length > 0) {
        const answersToInsert = Object.entries(formData.answers).map(([questionId, optionId]) => ({
          quote_id: quoteId as string,
          question_id: questionId,
          option_id: optionId,
        }));
        
        const { error: answersError } = await supabase
          .from('quote_answers')
          .insert(answersToInsert);
        
        if (answersError) {
          console.error('Erro ao salvar respostas:', answersError);
        }
      }
      
      if (formData.itemQuantities && Object.keys(formData.itemQuantities).length > 0) {
        const itemsToInsert = Object.entries(formData.itemQuantities)
          .filter(([_, quantity]) => quantity > 0)
          .map(([itemId, quantity]) => ({
            quote_id: quoteId as string,
            item_id: itemId,
            quantity,
          }));
        
        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(itemsToInsert);
          
          if (itemsError) {
            console.error('Erro ao salvar quantidades de itens:', itemsError);
          }
        }
      }
      
      if (formData.measurements && formData.measurements.length > 0) {
        const measurementsToInsert = formData.measurements.map(m => ({
          quote_id: quoteId as string,
          room_name: m.roomName,
          width: m.width,
          length: m.length,
          height: m.height || null,
          area: m.width * m.length,
        }));
        
        const { error: measurementsError } = await supabase
          .from('quote_measurements')
          .insert(measurementsToInsert);
        
        if (measurementsError) {
          console.error('Erro ao salvar medidas:', measurementsError);
        }
      }
      
      const address = {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      };
      
      const quoteDetails = {
        id: quoteId as string,
        serviceId: formData.serviceId || '',
        subServiceId: formData.subServiceId || '',
        specialtyId: formData.specialtyId || '',
        serviceName: formData.serviceName || '',
        subServiceName: formData.subServiceName || '',
        specialtyName: formData.specialtyName || '',
        items: formData.itemQuantities || {},
        measurements: formData.measurements || [],
        address: address,
        description: formData.description || '',
        clientId: user?.id || null
      };
      
      sessionStorage.setItem('currentQuote', JSON.stringify(quoteDetails));
      
      navigate('/prestadoresencontrados', { state: { quoteDetails } });
      
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Ocorreu um erro inesperado. Por favor tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const steps = [
    {
      title: 'Serviço',
      component: (
        <ServiceStep
          onNext={nextStep}
          formData={formData}
          updateFormData={updateFormData}
          services={services}
        />
      )
    },
    {
      title: 'Detalhes',
      component: (
        <ServiceDetailsStep
          onNext={nextStep}
          onBack={prevStep}
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: 'Endereço',
      component: (
        <AddressStep
          onNext={() => setShowReview(true)}
          onBack={prevStep}
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    }
  ];
  
  return (
    <div>
      <div className="flex mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex-1">
            <div 
              className={`
                flex flex-col items-center
                ${index <= currentStep ? 'text-primary' : 'text-gray-400'}
              `}
            >
              <div 
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full mb-2 
                  ${index < currentStep ? 'bg-primary text-white' : 
                    index === currentStep ? 'border-2 border-primary text-primary' : 
                    'border-2 border-gray-300'}
                `}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-sm">{step.title}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`
                  hidden md:block flex-grow h-0.5 mt-4
                  ${index < currentStep ? 'bg-primary' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        {steps[currentStep].component}
      </div>
      
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Orçamento</DialogTitle>
            <DialogDescription>
              Verifique as informações abaixo antes de enviar seu orçamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-medium text-lg mb-2">Serviço Selecionado</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Serviço</p>
                      <p className="font-medium">{formData.serviceName}</p>
                    </div>
                    
                    {formData.subServiceName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
                        <p className="font-medium">{formData.subServiceName}</p>
                      </div>
                    )}
                    
                    {formData.specialtyName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Especialidade</p>
                        <p className="font-medium">{formData.specialtyName}</p>
                      </div>
                    )}
                  </div>
                  
                  {formData.description && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="text-sm mt-1">{formData.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">Endereço</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-2">
                    <p>
                      {formData.street}, {formData.number}
                      {formData.complement && `, ${formData.complement}`}
                    </p>
                    <p>{formData.neighborhood}</p>
                    <p>
                      {formData.city} - {formData.state}
                    </p>
                    <p>CEP: {formData.zipCode}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReview(false)}>
              Editar
            </Button>
            <Button 
              onClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)}
              disabled={isSubmitting || !canSubmit()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Orçamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteRequestForm;
