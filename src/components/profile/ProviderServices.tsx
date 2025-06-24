// Componente atualizado para usar feature flags
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
import { Trash2, Plus, PenLine, Settings, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { getAllServices } from '@/lib/api/services';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils';
import { ProviderServiceItemPrice } from '@/lib/types/providerMatch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const { featureLimits, loading: loadingFeatures } = useFeatureFlags();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingService, setAddingService] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubService, setSelectedSubService] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [providerServices, setProviderServices] = useState<ProviderServiceItem[]>([]);
  const [serviceItems, setServiceItems] = useState<Record<string, ProviderServiceItemPrice[]>>({});
  const [currentServiceId, setCurrentServiceId] = useState<string>('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  
  // Obter o limite de serviços baseado na assinatura
  const servicesLimit = featureLimits?.provider_services_limit?.limit ?? 1;
  const isLimitReached = servicesLimit !== null && providerServices.length >= servicesLimit;
  const isUnlimited = servicesLimit === null;
  
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
        
        // Load service items for each provider service
        for (const service of providerServicesWithDetails) {
          await loadServiceItems(service.specialtyId, service.id);
        }
      } catch (error) {
        console.error('Error loading provider services:', error);
        toast.error('Erro ao carregar seus serviços');
      }
    };
    
    if (services.length > 0) {
      loadProviderServices();
    }
  }, [user, services]);
  
  const loadServiceItems = async (specialtyId: string, providerServiceId: string) => {
    if (!user) return;
    
    try {
      // Get all items related to this service hierarchy
      const { data: specialty } = await supabase
        .from('specialties')
        .select('*, sub_service:sub_services(*, service:services(*))')
        .eq('id', specialtyId)
        .single();
      
      if (!specialty || !specialty.sub_service) {
        return;
      }
      
      // Get all service items for the related service, subservice, and specialty
      const serviceId = specialty.sub_service.service?.id;
      const subServiceId = specialty.sub_service.id;
      
      let allItems: ProviderServiceItemPrice[] = [];
      
      // 1. Items for the service level
      if (serviceId) {
        const { data: serviceItems } = await supabase
          .from('service_items')
          .select('*')
          .eq('service_id', serviceId)
          .is('sub_service_id', null)
          .is('specialty_id', null);
          
        if (serviceItems && serviceItems.length > 0) {
          const serviceItemsWithDetails = serviceItems.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            pricePerUnit: 0,
            level: 'service' as const,
            parentName: specialty.sub_service.service?.name || 'Serviço'
          }));
          
          allItems = [...allItems, ...serviceItemsWithDetails];
        }
      }
      
      // 2. Items for the subservice level
      if (subServiceId) {
        const { data: subServiceItems } = await supabase
          .from('service_items')
          .select('*')
          .eq('sub_service_id', subServiceId)
          .is('specialty_id', null);
          
        if (subServiceItems && subServiceItems.length > 0) {
          const subServiceItemsWithDetails = subServiceItems.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            pricePerUnit: 0,
            level: 'subService' as const,
            parentName: specialty.sub_service.name || 'Subserviço'
          }));
          
          allItems = [...allItems, ...subServiceItemsWithDetails];
        }
      }
      
      // 3. Items for the specialty level
      const { data: specialtyItems } = await supabase
        .from('service_items')
        .select('*')
        .eq('specialty_id', specialtyId);
        
      if (specialtyItems && specialtyItems.length > 0) {
        const specialtyItemsWithDetails = specialtyItems.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          pricePerUnit: 0,
          level: 'specialty' as const,
          parentName: specialty.name || 'Especialidade'
        }));
        
        allItems = [...allItems, ...specialtyItemsWithDetails];
      }
      
      // Now get provider's prices for these items
      if (allItems.length > 0) {
        const { data: providerPrices } = await supabase
          .from('provider_item_prices')
          .select('*')
          .eq('provider_id', user.id)
          .in('item_id', allItems.map(item => item.id));
          
        if (providerPrices && providerPrices.length > 0) {
          allItems = allItems.map(item => {
            const providerPrice = providerPrices.find(price => price.item_id === item.id);
            return {
              ...item,
              pricePerUnit: providerPrice?.price_per_unit || 0,
              providerItemId: providerPrice?.id
            };
          });
        }
      }
      
      // Update the state
      setServiceItems(prev => ({
        ...prev,
        [providerServiceId]: allItems,
      }));
      
    } catch (error) {
      console.error('Error loading service items:', error);
    }
  };
  
  const handleAddService = async () => {
    if (!user || !selectedSpecialty || !basePrice) return;
    
    // Verificar limite de serviços
    if (!isUnlimited && providerServices.length >= servicesLimit) {
      toast.error(`Você atingiu o limite de ${servicesLimit} serviços. Faça upgrade para adicionar mais.`);
      return;
    }
    
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
      
      const newProviderService = {
        id: data.id,
        specialtyId: selectedSpecialty,
        specialtyName,
        serviceName,
        subServiceName,
        basePrice: parseFloat(basePrice),
      };
      
      setProviderServices([
        ...providerServices,
        newProviderService
      ]);
      
      // Load service items for the new service
      await loadServiceItems(selectedSpecialty, data.id);
      
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
      
      // Also delete any item prices associated with this provider's service
      const items = serviceItems[serviceId] || [];
      if (items.length > 0) {
        const itemIds = items.filter(item => item.providerItemId).map(item => item.providerItemId);
        if (itemIds.length > 0) {
          await supabase
            .from('provider_item_prices')
            .delete()
            .in('id', itemIds as string[]);
        }
      }
      
      setProviderServices(
        providerServices.filter(service => service.id !== serviceId)
      );
      
      // Remove from serviceItems state
      const newServiceItems = { ...serviceItems };
      delete newServiceItems[serviceId];
      setServiceItems(newServiceItems);
      
      toast.success('Serviço removido com sucesso');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao remover serviço');
    }
  };
  
  const handleManageItems = (serviceId: string) => {
    setCurrentServiceId(serviceId);
    setIsItemDialogOpen(true);
  };
  
  const updateItemPrice = async (serviceId: string, itemId: string, price: number) => {
    if (!user) return;
    
    try {
      const item = serviceItems[serviceId]?.find(i => i.id === itemId);
      
      if (item?.providerItemId) {
        // Update existing price
        const { error } = await supabase
          .from('provider_item_prices')
          .update({ price_per_unit: price })
          .eq('id', item.providerItemId);
        
        if (error) throw error;
      } else {
        // Create new price entry
        const { data, error } = await supabase
          .from('provider_item_prices')
          .insert({
            provider_id: user.id,
            item_id: itemId,
            price_per_unit: price,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local state with new provider item id
        setServiceItems(prev => ({
          ...prev,
          [serviceId]: prev[serviceId].map(i => 
            i.id === itemId 
              ? { ...i, pricePerUnit: price, providerItemId: data.id }
              : i
          ),
        }));
        
        return;
      }
      
      // Update the local state
      setServiceItems(prev => ({
        ...prev,
        [serviceId]: prev[serviceId].map(i => 
          i.id === itemId 
            ? { ...i, pricePerUnit: price }
            : i
        ),
      }));
      
    } catch (error) {
      console.error('Error updating item price:', error);
      toast.error('Erro ao atualizar preço do item');
    }
  };
  
  // Group service items by their level
  const getGroupedItems = (serviceId: string) => {
    const items = serviceItems[serviceId] || [];
    return {
      service: items.filter(item => item.level === 'service'),
      subService: items.filter(item => item.level === 'subService'),
      specialty: items.filter(item => item.level === 'specialty')
    };
  };
  
  // Get sub-services for the selected service
  const filteredSubServices = selectedService
    ? services.find(s => s.id === selectedService)?.subServices || []
    : [];
  
  // Get specialties for the selected sub-service
  const filteredSpecialties = selectedSubService
    ? filteredSubServices.find(s => s.id === selectedSubService)?.specialties || []
    : [];

  // Função para atualizar o estado local ao digitar
  const handleLocalPriceChange = (itemId: string, value: string) => {
    const price = parseCurrencyInput(value);
    setEditedPrices(prev => ({ ...prev, [itemId]: price }));
  };

  // Função para salvar todos os preços editados
  const handleSaveAllPrices = async () => {
    if (!currentServiceId) return;
    setSavingPrice(true);
    try {
      const items = serviceItems[currentServiceId] || [];
      for (const item of items) {
        if (editedPrices[item.id] !== undefined && !isNaN(editedPrices[item.id])) {
          await updateItemPrice(currentServiceId, item.id, editedPrices[item.id]);
        }
      }
      toast.success('Preços salvos com sucesso!');
      setEditedPrices({});
      setIsItemDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar preços.');
    } finally {
      setSavingPrice(false);
    }
  };

  if (loading || loadingFeatures) {
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <CardTitle>Serviços que você presta</CardTitle>
            {!isUnlimited && (
              <div className="text-sm text-muted-foreground">
                {providerServices.length} / {servicesLimit} serviços
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLimitReached && !isUnlimited && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertTitle>Limite de serviços atingido</AlertTitle>
              <AlertDescription>
                Você atingiu o limite de {servicesLimit} serviços no seu plano atual.{' '}
                <Link to="/subscription" className="font-medium underline text-amber-600">
                  Faça upgrade para adicionar mais serviços
                </Link>.
              </AlertDescription>
            </Alert>
          )}
          
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
                      <span>Preço base: {formatCurrency(service.basePrice)}</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <PenLine className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar preço base</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Serviço</Label>
                              <p>{service.specialtyName}</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`price-${service.id}`}>Preço base (R$)</Label>
                              <Input 
                                id={`price-${service.id}`}
                                type="text"
                                defaultValue={service.basePrice.toString()}
                              />
                            </div>
                            <Button 
                              className="w-full"
                              disabled={savingPrice}
                              onClick={() => {
                                const input = document.getElementById(`price-${service.id}`) as HTMLInputElement;
                                const newPrice = parseCurrencyInput(input.value);
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
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleManageItems(service.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Itens
                    </Button>
                    
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
          
          <Dialog
            open={isItemDialogOpen}
            onOpenChange={setIsItemDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Configurar preços dos itens
                </DialogTitle>
              </DialogHeader>
              
              {currentServiceId && serviceItems[currentServiceId]?.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                  <Accordion type="multiple" className="w-full" defaultValue={["service", "subService", "specialty"]}>
                    {/* Service Level Items */}
                    {getGroupedItems(currentServiceId).service.length > 0 && (
                      <AccordionItem value="service">
                        <AccordionTrigger>
                          Itens do serviço principal ({getGroupedItems(currentServiceId).service.length || 0})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 mb-2 pb-2">
                            <p className="text-sm text-muted-foreground">
                              {providerServices.find(s => s.id === currentServiceId)?.serviceName}
                            </p>
                          </div>
                          <div className="space-y-4">
                            {getGroupedItems(currentServiceId).service.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Tipo: {item.type === 'quantity' ? 'Quantidade' :
                                           item.type === 'square_meter' ? 'Metro quadrado' :
                                           item.type === 'linear_meter' ? 'Metro linear' :
                                           item.type === 'max_square_meter' ? 'Medida máxima (m²)' :
                                           item.type === 'max_linear_meter' ? 'Medida máxima (m)' :
                                           item.type}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-32">
                                    <Input 
                                      type="text"
                                      value={editedPrices[item.id] !== undefined ? editedPrices[item.id] : item.pricePerUnit}
                                      onChange={(e) => handleLocalPriceChange(item.id, e.target.value)}
                                      placeholder="R$ 0,00"
                                    />
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    por {item.type === 'quantity' ? 'unidade' :
                                         item.type === 'square_meter' ? 'm²' :
                                         item.type === 'linear_meter' ? 'm' :
                                         item.type === 'max_square_meter' ? 'até m²' :
                                         item.type === 'max_linear_meter' ? 'até m' :
                                         ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {/* SubService Level Items */}
                    {getGroupedItems(currentServiceId).subService.length > 0 && (
                      <AccordionItem value="subService">
                        <AccordionTrigger>
                          Itens do sub-serviço ({getGroupedItems(currentServiceId).subService.length || 0})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 mb-2 pb-2">
                            <p className="text-sm text-muted-foreground">
                              {providerServices.find(s => s.id === currentServiceId)?.subServiceName}
                            </p>
                          </div>
                          <div className="space-y-4">
                            {getGroupedItems(currentServiceId).subService.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Tipo: {item.type === 'quantity' ? 'Quantidade' :
                                           item.type === 'square_meter' ? 'Metro quadrado' :
                                           item.type === 'linear_meter' ? 'Metro linear' :
                                           item.type === 'max_square_meter' ? 'Medida máxima (m²)' :
                                           item.type === 'max_linear_meter' ? 'Medida máxima (m)' :
                                           item.type}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-32">
                                    <Input 
                                      type="text"
                                      value={editedPrices[item.id] !== undefined ? editedPrices[item.id] : item.pricePerUnit}
                                      onChange={(e) => handleLocalPriceChange(item.id, e.target.value)}
                                      placeholder="R$ 0,00"
                                    />
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    por {item.type === 'quantity' ? 'unidade' :
                                         item.type === 'square_meter' ? 'm²' :
                                         item.type === 'linear_meter' ? 'm' :
                                         item.type === 'max_square_meter' ? 'até m²' :
                                         item.type === 'max_linear_meter' ? 'até m' :
                                         ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {/* Specialty Level Items */}
                    {getGroupedItems(currentServiceId).specialty.length > 0 && (
                      <AccordionItem value="specialty">
                        <AccordionTrigger>
                          Itens da especialidade ({getGroupedItems(currentServiceId).specialty.length || 0})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 mb-2 pb-2">
                            <p className="text-sm text-muted-foreground">
                              {providerServices.find(s => s.id === currentServiceId)?.specialtyName}
                            </p>
                          </div>
                          <div className="space-y-4">
                            {getGroupedItems(currentServiceId).specialty.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Tipo: {item.type === 'quantity' ? 'Quantidade' :
                                           item.type === 'square_meter' ? 'Metro quadrado' :
                                           item.type === 'linear_meter' ? 'Metro linear' :
                                           item.type === 'max_square_meter' ? 'Medida máxima (m²)' :
                                           item.type === 'max_linear_meter' ? 'Medida máxima (m)' :
                                           item.type}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-32">
                                    <Input 
                                      type="text"
                                      value={editedPrices[item.id] !== undefined ? editedPrices[item.id] : item.pricePerUnit}
                                      onChange={(e) => handleLocalPriceChange(item.id, e.target.value)}
                                      placeholder="R$ 0,00"
                                    />
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    por {item.type === 'quantity' ? 'unidade' :
                                         item.type === 'square_meter' ? 'm²' :
                                         item.type === 'linear_meter' ? 'm' :
                                         item.type === 'max_square_meter' ? 'até m²' :
                                         item.type === 'max_linear_meter' ? 'até m' :
                                         ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              ) : (
                <div className="text-center p-4">
                  <p>Este serviço não possui itens configuráveis.</p>
                </div>
              )}
              
              <DialogFooter>
                <Button onClick={handleSaveAllPrices} disabled={savingPrice}>
                  {savingPrice ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => setIsItemDialogOpen(false)} disabled={savingPrice}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Separator className="my-6" />
          
          {(!isLimitReached || isUnlimited) ? (
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
                      type="text"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="Ex: 100,00"
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
                    parseFloat(basePrice.replace(',', '.')) <= 0
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {addingService ? 'Adicionando...' : 'Adicionar serviço'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <Button 
                onClick={() => window.location.href = '/subscription'} 
                className="w-full"
              >
                <Lock className="mr-2 h-4 w-4" />
                Fazer upgrade para adicionar mais serviços
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderServices;
