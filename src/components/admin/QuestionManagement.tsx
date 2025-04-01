
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface QuestionFormData {
  id?: string;
  question: string;
  options: { id?: string; text: string }[];
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
}

interface QuestionManagementProps {
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
  parentName: string;
  level: 'service' | 'subService' | 'specialty';
}

const QuestionManagement: React.FC<QuestionManagementProps> = ({ 
  serviceId, 
  subServiceId, 
  specialtyId, 
  parentName,
  level
}) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionFormData>({
    question: '',
    options: [{ text: '' }],
    serviceId,
    subServiceId,
    specialtyId
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch questions for the current parent
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', serviceId, subServiceId, specialtyId],
    queryFn: async () => {
      let query = supabase
        .from('service_questions')
        .select(`
          *,
          question_options(*)
        `);
      
      if (level === 'service' && serviceId) {
        query = query.eq('service_id', serviceId)
          .is('sub_service_id', null)
          .is('specialty_id', null);
      } else if (level === 'subService' && subServiceId) {
        query = query.eq('sub_service_id', subServiceId)
          .is('specialty_id', null);
      } else if (level === 'specialty' && specialtyId) {
        query = query.eq('specialty_id', specialtyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!(
      (level === 'service' && serviceId) ||
      (level === 'subService' && subServiceId) ||
      (level === 'specialty' && specialtyId)
    ),
  });

  // Reset form when parent changes
  React.useEffect(() => {
    setCurrentQuestion({
      question: '',
      options: [{ text: '' }],
      serviceId,
      subServiceId,
      specialtyId
    });
    setIsEditing(false);
  }, [serviceId, subServiceId, specialtyId]);

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (formData: QuestionFormData) => {
      try {
        // First, insert the question
        const questionData: any = {
          question: formData.question
        };
        
        if (level === 'service' && serviceId) {
          questionData.service_id = serviceId;
        } else if (level === 'subService' && subServiceId) {
          questionData.sub_service_id = subServiceId;
          if (serviceId) questionData.service_id = serviceId;
        } else if (level === 'specialty' && specialtyId) {
          questionData.specialty_id = specialtyId;
          if (subServiceId) questionData.sub_service_id = subServiceId;
          if (serviceId) questionData.service_id = serviceId;
        }
        
        const { data: questionData, error: questionError } = await supabase
          .from('service_questions')
          .insert([questionData])
          .select('id')
          .single();
        
        if (questionError) throw questionError;
        
        // Then insert the options
        const options = formData.options.filter(option => option.text.trim() !== '');
        
        if (options.length > 0) {
          const optionsData = options.map(option => ({
            question_id: questionData.id,
            option_text: option.text
          }));
          
          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsData);
          
          if (optionsError) throw optionsError;
        }
        
        return questionData.id;
      } catch (error) {
        console.error('Error creating question:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', serviceId, subServiceId, specialtyId] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Pergunta criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar pergunta: ${error.message || 'Desconhecido'}`);
    }
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async (formData: QuestionFormData) => {
      try {
        if (!formData.id) throw new Error('ID da pergunta não fornecido');
        
        // First, update the question
        const { error: questionError } = await supabase
          .from('service_questions')
          .update({ question: formData.question })
          .eq('id', formData.id);
        
        if (questionError) throw questionError;
        
        // Delete all existing options
        const { error: deleteError } = await supabase
          .from('question_options')
          .delete()
          .eq('question_id', formData.id);
        
        if (deleteError) throw deleteError;
        
        // Insert new options
        const options = formData.options.filter(option => option.text.trim() !== '');
        
        if (options.length > 0) {
          const optionsData = options.map(option => ({
            question_id: formData.id,
            option_text: option.text
          }));
          
          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsData);
          
          if (optionsError) throw optionsError;
        }
        
        return formData.id;
      } catch (error) {
        console.error('Error updating question:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', serviceId, subServiceId, specialtyId] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Pergunta atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar pergunta: ${error.message || 'Desconhecido'}`);
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      // Options will be deleted automatically due to foreign key constraint
      const { error } = await supabase
        .from('service_questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', serviceId, subServiceId, specialtyId] });
      toast.success('Pergunta excluída com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir pergunta: ${error.message || 'Desconhecido'}`);
    }
  });

  const resetForm = () => {
    setCurrentQuestion({
      question: '',
      options: [{ text: '' }],
      serviceId,
      subServiceId,
      specialtyId
    });
    setIsEditing(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.question) {
      toast.error('Texto da pergunta é obrigatório');
      return;
    }
    
    const validOptions = currentQuestion.options.filter(option => option.text.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Adicione pelo menos 2 opções de resposta');
      return;
    }
    
    if (isEditing && currentQuestion.id) {
      updateQuestionMutation.mutate(currentQuestion);
    } else {
      createQuestionMutation.mutate(currentQuestion);
    }
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: '' }]
    });
  };

  const removeOption = (index: number) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== index)
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], text: value };
    
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  const handleQuestionEdit = (question: any) => {
    setCurrentQuestion({
      id: question.id,
      question: question.question,
      options: question.question_options.map((option: any) => ({
        id: option.id,
        text: option.option_text
      })),
      serviceId: question.service_id,
      subServiceId: question.sub_service_id,
      specialtyId: question.specialty_id
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleQuestionDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.')) {
      deleteQuestionMutation.mutate(id);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Perguntas de {parentName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as perguntas disponíveis para este {level === 'service' ? 'serviço' : level === 'subService' ? 'sub-serviço' : 'especialidade'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="question" className="text-sm font-medium">
                  Pergunta <span className="text-red-500">*</span>
                </label>
                <Input
                  id="question"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                  placeholder="Ex: Qual tipo de material você prefere?"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Opções de Resposta <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Opção
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                      />
                      {currentQuestion.options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Adicione pelo menos duas opções de resposta
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {createQuestionMutation.isPending || updateQuestionMutation.isPending
                    ? 'Salvando...'
                    : isEditing 
                      ? 'Atualizar' 
                      : 'Criar'
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-10">Carregando perguntas...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhuma pergunta cadastrada para este {level === 'service' ? 'serviço' : level === 'subService' ? 'sub-serviço' : 'especialidade'}.
          </div>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
            {questions.map((question: any) => (
              <Card key={question.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{question.question}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuestionEdit(question)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleQuestionDelete(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {question.question_options.map((option: any) => (
                      <Badge key={option.id} variant="secondary">
                        {option.option_text}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionManagement;
