
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
import { UserRole } from '@/lib/types';
import { getAllServices, clearServicesCache } from '@/lib/api/services';
import { Plus, Trash2, X, Image as ImageIcon, Tag } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import { Textarea } from '@/components/ui/textarea';

// Define simple types for admin components to avoid deep nesting
interface ServiceBasic {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  tags?: string[];
}

interface SubServiceBasic {
  id: string;
  name: string;
}

interface SpecialtyBasic {
  id: string;
  name: string;
}

// Admin Services Component
const AdminServices: React.FC = () => {
  const [services, setServices] = useState<ServiceBasic[]>([]);
  const [subServices, setSubServices] = useState<SubServiceBasic[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceTags, setNewServiceTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [newSubService, setNewSubService] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubService, setSelectedSubService] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  
  useEffect(() => {
    loadServices();
  }, []);
  
  useEffect(() => {
    if (selectedService) {
      loadSubServices(selectedService);
      setSelectedSubService('');
      setSpecialties([]);
    } else {
      setSubServices([]);
      setSpecialties([]);
    }
  }, [selectedService]);
  
  useEffect(() => {
    if (selectedSubService) {
      loadSpecialties(selectedSubService);
    } else {
      setSpecialties([]);
    }
  }, [selectedSubService]);
  
  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, icon_url, tags')
        .order('name');
      
      if (error) throw error;
      
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };
  
  const loadSubServices = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('sub_services')
        .select('id, name')
        .eq('service_id', serviceId)
        .order('name');
      
      if (error) throw error;
      
      setSubServices(data || []);
    } catch (error) {
      console.error('Error loading sub-services:', error);
      toast.error('Erro ao carregar tipos de serviço');
    }
  };
  
  const loadSpecialties = async (subServiceId: string) => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('id, name')
        .eq('sub_service_id', subServiceId)
        .order('name');
      
      if (error) throw error;
      
      setSpecialties(data || []);
    } catch (error) {
      console.error('Error loading specialties:', error);
      toast.error('Erro ao carregar especialidades');
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (500KB = 512000 bytes)
      if (file.size > 512000) {
        toast.error('O arquivo deve ter no máximo 500KB');
        return;
      }
      
      // Check file type
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
        toast.error('Apenas arquivos PNG, JPG e SVG são permitidos');
        return;
      }
      
      setIconFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !newServiceTags.includes(newTagInput.trim())) {
      setNewServiceTags([...newServiceTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewServiceTags(newServiceTags.filter(t => t !== tag));
  };
  
  const uploadIcon = async (): Promise<string | null> => {
    if (!iconFile) return null;
    
    try {
      // Create a unique filename with timestamp and original extension
      const fileExt = iconFile.name.split('.').pop();
      const fileName = `service-icons/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('service-assets')
        .upload(fileName, iconFile, {
          contentType: iconFile.type,
          upsert: true,
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-assets')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading icon:', error);
      throw error;
    }
  };

  const handleAddService = async () => {
    if (!newService.trim()) return;
    
    setSaving(true);
    try {
      // Upload icon if one is selected
      let iconUrl = null;
      if (iconFile) {
        iconUrl = await uploadIcon();
      }
      
      const { data, error } = await supabase
        .from('services')
        .insert({ 
          name: newService.trim(),
          description: newServiceDesc.trim() || null,
          icon_url: iconUrl,
          tags: newServiceTags.length > 0 ? newServiceTags : null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Serviço adicionado com sucesso');
      setNewService('');
      setNewServiceDesc('');
      setNewServiceTags([]);
      setIconFile(null);
      setIconPreview(null);
      clearServicesCache(); // Clear cache to force refresh
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
      clearServicesCache(); // Clear cache to force refresh
      await loadSubServices(selectedService);
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
      clearServicesCache(); // Clear cache to force refresh
      await loadSpecialties(selectedSubService);
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
      clearServicesCache(); // Clear cache to force refresh
      await loadServices();
      if (selectedService === id) {
        setSelectedService('');
      }
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
      clearServicesCache(); // Clear cache to force refresh
      if (selectedService) {
        await loadSubServices(selectedService);
      }
      if (selectedSubService === id) {
        setSelectedSubService('');
      }
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
      clearServicesCache(); // Clear cache to force refresh
      if (selectedSubService) {
        await loadSpecialties(selectedSubService);
      }
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-service">Nome do Serviço</Label>
                  <Input 
                    id="new-service" 
                    value={newService} 
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Ex: Eletricista"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-service-desc">Descrição</Label>
                  <Textarea 
                    id="new-service-desc" 
                    value={newServiceDesc} 
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    placeholder="Breve descrição do serviço"
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-icon">Ícone do Serviço (PNG, JPG, SVG até 500KB)</Label>
                  <div className="mt-1 flex items-start gap-4">
                    <div className="flex-1">
                      <Input 
                        id="service-icon" 
                        type="file" 
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={handleIconChange}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos permitidos: PNG, JPG, SVG. Tamanho máximo: 500KB
                      </p>
                    </div>
                    
                    {iconPreview && (
                      <div className="w-16 h-16 border rounded-md flex items-center justify-center overflow-hidden relative">
                        <img src={iconPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                        <button 
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                          onClick={() => {
                            setIconFile(null);
                            setIconPreview(null);
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="new-service-tags">Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      id="new-service-tags" 
                      value={newTagInput} 
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Adicione tags para o serviço"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button onClick={handleAddTag} type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {newServiceTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newServiceTags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          {tag}
                          <button 
                            className="ml-1 text-primary hover:text-primary-dark"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleAddService} 
                  disabled={saving || !newService.trim()} 
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Serviço
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
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {service.icon_url ? (
                            <img 
                              src={service.icon_url} 
                              alt={service.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-500">{service.description}</p>
                          )}
                          {service.tags && service.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {service.tags.map((tag, idx) => (
                                  <span key={idx} className="text-xs text-gray-500">{tag}{idx < service.tags!.length - 1 ? ',' : ''}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    {service.id === selectedService && subServices.length > 0 && (
                      <div className="pl-4 space-y-4">
                        {subServices.map((subService) => (
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
                            
                            {subService.id === selectedSubService && specialties.length > 0 && (
                              <div className="pl-4 space-y-2">
                                {specialties.map((specialty) => (
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
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                <TabsTrigger value="users">Usuários</TabsTrigger>
              </TabsList>
              
              <TabsContent value="services">
                <AdminServices />
              </TabsContent>
              
              <TabsContent value="users">
                <UserManagement />
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
