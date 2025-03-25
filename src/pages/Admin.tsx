
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
import { Plus, Trash2 } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';

// Define simple types for admin components to avoid deep nesting
interface ServiceBasic {
  id: string;
  name: string;
}

interface SubServiceBasic {
  id: string;
  name: string;
}

interface SpecialtyBasic {
  id: string;
  name: string;
}

interface QuestionBasic {
  id: string;
  question: string;
}

interface QuestionOptionBasic {
  id: string;
  option_text: string;
}

interface ServiceItemBasic {
  id: string;
  name: string;
  type: 'quantity' | 'square_meter' | 'linear_meter';
}

// Admin Services Component
const AdminServices: React.FC = () => {
  const [services, setServices] = useState<ServiceBasic[]>([]);
  const [subServices, setSubServices] = useState<SubServiceBasic[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyBasic[]>([]);
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
        .select('id, name')
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
                      <h4 className="font-medium">{service.name}</h4>
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
