
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SpecialtyFormData {
  id?: string;
  name: string;
  subServiceId: string;
}

interface SpecialtyManagementProps {
  subServiceId: string;
  subServiceName: string;
}

const SpecialtyManagement: React.FC<SpecialtyManagementProps> = ({ subServiceId, subServiceName }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSpecialty, setCurrentSpecialty] = useState<SpecialtyFormData>({
    name: '',
    subServiceId: subServiceId
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch specialties for the current sub-service
  const { data: specialties = [], isLoading } = useQuery({
    queryKey: ['specialties', subServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .eq('sub_service_id', subServiceId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!subServiceId,
  });

  // Reset form when sub-service changes
  React.useEffect(() => {
    setCurrentSpecialty({
      name: '',
      subServiceId: subServiceId
    });
    setIsEditing(false);
  }, [subServiceId]);

  // Create specialty mutation
  const createSpecialtyMutation = useMutation({
    mutationFn: async (formData: SpecialtyFormData) => {
      const { data, error } = await supabase
        .from('specialties')
        .insert([
          { 
            name: formData.name,
            sub_service_id: formData.subServiceId
          }
        ])
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties', subServiceId] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Especialidade criada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar especialidade: ${error.message || 'Desconhecido'}`);
    }
  });

  // Update specialty mutation
  const updateSpecialtyMutation = useMutation({
    mutationFn: async (formData: SpecialtyFormData) => {
      if (!formData.id) throw new Error('ID da especialidade não fornecido');

      const { error } = await supabase
        .from('specialties')
        .update({ name: formData.name })
        .eq('id', formData.id);
      
      if (error) throw error;
      return formData.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties', subServiceId] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Especialidade atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar especialidade: ${error.message || 'Desconhecido'}`);
    }
  });

  // Delete specialty mutation
  const deleteSpecialtyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('specialties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties', subServiceId] });
      toast.success('Especialidade excluída com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir especialidade: ${error.message || 'Desconhecido'}`);
    }
  });

  const resetForm = () => {
    setCurrentSpecialty({
      name: '',
      subServiceId: subServiceId
    });
    setIsEditing(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSpecialty.name) {
      toast.error('Nome da especialidade é obrigatório');
      return;
    }
    
    if (isEditing && currentSpecialty.id) {
      updateSpecialtyMutation.mutate(currentSpecialty);
    } else {
      createSpecialtyMutation.mutate(currentSpecialty);
    }
  };

  const handleSpecialtyEdit = (specialty: any) => {
    setCurrentSpecialty({
      id: specialty.id,
      name: specialty.name,
      subServiceId: subServiceId
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSpecialtyDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta especialidade? Esta ação não pode ser desfeita.')) {
      deleteSpecialtyMutation.mutate(id);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Especialidades de {subServiceName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as especialidades disponíveis para este sub-serviço
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
              Nova Especialidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Especialidade' : 'Nova Especialidade'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Nome da Especialidade <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={currentSpecialty.name}
                  onChange={(e) => setCurrentSpecialty({...currentSpecialty, name: e.target.value})}
                  placeholder="Ex: Pintura Residencial, Instalação de Piso"
                  required
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
                  disabled={createSpecialtyMutation.isPending || updateSpecialtyMutation.isPending}
                >
                  {createSpecialtyMutation.isPending || updateSpecialtyMutation.isPending
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
          <div className="text-center py-10">Carregando especialidades...</div>
        ) : specialties.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhuma especialidade cadastrada para este sub-serviço.
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {specialties.map((specialty: any) => (
              <Card key={specialty.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{specialty.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSpecialtyEdit(specialty)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleSpecialtyDelete(specialty.id)}
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

export default SpecialtyManagement;
