
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag, FileImage, Info, List, Layers, PlusCircle, ArrowRight } from 'lucide-react';
import { createService, deleteService, getServicesWithMeta, updateService, uploadServiceIcon } from '@/lib/api/services';
import { Badge } from '@/components/ui/badge';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface ServiceFormData {
  id?: string;
  name: string;
  description: string;
  tags: string[];
  icon?: File | null;
  icon_url?: string;
}

// Create schema for service form validation
const serviceFormSchema = z.object({
  name: z.string().min(1, { message: "Nome do serviço é obrigatório" }),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const ServiceManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  // Set up form with react-hook-form
  const form = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      tags: [],
    },
  });

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
      setIsSheetOpen(false);
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
      setIsSheetOpen(false);
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
    form.reset();
  };

  const handleFormSubmit = (data: z.infer<typeof serviceFormSchema>) => {
    const formData = {
      ...currentService,
      name: data.name,
      description: data.description || '',
      tags: data.tags || []
    };
    
    if (isEditing && formData.id) {
      updateServiceMutation.mutate(formData);
    } else {
      createServiceMutation.mutate(formData);
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
    
    // Update form values
    form.reset({
      name: service.name,
      description: service.description || '',
      tags: service.tags || [],
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
      const newTags = [...(form.getValues().tags || []), tagInput.trim()];
      form.setValue('tags', newTags);
      setCurrentService({
        ...currentService,
        tags: newTags
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const newTags = (form.getValues().tags || []).filter(t => t !== tag);
    form.setValue('tags', newTags);
    setCurrentService({
      ...currentService,
      tags: newTags
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

  const renderServiceForm = () => {
    return (
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Serviço <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: Elétrica, Hidráulica, Pintura"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descreva brevemente este serviço"
                  rows={3}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel htmlFor="icon">
            Ícone {currentService.icon_url && <span className="text-xs text-gray-500">(Atual: já possui um ícone)</span>}
          </FormLabel>
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
          <FormLabel htmlFor="tags">Tags</FormLabel>
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
          {form.watch('tags')?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.watch('tags').map((tag, index) => (
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
              setIsSheetOpen(false);
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
    );
  };

  // Services Table or Empty State
  const renderServicesTable = () => {
    if (services.length === 0) {
      return (
        <div className="text-center py-10 flex flex-col items-center justify-center">
          <div className="bg-muted/30 p-6 rounded-lg max-w-lg">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum serviço foi encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando o primeiro serviço para começar a construir sua oferta de serviços.
            </p>
            <Button onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </div>
        </div>
      );
    }

    return (
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
    );
  };

  // Loading State
  if (isLoading) {
    return <div className="text-center py-10">Carregando serviços...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Serviços</h2>
        <div className="flex gap-2">
          {/* Botão para adicionar serviço em um modal */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
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
              {renderServiceForm()}
            </DialogContent>
          </Dialog>
          
          {/* Botão para adicionar serviço em um painel lateral */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsSheetOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Serviço Completo
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[450px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{isEditing ? 'Editar Serviço' : 'Novo Serviço'}</SheetTitle>
              </SheetHeader>
              <div className="py-6">
                <Tabs defaultValue="basic" className="mb-6">
                  <TabsList>
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="advanced" disabled={!currentService.id}>Sub-serviços</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic">
                    {renderServiceForm()}
                  </TabsContent>
                  <TabsContent value="advanced">
                    {currentService.id && (
                      <div className="py-4">
                        <p className="text-sm mb-2">
                          Para gerenciar os sub-serviços, selecione o serviço na tabela à esquerda.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsSheetOpen(false);
                            selectService(currentService.id!);
                          }}
                        >
                          Gerenciar Sub-serviços <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              <SheetFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsSheetOpen(false);
                  }}
                >
                  Cancelar
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Serviços Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pb-0">
              {isError ? (
                <div className="text-center py-4 text-amber-500">
                  Erro ao carregar serviços. Por favor, tente novamente.
                </div>
              ) : (
                renderServicesTable()
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
