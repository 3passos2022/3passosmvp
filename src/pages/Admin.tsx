
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { Redirect } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/admin/UserManagement';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ImagePlus, 
  Tag, 
  AlertCircle,
  Search, 
  X 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  createService,
  updateService,
  deleteService,
  uploadServiceIcon,
  deleteServiceIcon,
  getServicesWithMeta,
  clearServicesCache
} from '@/lib/api/services';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';

// Interface for basic service information
interface ServiceBasic {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  tags: string[];
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [isAddingService, setIsAddingService] = useState(false);
  const [isEditingService, setIsEditingService] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceTags, setServiceTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [serviceIcon, setServiceIcon] = useState<File | null>(null);
  const [serviceIconPreview, setServiceIconPreview] = useState<string | null>(null);

  // Service data query
  const { 
    data: services = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['admin-services'],
    queryFn: getServicesWithMeta,
  });

  useEffect(() => {
    clearServicesCache();
  }, []);

  // If user is not authenticated or not an admin, redirect to home
  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== UserRole.ADMIN) {
    return <Redirect to="/" />;
  }

  // Filter services based on search term
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (service.tags && service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Reset form fields
  const resetForm = () => {
    setServiceName('');
    setServiceDescription('');
    setServiceTags([]);
    setCurrentTag('');
    setServiceIcon(null);
    setServiceIconPreview(null);
    setIsAddingService(false);
    setIsEditingService(null);
  };

  // Add a tag to the service
  const addTag = () => {
    if (currentTag.trim() && !serviceTags.includes(currentTag.trim())) {
      setServiceTags([...serviceTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  // Remove a tag from the service
  const removeTag = (tagToRemove: string) => {
    setServiceTags(serviceTags.filter(tag => tag !== tagToRemove));
  };

  // Handle file selection for service icon
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (500KB max)
      if (file.size > 500 * 1024) {
        toast.error('O arquivo é muito grande. O tamanho máximo é 500KB.');
        return;
      }
      
      // Check file type
      const fileType = file.type.toLowerCase();
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(fileType)) {
        toast.error('Formato inválido. Use PNG, JPG ou SVG.');
        return;
      }
      
      setServiceIcon(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setServiceIconPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize edit form with service data
  const initEditForm = (service: ServiceBasic) => {
    setServiceName(service.name);
    setServiceDescription(service.description || '');
    setServiceTags(service.tags || []);
    setCurrentTag('');
    setServiceIcon(null);
    setServiceIconPreview(service.icon_url || null);
    setIsEditingService(service.id);
  };

  // Handle service creation
  const handleCreateService = async () => {
    try {
      if (!serviceName.trim()) {
        toast.error('Nome do serviço é obrigatório');
        return;
      }
      
      // Create the service first to get an ID
      const serviceId = await createService({
        name: serviceName,
        description: serviceDescription,
        tags: serviceTags,
      });
      
      // If there's an icon, upload it and update the service
      if (serviceIcon) {
        const iconUrl = await uploadServiceIcon(serviceIcon, serviceId);
        await updateService(serviceId, { icon_url: iconUrl });
      }
      
      toast.success('Serviço criado com sucesso!');
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Erro ao criar serviço');
    }
  };

  // Handle service update
  const handleUpdateService = async () => {
    try {
      if (!isEditingService || !serviceName.trim()) {
        toast.error('Nome do serviço é obrigatório');
        return;
      }
      
      // Prepare updates object
      const updates: {
        name: string;
        description?: string;
        tags?: string[];
        icon_url?: string;
      } = {
        name: serviceName,
        description: serviceDescription,
        tags: serviceTags,
      };
      
      // If there's a new icon, upload it
      if (serviceIcon) {
        const iconUrl = await uploadServiceIcon(serviceIcon, isEditingService);
        updates.icon_url = iconUrl;
      }
      
      // Update the service
      await updateService(isEditingService, updates);
      
      toast.success('Serviço atualizado com sucesso!');
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Erro ao atualizar serviço');
    }
  };

  // Handle service deletion
  const handleDeleteService = async (serviceId: string, icon_url: string | null) => {
    if (!confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // Delete the service icon if it exists
      if (icon_url) {
        await deleteServiceIcon(icon_url);
      }
      
      // Delete the service
      await deleteService(serviceId);
      
      toast.success('Serviço excluído com sucesso!');
      refetch();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Gerenciar Serviços</CardTitle>
                    <CardDescription>
                      Adicione, edite ou remova serviços disponíveis na plataforma.
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="search"
                        placeholder="Buscar serviços..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> Adicionar Serviço
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome do Serviço *</Label>
                            <Input 
                              id="name" 
                              value={serviceName} 
                              onChange={(e) => setServiceName(e.target.value)} 
                              placeholder="Ex: Pedreiro" 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input 
                              id="description" 
                              value={serviceDescription} 
                              onChange={(e) => setServiceDescription(e.target.value)} 
                              placeholder="Descreva brevemente este serviço" 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {serviceTags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {tag}
                                  <button 
                                    onClick={() => removeTag(tag)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex gap-2">
                              <Input 
                                value={currentTag} 
                                onChange={(e) => setCurrentTag(e.target.value)} 
                                placeholder="Ex: Reforma, Construção" 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag();
                                  }
                                }}
                              />
                              <Button type="button" variant="outline" onClick={addTag}>
                                <Tag className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="icon">Ícone</Label>
                            <div className="flex items-center gap-4">
                              {serviceIconPreview ? (
                                <div className="relative h-20 w-20">
                                  <img 
                                    src={serviceIconPreview} 
                                    alt="Preview" 
                                    className="h-20 w-20 object-contain border rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setServiceIcon(null);
                                      setServiceIconPreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <Label 
                                  htmlFor="icon-upload" 
                                  className="flex items-center justify-center h-20 w-20 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50"
                                >
                                  <ImagePlus className="h-8 w-8 text-gray-400" />
                                </Label>
                              )}
                              
                              <div className="text-sm text-gray-500">
                                <p>Formatos aceitos: PNG, JPG, SVG</p>
                                <p>Tamanho máximo: 500KB</p>
                              </div>
                              
                              <input 
                                id="icon-upload" 
                                type="file" 
                                accept=".png,.jpg,.jpeg,.svg" 
                                className="hidden" 
                                onChange={handleFileChange}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter className="sm:justify-between">
                          <DialogClose asChild>
                            <Button type="button" variant="outline">
                              Cancelar
                            </Button>
                          </DialogClose>
                          <Button 
                            type="button" 
                            onClick={handleCreateService}
                          >
                            Salvar Serviço
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-lg font-medium">Erro ao carregar serviços</p>
                    <p className="text-gray-500 mb-4">
                      Ocorreu um erro ao tentar carregar os serviços.
                    </p>
                    <Button onClick={() => refetch()}>Tentar novamente</Button>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    {searchTerm ? (
                      <>
                        <p className="text-lg font-medium">Nenhum serviço encontrado</p>
                        <p className="text-gray-500 mb-4">
                          Não foram encontrados serviços com o termo "{searchTerm}".
                        </p>
                        <Button variant="outline" onClick={() => setSearchTerm('')}>
                          Limpar busca
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium">Nenhum serviço cadastrado</p>
                        <p className="text-gray-500 mb-4">
                          Adicione serviços para que eles apareçam na plataforma.
                        </p>
                        <Button onClick={() => setIsAddingService(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Adicionar Serviço
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredServices.map((service) => (
                      <div 
                        key={service.id} 
                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 items-start flex-1">
                            <div className="w-12 h-12 flex items-center justify-center">
                              {service.icon_url ? (
                                <img 
                                  src={service.icon_url} 
                                  alt={service.name} 
                                  className="max-w-full max-h-full"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-2xl font-bold text-gray-400">
                                    {service.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium">{service.name}</h3>
                              <p className="text-gray-500 text-sm">
                                {service.description || 'Sem descrição'}
                              </p>
                              
                              {service.tags && service.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {service.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Dialog open={isEditingService === service.id} onOpenChange={(open) => {
                              if (!open) setIsEditingService(null);
                              else initEditForm(service);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => initEditForm(service)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Editar Serviço</DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nome do Serviço *</Label>
                                    <Input 
                                      id="edit-name" 
                                      value={serviceName} 
                                      onChange={(e) => setServiceName(e.target.value)} 
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descrição</Label>
                                    <Input 
                                      id="edit-description" 
                                      value={serviceDescription} 
                                      onChange={(e) => setServiceDescription(e.target.value)} 
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {serviceTags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                          {tag}
                                          <button 
                                            onClick={() => removeTag(tag)}
                                            className="text-gray-500 hover:text-gray-700"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Input 
                                        value={currentTag} 
                                        onChange={(e) => setCurrentTag(e.target.value)} 
                                        placeholder="Ex: Reforma, Construção" 
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                          }
                                        }}
                                      />
                                      <Button type="button" variant="outline" onClick={addTag}>
                                        <Tag className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-icon">Ícone</Label>
                                    <div className="flex items-center gap-4">
                                      {serviceIconPreview ? (
                                        <div className="relative h-20 w-20">
                                          <img 
                                            src={serviceIconPreview} 
                                            alt="Preview" 
                                            className="h-20 w-20 object-contain border rounded"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setServiceIcon(null);
                                              setServiceIconPreview(null);
                                            }}
                                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <Label 
                                          htmlFor="edit-icon-upload" 
                                          className="flex items-center justify-center h-20 w-20 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50"
                                        >
                                          <ImagePlus className="h-8 w-8 text-gray-400" />
                                        </Label>
                                      )}
                                      
                                      <div className="text-sm text-gray-500">
                                        <p>Formatos aceitos: PNG, JPG, SVG</p>
                                        <p>Tamanho máximo: 500KB</p>
                                      </div>
                                      
                                      <input 
                                        id="edit-icon-upload" 
                                        type="file" 
                                        accept=".png,.jpg,.jpeg,.svg" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <DialogFooter className="sm:justify-between">
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                      Cancelar
                                    </Button>
                                  </DialogClose>
                                  <Button 
                                    type="button" 
                                    onClick={handleUpdateService}
                                  >
                                    Atualizar Serviço
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteService(service.id, service.icon_url)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
