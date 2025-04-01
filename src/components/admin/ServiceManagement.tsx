
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag, FileImage, Info, List } from 'lucide-react';
import { createService, deleteService, getServicesWithMeta, updateService, uploadServiceIcon } from '@/lib/api/services';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SubServiceManagement from './SubServiceManagement';
import QuestionManagement from './QuestionManagement';
import ItemManagement from './ItemManagement';

interface ServiceFormData {
  id?: string;
  name: string;
  description: string;
  tags: string[];
  icon?: File | null;
  icon_url?: string;
}

const ServiceManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<ServiceFormData>({
    name: '',
    description: '',
    tags: [],
    icon: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sub-services');

  // Fetch services
  const { data: services = [], isLoading, isError } = useQuery({
    queryKey: ['admin-services'],
    queryFn: getServicesWithMeta
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (formData: ServiceFormData) => {
      try {
        // First create the service
        const serviceId = await createService({
          name: formData.name,
          description: formData.description,
          tags: formData.tags
        });

        // If there's an icon, upload it
        if (formData.icon) {
          const iconUrl = await uploadServiceIcon(formData.icon, serviceId);
          await updateService(serviceId, { icon_url: iconUrl });
        }

        return serviceId;
      } catch (error) {
        console.error('Error creating service:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Serviço criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar serviço: ${error.message || 'Desconhecido'}`);
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (formData: ServiceFormData) => {
      if (!formData.id) throw new Error('ID do serviço não fornecido');

      try {
        const updateData: Record<string, any> = {
          name: formData.name,
          description: formData.description,
          tags: formData.tags
        };

        // If there's a new icon, upload it
        if (formData.icon) {
          const iconUrl = await uploadServiceIcon(formData.icon, formData.id);
          updateData.icon_url = iconUrl;
        }

        await updateService(formData.id, updateData);
        return formData.id;
      } catch (error) {
        console.error('Error updating service:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      resetForm();
      setIsDialogOpen(false);
      toast.success('Serviço atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar serviço: ${error.message || 'Desconhecido'}`);
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Serviço excluído com sucesso');
      if (selectedServiceId === currentService.id) {
        setSelectedServiceId(null);
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir serviço: ${error.message || 'Desconhecido'}`);
    }
  });

  const resetForm = () => {
    setCurrentService({
      name: '',
      description: '',
      tags: [],
      icon: null
    });
    setIsEditing(false);
    setTagInput('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentService.name) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }
    
    if (isEditing && currentService.id) {
      updateServiceMutation.mutate(currentService);
    } else {
      createServiceMutation.mutate(currentService);
    }
  };

  const handleServiceEdit = (service: any) => {
    setCurrentService({
      id: service.id,
      name: service.name,
      description: service.description || '',
      tags: service.tags || [],
      icon_url: service.icon_url
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleServiceDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      deleteServiceMutation.mutate(id);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !currentService.tags.includes(tagInput.trim())) {
      setCurrentService({
        ...currentService,
        tags: [...currentService.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setCurrentService({
      ...currentService,
      tags: currentService.tags.filter(t => t !== tag)
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validar tipo e tamanho
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      const maxSize = 500 * 1024; // 500KB
      
      if (!validTypes.includes(file.type)) {
        toast.error('O arquivo deve ser PNG, JPG ou SVG');
        return;
      }
      
      if (file.size > maxSize) {
        toast.error('O arquivo deve ter no máximo 500KB');
        return;
      }
      
      setCurrentService({
        ...currentService,
        icon: file
      });
    }
  };

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  const getSelectedService = () => {
    return services.find((service: any) => service.id === selectedServiceId);
  };

  if (isLoading) {
    return <div className="text-center py-10">Carregando serviços...</div>;
  }

  if (isError) {
    return <div className="text-center py-10 text-red-500">Erro ao carregar serviços. Por favor, tente novamente.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Serviços</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">
                  Nome do Serviço <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={currentService.name}
                  onChange={(e) => setCurrentService({...currentService, name: e.target.value})}
                  placeholder="Ex: Elétrica, Hidráulica, Pintura"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  value={currentService.description}
                  onChange={(e) => setCurrentService({...currentService, description: e.target.value})}
                  placeholder="Descreva brevemente este serviço"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="icon" className="text-sm font-medium">
                  Ícone {currentService.icon_url && <span className="text-xs text-gray-500">(Atual: já possui um ícone)</span>}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="icon"
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {currentService.icon_url && (
                    <div className="h-10 w-10 rounded border flex items-center justify-center overflow-hidden">
                      <img 
                        src={currentService.icon_url} 
                        alt="Ícone atual" 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 500KB
                </p>
              </div>
              
              <div>
                <label htmlFor="tags" className="text-sm font-medium">
                  Tags
                </label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Adicione tags relevantes"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Adicionar
                  </Button>
                </div>
                {currentService.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentService.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-xs rounded-full hover:bg-primary/20 h-4 w-4 inline-flex items-center justify-center"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
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
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                >
                  {createServiceMutation.isPending || updateServiceMutation.isPending
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
      </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Serviços Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pb-0">
              {services.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  Nenhum serviço cadastrado
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service: any) => (
                      <TableRow 
                        key={service.id}
                        className={selectedServiceId === service.id ? "bg-primary/5" : ""}
                      >
                        <TableCell 
                          className="cursor-pointer hover:text-primary"
                          onClick={() => selectService(service.id)}
                        >
                          <div className="flex items-center gap-2">
                            {service.icon_url && (
                              <div className="h-6 w-6 rounded overflow-hidden flex items-center justify-center">
                                <img 
                                  src={service.icon_url} 
                                  alt={service.name} 
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            )}
                            <span>{service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleServiceEdit(service)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleServiceDelete(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {selectedServiceId ? (
            <Tabs 
              defaultValue="sub-services" 
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="sub-services" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span>Sub-serviços</span>
                </TabsTrigger>
                <TabsTrigger value="questions" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Perguntas</span>
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Itens</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sub-services">
                <SubServiceManagement 
                  serviceId={selectedServiceId} 
                  serviceName={getSelectedService()?.name || ''}
                />
              </TabsContent>

              <TabsContent value="questions">
                <QuestionManagement
                  serviceId={selectedServiceId}
                  parentName={getSelectedService()?.name || ''}
                  level="service"
                />
              </TabsContent>

              <TabsContent value="items">
                <ItemManagement
                  serviceId={selectedServiceId}
                  parentName={getSelectedService()?.name || ''}
                  level="service"
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-10">
                <Info className="h-16 w-16 mx-auto text-muted-foreground opacity-30" />
                <h3 className="mt-4 text-lg font-medium">Selecione um serviço</h3>
                <p className="text-muted-foreground mt-2">
                  Selecione um serviço à esquerda para gerenciar seus sub-serviços e outros componentes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;
