
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SubServiceFormData {
  id?: string;
  name: string;
  description?: string;
  serviceId: string;
}

interface SubServiceManagementProps {
  serviceId: string;
  serviceName: string;
}

const SubServiceManagement: React.FC<SubServiceManagementProps> = ({ serviceId, serviceName }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSubService, setCurrentSubService] = useState<SubServiceFormData>({
    name: '',
    description: '',
    serviceId: serviceId
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string | null>(null);

  // Fetch sub-services for the current service
  const { data: subServices = [], isLoading } = useQuery({
    queryKey: ['sub-services', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_services')
        .select('*')
        .eq('service_id', serviceId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!serviceId,
  });

  // Reset form when service changes
  useEffect(() => {
    setCurrentSubService({
      name: '',
      description: '',
      serviceId: serviceId
    });
    setIsEditing(false);
    setSelectedSubServiceId(null);
  }, [serviceId]);

  // Create sub-service mutation
  const createSubServiceMutation = useMutation({
    mutationFn: async (formData: SubServiceFormData) => {
      const { data, error } = await supabase
        .from('sub_services')
        .insert([
          { 
            name: formData.name,
            description: formData.description,
            service_id: formData.serviceId
          }
        ])
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-services', serviceId] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Sub-serviço criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar sub-serviço: ${error.message || 'Desconhecido'}`);
    }
  });

  // Update sub-service mutation
  const updateSubServiceMutation = useMutation({
    mutationFn: async (formData: SubServiceFormData) => {
      if (!formData.id) throw new Error('ID do sub-serviço não fornecido');

      const { error } = await supabase
        .from('sub_services')
        .update({ 
          name: formData.name,
          description: formData.description
        })
        .eq('id', formData.id);
      
      if (error) throw error;
      return formData.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-services', serviceId] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Sub-serviço atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar sub-serviço: ${error.message || 'Desconhecido'}`);
    }
  });

  // Delete sub-service mutation
  const deleteSubServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sub_services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-services', serviceId] });
      if (selectedSubServiceId === currentSubService.id) {
        setSelectedSubServiceId(null);
      }
      toast.success('Sub-serviço excluído com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir sub-serviço: ${error.message || 'Desconhecido'}`);
    }
  });

  const resetForm = () => {
    setCurrentSubService({
      name: '',
      description: '',
      serviceId: serviceId
    });
    setIsEditing(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSubService.name) {
      toast.error('Nome do sub-serviço é obrigatório');
      return;
    }
    
    if (isEditing && currentSubService.id) {
      updateSubServiceMutation.mutate(currentSubService);
    } else {
      createSubServiceMutation.mutate(currentSubService);
    }
  };

  const handleSubServiceEdit = (subService: any) => {
    setCurrentSubService({
      id: subService.id,
      name: subService.name,
      description: subService.description || '',
      serviceId: serviceId
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubServiceDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este sub-serviço? Esta ação não pode ser desfeita.')) {
      deleteSubServiceMutation.mutate(id);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sub-serviços de {serviceName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os sub-serviços disponíveis para {serviceName}
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
              Novo Sub-serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Sub-serviço' : 'Novo Sub-serviço'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Nome do Sub-serviço <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={currentSubService.name}
                  onChange={(e) => setCurrentSubService({...currentSubService, name: e.target.value})}
                  placeholder="Ex: Instalação de Tomadas, Reparos Hidráulicos"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  value={currentSubService.description || ''}
                  onChange={(e) => setCurrentSubService({...currentSubService, description: e.target.value})}
                  placeholder="Descreva brevemente este sub-serviço"
                  rows={3}
                />
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
                  disabled={createSubServiceMutation.isPending || updateSubServiceMutation.isPending}
                >
                  {createSubServiceMutation.isPending || updateSubServiceMutation.isPending
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
          <div className="text-center py-10">Carregando sub-serviços...</div>
        ) : subServices.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum sub-serviço cadastrado para este serviço.
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {subServices.map((subService: any) => (
              <Card key={subService.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{subService.name}</h3>
                    {subService.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {subService.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSubServiceEdit(subService)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleSubServiceDelete(subService.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
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

export default SubServiceManagement;
