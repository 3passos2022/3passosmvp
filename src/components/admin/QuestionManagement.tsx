import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface QuestionFormData {
  id?: string;
  question: string;
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
  options: Array<{
    id?: string;
    optionText: string;
    isNew?: boolean;
    toDelete?: boolean;
  }>;
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
    serviceId,
    subServiceId,
    specialtyId,
    options: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');

  // Determine query key and parameters based on the level
  const getQueryParams = () => {
    switch (level) {
      case 'service':
        return {
          key: ['questions', 'service', serviceId],
          field: 'service_id',
          value: serviceId
        };
      case 'subService':
        return {
          key: ['questions', 'subService', subServiceId],
          field: 'sub_service_id',
          value: subServiceId
        };
      case 'specialty':
        return {
          key: ['questions', 'specialty', specialtyId],
          field: 'specialty_id',
          value: specialtyId
        };
    }
  };

  const queryParams = getQueryParams();

  // Fetch questions for the current parent
  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryParams.key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_questions')
        .select('*, question_options(*)')
        .eq(queryParams.field, queryParams.value)
        .order('question');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!queryParams.value,
  });

  // Reset form when parent changes
  React.useEffect(() => {
    setCurrentQuestion({
      question: '',
      serviceId,
      subServiceId,
      specialtyId,
      options: []
    });
    setIsEditing(false);
  }, [serviceId, subServiceId, specialtyId]);

  // Handle adding a new option
  const addOption = () => {
    if (newOptionText.trim()) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: [
          ...prev.options,
          { optionText: newOptionText.trim(), isNew: true }
        ]
      }));
      setNewOptionText('');
    }
  };

  // Handle removing an option
  const removeOption = (index: number) => {
    const newOptions = [...currentQuestion.options];
    
    // If the option has an ID (existing in the DB), mark it for deletion
    if (newOptions[index].id) {
      newOptions[index] = { ...newOptions[index], toDelete: true };
    } else {
      // Otherwise, simply remove it from the array
      newOptions.splice(index, 1);
    }
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (formData: QuestionFormData) => {
      try {
        // First create the question
        const { data: questionData, error: questionError } = await supabase
          .from('service_questions')
          .insert([
            { 
              question: formData.question,
              service_id: formData.serviceId || null,
              sub_service_id: formData.subServiceId || null,
              specialty_id: formData.specialtyId || null
            }
          ])
          .select('id')
          .single();
        
        if (questionError) throw questionError;
        
        // Create options for the question
        if (formData.options.length > 0) {
          const optionsToCreate = formData.options.map(option => ({
            question_id: questionData.id,
            option_text: option.optionText
          }));
          
          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsToCreate);
          
          if (optionsError) throw optionsError;
        }
        
        return questionData.id;
      } catch (error) {
        console.error('Error creating question:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryParams.key });
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
        
        // Update the question
        const { error: questionError } = await supabase
          .from('service_questions')
          .update({ question: formData.question })
          .eq('id', formData.id);
        
        if (questionError) throw questionError;
        
        // Handle options operations: create new, update existing, delete marked
        const newOptions = formData.options
          .filter(option => option.isNew && !option.toDelete)
          .map(option => ({
            question_id: formData.id,
            option_text: option.optionText
          }));
          
        if (newOptions.length > 0) {
          const { error: createOptionsError } = await supabase
            .from('question_options')
            .insert(newOptions);
          
          if (createOptionsError) throw createOptionsError;
        }
        
        // Delete options marked for deletion
        const optionsToDelete = formData.options
          .filter(option => option.id && option.toDelete)
          .map(option => option.id);
          
        if (optionsToDelete.length > 0) {
          const { error: deleteOptionsError } = await supabase
            .from('question_options')
            .delete()
            .in('id', optionsToDelete);
          
          if (deleteOptionsError) throw deleteOptionsError;
        }
        
        return formData.id;
      } catch (error) {
        console.error('Error updating question:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryParams.key });
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
      try {
        // Delete options first (the cascade will happen automatically if we have foreign key constraints,
        // but we're being explicit here)
        const { error: optionsError } = await supabase
          .from('question_options')
          .delete()
          .eq('question_id', id);
        
        if (optionsError) throw optionsError;
        
        // Then delete the question
        const { error: questionError } = await supabase
          .from('service_questions')
          .delete()
          .eq('id', id);
        
        if (questionError) throw questionError;
        
        return id;
      } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryParams.key });
      toast.success('Pergunta excluída com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir pergunta: ${error.message || 'Desconhecido'}`);
    }
  });

  const resetForm = () => {
    setCurrentQuestion({
      question: '',
      serviceId,
      subServiceId,
      specialtyId,
      options: []
    });
    setIsEditing(false);
    setNewOptionText('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.question) {
      toast.error('Texto da pergunta é obrigatório');
      return;
    }
    
    if (currentQuestion.options.filter(o => !o.toDelete).length === 0) {
      toast.error('Pelo menos uma opção de resposta é obrigatória');
      return;
    }
    
    if (isEditing && currentQuestion.id) {
      updateQuestionMutation.mutate(currentQuestion);
    } else {
      createQuestionMutation.mutate(currentQuestion);
    }
  };

  const handleQuestionEdit = (question: any) => {
    setCurrentQuestion({
      id: question.id,
      question: question.question,
      serviceId: question.service_id,
      subServiceId: question.sub_service_id,
      specialtyId: question.specialty_id,
      options: question.question_options.map((option: any) => ({
        id: option.id,
        optionText: option.option_text
      }))
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleQuestionDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta pergunta e todas as suas opções? Esta ação não pode ser desfeita.')) {
      deleteQuestionMutation.mutate(id);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Perguntas para {parentName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as perguntas que serão feitas aos clientes
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
                  Texto da Pergunta <span className="text-red-500">*</span>
                </label>
                <Input
                  id="question"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                  placeholder="Ex: Qual tipo de pintura você precisa?"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  Opções de Resposta <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Ex: Pintura interna"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <Button type="button" onClick={addOption} size="sm">
                    Adicionar
                  </Button>
                </div>
                {currentQuestion.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentQuestion.options.map((option, index) => (
                      !option.toDelete && (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {option.optionText}
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="ml-1 text-xs rounded-full hover:bg-primary/20 h-4 w-4 inline-flex items-center justify-center"
                          >
                            &times;
                          </button>
                        </Badge>
                      )
                    ))}
                  </div>
                )}
                {currentQuestion.options.filter(o => !o.toDelete).length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Adicione pelo menos uma opção de resposta.
                  </p>
                )}
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
            Nenhuma pergunta cadastrada para {parentName}.
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
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <List className="h-3 w-3" />
                    <span>{question.question_options.length} opções</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {question.question_options.map((option: any) => (
                      <Badge key={option.id} variant="outline">
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
