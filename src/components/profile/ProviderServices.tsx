
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Specialty, Service, SubService } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, PenLine } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getAllServices } from '@/lib/api/services';

// Basic type definitions to avoid deep types
interface SpecialtyItem {
  id: string;
  name: string;
  subServiceId: string;
  price?: number;
}

interface ProviderServiceItem {
  id: string;
  specialtyId: string;
  specialtyName: string;
  serviceName: string;
  subServiceName: string;
  basePrice: number;
}

const ProviderServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingService, setAddingService] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubService, setSelectedSubService] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [providerServices, setProviderServices] = useState<ProviderServiceItem[]>([]);
  
  // Load all available services
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const servicesData = await getAllServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Error loading services:', error);
        toast.error('Erro ao carregar serviços disponíveis');
      } finally {
        setLoading(false);
      }
    };
    
    loadServices();
  }, []);
  
  // Load provider's services
  useEffect(() => {
    const loadProviderServices = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('provider_services')
          .select('*')
          .eq('provider_id', user.id);
        
        if (error) throw error;
        
        // Enrich with specialty details
        const providerServicesWithDetails: ProviderServiceItem[] = [];
        
        for (const providerService of data) {
          // Find the specialty in our services data
          let serviceName = '';
          let subServiceName = '';
          let specialtyName = '';
          
          for (const service of services) {
            for (const subService of service.subServices) {
              const specialty = subService.specialties.find(
                spec => spec.id === providerService.specialty_id
              );
              
              if (specialty) {
                serviceName = service.name;
                subServiceName = subService.name;
                specialtyName = specialty.name;
                break;
              }
            }
            
            if (serviceName) break;
          }
          
          // If we couldn't find in our data, fetch directly
          if (!specialtyName) {
            const { data: specialtyData } = await supabase
              .from('specialties')
              .select('name')
              .eq('id', providerService.specialty_id)
              .single();
            
            if (specialtyData) {
              specialtyName = specialtyData.name;
            }
          }
          
          providerServicesWithDetails.push({
            id: providerService.id,
            specialtyId: providerService.specialty_id,
            specialtyName,
            serviceName,
            subServiceName,
            basePrice: providerService.base_price,
          });
        }
        
        setProviderServices(providerServicesWithDetails);
      } catch (error) {
        console.error('Error loading provider services:', error);
        toast.error('Erro ao carregar seus serviços');
      }
    };
    
    if (services.length > 0) {
      loadProviderServices();
    }
  }, [user, services]);
  
  const handleAddService = async () => {
    if (!user || !selectedSpecialty || !basePrice) return;
    
    setAddingService(true);
    try {
      // Check if already exists
      const { data: existingService, error: checkError } = await supabase
        .from('provider_services')
        .select('id')
        .eq('provider_id', user.id)
        .eq('specialty_id', selectedSpecialty)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingService) {
        toast.error('Você já oferece este serviço');
        return;
      }
      
      // Insert new service
      const { data, error } = await supabase
        .from('provider_services')
        .insert({
          provider_id: user.id,
          specialty_id: selectedSpecialty,
          base_price: parseFloat(basePrice),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Serviço adicionado com sucesso');
      
      // Reset form and reload services
      setSelectedService('');
      setSelectedSubService('');
      setSelectedSpecialty('');
      setBasePrice('');
      
      // Add to the list without reloading
      let serviceName = '';
      let subServiceName = '';
      let specialtyName = '';
      
      for (const service of services) {
        for (const subService of service.subServices) {
          const specialty = subService.specialties.find(
            spec => spec.id === selectedSpecialty
          );
          
          if (specialty) {
            serviceName = service.name;
            subServiceName = subService.name;
            specialtyName = specialty.name;
            break;
          }
        }
        
        if (serviceName) break;
      }
      
      setProviderServices([
        ...providerServices,
        {
          id: data.id,
          specialtyId: selectedSpecialty,
          specialtyName,
          serviceName,
          subServiceName,
          basePrice: parseFloat(basePrice),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding provider service:', error);
      toast.error(error.message || 'Erro ao adicionar serviço');
    } finally {
      setAddingService(false);
    }
  };
  
  const updatePrice = async (serviceId: string, newPrice: number) => {
    if (!user) return;
    
    setSavingPrice(true);
    try {
      const { error } = await supabase
        .from('provider_services')
        .update({ base_price: newPrice })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      // Update in the state
      setProviderServices(
        providerServices.map(service => 
          service.id === serviceId 
            ? { ...service, basePrice: newPrice }
            : service
        )
      );
      
      toast.success('Preço atualizado com sucesso');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Erro ao atualizar preço');
    } finally {
      setSavingPrice(false);
    }
  };
  
  const deleteService = async (serviceId: string) => {
    if (!user || !confirm('Tem certeza que deseja remover este serviço?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
      
      setProviderServices(
        providerServices.filter(service => service.id !== serviceId)
      );
      
      toast.success('Serviço removido com sucesso');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao remover serviço');
    }
  };
  
  // Get sub-services for the selected service
  const filteredSubServices = selectedService
    ? services.find(s => s.id === selectedService)?.subServices || []
    : [];
  
  // Get specialties for the selected sub-service
  const filteredSpecialties = selectedSubService
    ? filteredSubServices.find(s => s.id === selectedSubService)?.specialties || []
    : [];
  
  if (loading) {
    return (
      <div className="text-center p-8">
        <p>Carregando serviços...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Serviços que você presta</CardTitle>
        </CardHeader>
        <CardContent>
          {providerServices.length === 0 ? (
            <div className="text-center p-4 border border-dashed rounded-md">
              <p className="text-gray-500">Você ainda não oferece nenhum serviço</p>
            </div>
          ) : (
            <div className="space-y-4">
              {providerServices.map((service) => (
                <div 
                  key={service.id}
                  className="p-4 border rounded-md flex flex-col md:flex-row justify-between gap-4"
                >
                  <div>
                    <h3 className="font-medium">{service.specialtyName}</h3>
                    <p className="text-sm text-gray-500">
                      {service.serviceName} &gt; {service.subServiceName}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span>R$ {service.basePrice.toFixed(2)}</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <PenLine className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar preço</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Serviço</Label>
                              <p>{service.specialtyName}</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`price-${service.id}`}>Preço (R$)</Label>
                              <Input 
                                id={`price-${service.id}`}
                                type="number" 
                                step="0.01"
                                min="0"
                                defaultValue={service.basePrice.toString()}
                                onChange={(e) => {
                                  // Handle price update
                                  const newPrice = parseFloat(e.target.value);
                                  if (!isNaN(newPrice) && newPrice >= 0) {
                                    updatePrice(service.id, newPrice);
                                  }
                                }}
                              />
                            </div>
                            <Button 
                              className="w-full"
                              disabled={savingPrice}
                              onClick={() => {
                                const input = document.getElementById(`price-${service.id}`) as HTMLInputElement;
                                const newPrice = parseFloat(input.value);
                                if (!isNaN(newPrice) && newPrice >= 0) {
                                  updatePrice(service.id, newPrice);
                                }
                              }}
                            >
                              {savingPrice ? 'Salvando...' : 'Salvar preço'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => deleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Separator className="my-6" />
          
          <div className="space-y-6">
            <h3 className="font-medium">Adicionar novo serviço</h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedService && (
                <div className="space-y-2">
                  <Label htmlFor="sub-service">Tipo de serviço</Label>
                  <Select 
                    value={selectedSubService} 
                    onValueChange={setSelectedSubService}
                    disabled={filteredSubServices.length === 0}
                  >
                    <SelectTrigger id="sub-service">
                      <SelectValue placeholder={
                        filteredSubServices.length === 0 
                          ? "Nenhum tipo de serviço disponível" 
                          : "Selecione um tipo de serviço"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubServices.map((subService) => (
                        <SelectItem key={subService.id} value={subService.id}>
                          {subService.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedSubService && (
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Select 
                    value={selectedSpecialty} 
                    onValueChange={setSelectedSpecialty}
                    disabled={filteredSpecialties.length === 0}
                  >
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder={
                        filteredSpecialties.length === 0 
                          ? "Nenhuma especialidade disponível" 
                          : "Selecione uma especialidade"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSpecialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedSpecialty && (
                <div className="space-y-2">
                  <Label htmlFor="price">Preço base (R$)</Label>
                  <Input 
                    id="price" 
                    type="number"
                    step="0.01"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="Ex: 100.00"
                  />
                </div>
              )}
              
              <Button 
                onClick={handleAddService}
                disabled={
                  addingService || 
                  !selectedService || 
                  !selectedSubService || 
                  !selectedSpecialty || 
                  !basePrice ||
                  parseFloat(basePrice) <= 0
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                {addingService ? 'Adicionando...' : 'Adicionar serviço'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderServices;
