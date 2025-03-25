
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Service, SubService, Specialty } from '@/lib/types';
import { getAllServices } from '@/lib/api/services';
import { Plus, Trash2, Edit, Save } from 'lucide-react';

// Admin Services Component
const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState('');
  const [newSubService, setNewSubService] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubService, setSelectedSubService] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadServices();
  }, []);
  
  const loadServices = async () => {
    setLoading(true);
    try {
      const servicesData = await getAllServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddService = async () => {
    if (!newService.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({ name: newService.trim() })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Serviço adicionado com sucesso');
      setNewService('');
      await loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Erro ao adicionar serviço');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddSubService = async () => {
    if (!selectedService || !newSubService.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('sub_services')
        .insert({ 
          service_id: selectedService,
          name: newSubService.trim() 
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Tipo de serviço adicionado com sucesso');
      setNewSubService('');
      await loadServices();
    } catch (error) {
      console.error('Error adding sub-service:', error);
      toast.error('Erro ao adicionar tipo de serviço');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddSpecialty = async () => {
    if (!selectedSubService || !newSpecialty.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('specialties')
        .insert({ 
          sub_service_id: selectedSubService,
          name: newSpecialty.trim() 
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Especialidade adicionada com sucesso');
      setNewSpecialty('');
      await loadServices();
    } catch (error) {
      console.error('Error adding specialty:', error);
      toast.error('Erro ao adicionar especialidade');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Serviço excluído com sucesso');
      await loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
    }
  };
  
  const handleDeleteSubService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de serviço? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sub_services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Tipo de serviço excluído com sucesso');
      await loadServices();
    } catch (error) {
      console.error('Error deleting sub-service:', error);
      toast.error('Erro ao excluir tipo de serviço');
    }
  };
  
  const handleDeleteSpecialty = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta especialidade? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('specialties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Especialidade excluída com sucesso');
      await loadServices();
    } catch (error) {
      console.error('Error deleting specialty:', error);
      toast.error('Erro ao excluir especialidade');
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Carregando serviços...</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Adicionar Serviço</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="new-service">Nome do Serviço</Label>
                  <Input 
                    id="new-service" 
                    value={newService} 
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Ex: Eletricista"
                  />
                </div>
                <Button onClick={handleAddService} disabled={saving || !newService.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Adicionar Tipo de Serviço</h3>
              <div className="space-y-2">
                <Label htmlFor="select-service">Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="select-service">
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
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="new-sub-service">Nome do Tipo de Serviço</Label>
                    <Input 
                      id="new-sub-service" 
                      value={newSubService} 
                      onChange={(e) => setNewSubService(e.target.value)}
                      placeholder="Ex: Instalação"
                    />
                  </div>
                  <Button onClick={handleAddSubService} disabled={saving || !newSubService.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Adicionar Especialidade</h3>
              <div className="space-y-2">
                <Label htmlFor="select-service-2">Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="select-service-2">
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
                  <Label htmlFor="select-sub-service">Tipo de Serviço</Label>
                  <Select value={selectedSubService} onValueChange={setSelectedSubService}>
                    <SelectTrigger id="select-sub-service">
                      <SelectValue placeholder="Selecione um tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .find(s => s.id === selectedService)?.subServices
                        .map((subService) => (
                          <SelectItem key={subService.id} value={subService.id}>
                            {subService.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedSubService && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="new-specialty">Nome da Especialidade</Label>
                    <Input 
                      id="new-specialty" 
                      value={newSpecialty} 
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="Ex: Instalação de Tomadas"
                    />
                  </div>
                  <Button onClick={handleAddSpecialty} disabled={saving || !newSpecialty.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Serviços Existentes</h3>
              
              <div className="space-y-6">
                {services.map((service) => (
                  <div key={service.id} className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <h4 className="font-medium">{service.name}</h4>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="pl-4 space-y-4">
                      {service.subServices.map((subService) => (
                        <div key={subService.id} className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-50/50 rounded-md">
                            <h5 className="font-medium text-gray-700">{subService.name}</h5>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteSubService(subService.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          
                          <div className="pl-4 space-y-2">
                            {subService.specialties.map((specialty) => (
                              <div 
                                key={specialty.id} 
                                className="flex items-center justify-between p-2 border border-gray-100 rounded-md"
                              >
                                <span>{specialty.name}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteSpecialty(specialty.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Questions Component
const AdminQuestions: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubService, setSelectedSubService] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOption, setNewOption] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [questionOptions, setQuestionOptions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadServices();
  }, []);
  
  useEffect(() => {
    // Reset sub selections when parent changes
    if (selectedService) {
      setSelectedSubService('');
      setSelectedSpecialty('');
      loadQuestions('service', selectedService);
    }
  }, [selectedService]);
  
  useEffect(() => {
    if (selectedSubService) {
      setSelectedSpecialty('');
      loadQuestions('sub_service', selectedSubService);
    }
  }, [selectedSubService]);
  
  useEffect(() => {
    if (selectedSpecialty) {
      loadQuestions('specialty', selectedSpecialty);
    }
  }, [selectedSpecialty]);
  
  useEffect(() => {
    if (selectedQuestion) {
      loadQuestionOptions();
    } else {
      setQuestionOptions([]);
    }
  }, [selectedQuestion]);
  
  const loadServices = async () => {
    setLoading(true);
    try {
      const servicesData = await getAllServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };
  
  const loadQuestions = async (type: string, id: string) => {
    try {
      let column = '';
      if (type === 'service') {
        column = 'service_id';
      } else if (type === 'sub_service') {
        column = 'sub_service_id';
      } else {
        column = 'specialty_id';
      }
      
      const { data, error } = await supabase
        .from('service_questions')
        .select('*')
        .eq(column, id);
      
      if (error) throw error;
      
      setQuestions(data || []);
      setSelectedQuestion('');
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Erro ao carregar perguntas');
    }
  };
  
  const loadQuestionOptions = async () => {
    if (!selectedQuestion) return;
    
    try {
      const { data, error } = await supabase
        .from('question_options')
        .select('*')
        .eq('question_id', selectedQuestion);
      
      if (error) throw error;
      
      setQuestionOptions(data || []);
    } catch (error) {
      console.error('Error loading question options:', error);
      toast.error('Erro ao carregar opções da pergunta');
    }
  };
  
  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    let questionData: any = {
      question: newQuestion.trim()
    };
    
    if (selectedSpecialty) {
      questionData.specialty_id = selectedSpecialty;
    } else if (selectedSubService) {
      questionData.sub_service_id = selectedSubService;
    } else if (selectedService) {
      questionData.service_id = selectedService;
    } else {
      toast.error('Selecione um serviço, tipo de serviço ou especialidade');
      return;
    }
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('service_questions')
        .insert(questionData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Pergunta adicionada com sucesso');
      setNewQuestion('');
      
      // Reload questions
      if (selectedSpecialty) {
        loadQuestions('specialty', selectedSpecialty);
      } else if (selectedSubService) {
        loadQuestions('sub_service', selectedSubService);
      } else {
        loadQuestions('service', selectedService);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Erro ao adicionar pergunta');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddOption = async () => {
    if (!selectedQuestion || !newOption.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('question_options')
        .insert({
          question_id: selectedQuestion,
          option_text: newOption.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Opção adicionada com sucesso');
      setNewOption('');
      await loadQuestionOptions();
    } catch (error) {
      console.error('Error adding option:', error);
      toast.error('Erro ao adicionar opção');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('service_questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Pergunta excluída com sucesso');
      
      // Reload questions
      if (selectedSpecialty) {
        loadQuestions('specialty', selectedSpecialty);
      } else if (selectedSubService) {
        loadQuestions('sub_service', selectedSubService);
      } else {
        loadQuestions('service', selectedService);
      }
      
      if (selectedQuestion === id) {
        setSelectedQuestion('');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Erro ao excluir pergunta');
    }
  };
  
  const handleDeleteOption = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta opção? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('question_options')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Opção excluída com sucesso');
      await loadQuestionOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast.error('Erro ao excluir opção');
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Carregando serviços...</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Perguntas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="select-service-question">Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="select-service-question">
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
                  <Label htmlFor="select-sub-service-question">Tipo de Serviço (opcional)</Label>
                  <Select value={selectedSubService} onValueChange={setSelectedSubService}>
                    <SelectTrigger id="select-sub-service-question">
                      <SelectValue placeholder="Selecione um tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .find(s => s.id === selectedService)?.subServices
                        .map((subService) => (
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
                  <Label htmlFor="select-specialty-question">Especialidade (opcional)</Label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger id="select-specialty-question">
                      <SelectValue placeholder="Selecione uma especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .find(s => s.id === selectedService)?.subServices
                        .find(ss => ss.id === selectedSubService)?.specialties
                        .map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Adicionar Pergunta</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="new-question">Pergunta</Label>
                  <Input 
                    id="new-question" 
                    value={newQuestion} 
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ex: Qual o tipo de construção?"
                  />
                </div>
                <Button 
                  onClick={handleAddQuestion} 
                  disabled={saving || !newQuestion.trim() || (!selectedService && !selectedSubService && !selectedSpecialty)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Perguntas Existentes</h3>
              
              {questions.length === 0 ? (
                <p className="text-gray-500 text-center p-4">
                  Não há perguntas para {selectedSpecialty ? 'esta especialidade' : 
                                          selectedSubService ? 'este tipo de serviço' : 
                                          selectedService ? 'este serviço' : ''}
                </p>
              ) : (
                <div className="space-y-3">
                  {questions.map((question) => (
                    <div key={question.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{question.question}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedQuestion(question.id)}
                        >
                          Ver opções
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedQuestion && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium">
                    Opções para: {questions.find(q => q.id === selectedQuestion)?.question}
                  </h3>
                  
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="new-option">Nova Opção</Label>
                      <Input 
                        id="new-option" 
                        value={newOption} 
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Ex: Casa"
                      />
                    </div>
                    <Button onClick={handleAddOption} disabled={saving || !newOption.trim()}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  
                  {questionOptions.length === 0 ? (
                    <p className="text-gray-500 text-center p-4">
                      Não há opções para esta pergunta
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {questionOptions.map((option) => (
                        <div key={option.id} className="flex items-center justify-between p-2 border rounded-md">
                          <span>{option.option_text}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteOption(option.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Items Component
const AdminItems: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubService, setSelectedSubService] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'quantity' | 'square_meter' | 'linear_meter'>('quantity');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadServices();
  }, []);
  
  useEffect(() => {
    // Reset sub selections when parent changes
    if (selectedService) {
      setSelectedSubService('');
      setSelectedSpecialty('');
      loadItems('service', selectedService);
    }
  }, [selectedService]);
  
  useEffect(() => {
    if (selectedSubService) {
      setSelectedSpecialty('');
      loadItems('sub_service', selectedSubService);
    }
  }, [selectedSubService]);
  
  useEffect(() => {
    if (selectedSpecialty) {
      loadItems('specialty', selectedSpecialty);
    }
  }, [selectedSpecialty]);
  
  const loadServices = async () => {
    setLoading(true);
    try {
      const servicesData = await getAllServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };
  
  const loadItems = async (type: string, id: string) => {
    try {
      let column = '';
      if (type === 'service') {
        column = 'service_id';
      } else if (type === 'sub_service') {
        column = 'sub_service_id';
      } else {
        column = 'specialty_id';
      }
      
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq(column, id);
      
      if (error) throw error;
      
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Erro ao carregar itens');
    }
  };
  
  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemType) return;
    
    let itemData: any = {
      name: newItemName.trim(),
      type: newItemType
    };
    
    if (selectedSpecialty) {
      itemData.specialty_id = selectedSpecialty;
    } else if (selectedSubService) {
      itemData.sub_service_id = selectedSubService;
    } else if (selectedService) {
      itemData.service_id = selectedService;
    } else {
      toast.error('Selecione um serviço, tipo de serviço ou especialidade');
      return;
    }
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('service_items')
        .insert(itemData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Item adicionado com sucesso');
      setNewItemName('');
      
      // Reload items
      if (selectedSpecialty) {
        loadItems('specialty', selectedSpecialty);
      } else if (selectedSubService) {
        loadItems('sub_service', selectedSubService);
      } else {
        loadItems('service', selectedService);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Erro ao adicionar item');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('service_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Item excluído com sucesso');
      
      // Reload items
      if (selectedSpecialty) {
        loadItems('specialty', selectedSpecialty);
      } else if (selectedSubService) {
        loadItems('sub_service', selectedSubService);
      } else {
        loadItems('service', selectedService);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao excluir item');
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Carregando serviços...</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Itens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="select-service-item">Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="select-service-item">
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
                  <Label htmlFor="select-sub-service-item">Tipo de Serviço (opcional)</Label>
                  <Select value={selectedSubService} onValueChange={setSelectedSubService}>
                    <SelectTrigger id="select-sub-service-item">
                      <SelectValue placeholder="Selecione um tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .find(s => s.id === selectedService)?.subServices
                        .map((subService) => (
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
                  <Label htmlFor="select-specialty-item">Especialidade (opcional)</Label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger id="select-specialty-item">
                      <SelectValue placeholder="Selecione uma especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .find(s => s.id === selectedService)?.subServices
                        .find(ss => ss.id === selectedSubService)?.specialties
                        .map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Adicionar Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-item-name">Nome do Item</Label>
                  <Input 
                    id="new-item-name" 
                    value={newItemName} 
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ex: Metro quadrado de parede"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-item-type">Tipo do Item</Label>
                  <Select 
                    value={newItemType} 
                    onValueChange={(value: any) => setNewItemType(value)}
                  >
                    <SelectTrigger id="new-item-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quantity">Quantidade</SelectItem>
                      <SelectItem value="square_meter">Metro Quadrado</SelectItem>
                      <SelectItem value="linear_meter">Metro Linear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleAddItem} 
                disabled={
                  saving || 
                  !newItemName.trim() || 
                  !newItemType || 
                  (!selectedService && !selectedSubService && !selectedSpecialty)
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Item
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Itens Existentes</h3>
              
              {items.length === 0 ? (
                <p className="text-gray-500 text-center p-4">
                  Não há itens para {selectedSpecialty ? 'esta especialidade' : 
                                     selectedSubService ? 'este tipo de serviço' : 
                                     selectedService ? 'este serviço' : ''}
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.type === 'quantity' ? 'Quantidade' : 
                           item.type === 'square_meter' ? 'Metro Quadrado' : 'Metro Linear'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Admin Component
const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  
  useEffect(() => {
    // Redirect if not admin
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== UserRole.ADMIN) {
      navigate('/profile');
      toast.error('Você não tem permissão para acessar essa página');
    }
  }, [user, navigate]);
  
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (!user || user.role !== UserRole.ADMIN) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Painel de Administração</h1>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="services">Serviços</TabsTrigger>
                <TabsTrigger value="questions">Perguntas</TabsTrigger>
                <TabsTrigger value="items">Itens</TabsTrigger>
              </TabsList>
              
              <TabsContent value="services">
                <AdminServices />
              </TabsContent>
              
              <TabsContent value="questions">
                <AdminQuestions />
              </TabsContent>
              
              <TabsContent value="items">
                <AdminItems />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
