
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ItemFormData {
  id?: string;
  name: string;
  type: 'quantity' | 'square_meter' | 'linear_meter';
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
}

interface ItemManagementProps {
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
  parentName: string;
  level: 'service' | 'subService' | 'specialty';
}

const ItemManagement: React.FC<ItemManagementProps> = ({ 
  serviceId,
  subServiceId, 
  specialtyId,
  parentName,
  level
}) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ItemFormData>({
    name: '',
    type: 'quantity',
    serviceId,
    subServiceId,
    specialtyId
  });
  const [isEditing, setIsEditing] = useState(false);

  // Determine query key and parameters based on the level
  const getQueryParams = () => {
    switch (level) {
      case 'service':
        return {
          key: ['items', 'service', serviceId],
          field: 'service_id',
          value: serviceId
        };
      case 'subService':
        return {
          key: ['items', 'subService', subServiceId],
          field: 'sub_service_id',
          value: subServiceId
        };
      case 'specialty':
        return {
          key: ['items', 'specialty', specialtyId],
          field: 'specialty_id',
          value: specialtyId
        };
    }
  };

  const queryParams = getQueryParams();

  // Fetch items for the current parent
  const { data: items = [], isLoading } = useQuery({
    queryKey: queryParams.key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq(queryParams.field, queryParams.value)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!queryParams.value,
  });

  // Reset form when parent changes
  React.useEffect(() => {
    setCurrentItem({
      name: '',
      type: 'quantity',
      serviceId,
      subServiceId,
      specialtyId
    });
    setIsEditing(false);
  }, [serviceId, subServiceId, specialtyId]);

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (formData: ItemFormData) => {
      const { data, error } = await supabase
        .from('service_items')
        .insert([
          { 
            name: formData.name,
            type: formData.type,
            service_id: formData.serviceId || null,
            sub_service_id: formData.subServiceId || null,
            specialty_id: formData.specialtyId || null
          }
        ])
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryParams.key });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Item criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar item: ${error.message || 'Desconhecido'}`);
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (formData: ItemFormData) => {
      if (!formData.id) throw new Error('ID do item não fornecido');

      const { error } = await supabase
        .from('service_items')
        .update({ 
          name: formData.name,
          type: formData.type
        })
        .eq('id', formData.id);
      
      if (error) throw error;
      return formData.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryParams.key });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Item atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar item: ${error.message || 'Desconhecido'}`);
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryParams.key });
      toast.success('Item excluído com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir item: ${error.message || 'Desconhecido'}`);
    }
  });

  const resetForm = () => {
    setCurrentItem({
      name: '',
      type: 'quantity',
      serviceId,
      subServiceId,
      specialtyId
    });
    setIsEditing(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem.name) {
      toast.error('Nome do item é obrigatório');
      return;
    }
    
    if (isEditing && currentItem.id) {
      updateItemMutation.mutate(currentItem);
    } else {
      createItemMutation.mutate(currentItem);
    }
  };

  const handleItemEdit = (item: any) => {
    setCurrentItem({
      id: item.id,
      name: item.name,
      type: item.type as 'quantity' | 'square_meter' | 'linear_meter',
      serviceId: item.service_id,
      subServiceId: item.sub_service_id,
      specialtyId: item.specialty_id
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleItemDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      deleteItemMutation.mutate(id);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quantity': return 'Quantidade';
      case 'square_meter': return 'Metro quadrado';
      case 'linear_meter': return 'Metro linear';
      default: return type;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Itens para {parentName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os itens que serão utilizados nos orçamentos
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
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Nome do Item <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                  placeholder="Ex: Tomada, Interruptor, Lata de tinta"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="type" className="text-sm font-medium">
                  Tipo de Medida <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={currentItem.type} 
                  onValueChange={(value) => setCurrentItem({
                    ...currentItem, 
                    type: value as 'quantity' | 'square_meter' | 'linear_meter'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantity">Quantidade</SelectItem>
                    <SelectItem value="square_meter">Metro quadrado</SelectItem>
                    <SelectItem value="linear_meter">Metro linear</SelectItem>
                  </SelectContent>
                </Select>
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
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {createItemMutation.isPending || updateItemMutation.isPending
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
          <div className="text-center py-10">Carregando itens...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum item cadastrado para {parentName}.
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {items.map((item: any) => (
              <Card key={item.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Tag className="h-3 w-3" />
                      <span>{getTypeLabel(item.type)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleItemEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleItemDelete(item.id)}
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

export default ItemManagement;
