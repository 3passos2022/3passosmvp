
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Service, SubService, Specialty, ServiceItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getAllServices, getServiceItems } from '@/lib/api/services';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Save, CheckCircle } from 'lucide-react';

const ProviderServices: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [providerServices, setProviderServices] = useState<{[key: string]: number}>({});
  const [providerItems, setProviderItems] = useState<{[key: string]: number}>({});
  const [activeTab, setActiveTab] = useState<string>('services');
  const [expandedServices, setExpandedServices] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      setLoading(true);
      try {
        // Load all services
        const servicesData = await getAllServices();
        setServices(servicesData);
        
        // Load provider services
        const { data: providerServicesData, error: providerError } = await supabase
          .from('provider_services')
          .select('*')
          .eq('provider_id', user.id);
        
        if (providerError) throw providerError;
        
        // Create a map of specialty ID to price
        const servicesMap: {[key: string]: number} = {};
        providerServicesData?.forEach(item => {
          servicesMap[item.specialty_id] = item.base_price;
        });
        setProviderServices(servicesMap);
        
        // Load provider item prices
        const { data: providerItemsData, error: itemsError } = await supabase
          .from('provider_item_prices')
          .select('*')
          .eq('provider_id', user.id);
        
        if (itemsError) throw itemsError;
        
        // Create a map of item ID to price
        const itemsMap: {[key: string]: number} = {};
        providerItemsData?.forEach(item => {
          itemsMap[item.item_id] = item.price_per_unit;
        });
        setProviderItems(itemsMap);
      } catch (error) {
        console.error('Error loading provider services:', error);
        toast.error('Erro ao carregar serviços');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user]);

  const toggleServiceExpanded = (serviceId: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const handleServicePriceChange = (specialtyId: string, price: number) => {
    setProviderServices(prev => ({
      ...prev,
      [specialtyId]: price
    }));
  };

  const handleItemPriceChange = (itemId: string, price: number) => {
    setProviderItems(prev => ({
      ...prev,
      [itemId]: price
    }));
  };

  const saveServices = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save provider services
      const servicesToSave = Object.entries(providerServices)
        .filter(([_, price]) => price > 0)
        .map(([specialtyId, price]) => ({
          provider_id: user.id,
          specialty_id: specialtyId,
          base_price: price
        }));
      
      // First, remove existing services
      const { error: deleteError } = await supabase
        .from('provider_services')
        .delete()
        .eq('provider_id', user.id);
      
      if (deleteError) throw deleteError;
      
      // Then insert new services
      if (servicesToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('provider_services')
          .insert(servicesToSave);
        
        if (insertError) throw insertError;
      }
      
      toast.success('Serviços salvos com sucesso');
    } catch (error) {
      console.error('Error saving provider services:', error);
      toast.error('Erro ao salvar serviços');
    } finally {
      setSaving(false);
    }
  };

  const saveItems = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save provider item prices
      const itemsToSave = Object.entries(providerItems)
        .filter(([_, price]) => price > 0)
        .map(([itemId, price]) => ({
          provider_id: user.id,
          item_id: itemId,
          price_per_unit: price
        }));
      
      // First, remove existing item prices
      const { error: deleteError } = await supabase
        .from('provider_item_prices')
        .delete()
        .eq('provider_id', user.id);
      
      if (deleteError) throw deleteError;
      
      // Then insert new item prices
      if (itemsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('provider_item_prices')
          .insert(itemsToSave);
        
        if (insertError) throw insertError;
      }
      
      toast.success('Preços de itens salvos com sucesso');
    } catch (error) {
      console.error('Error saving provider item prices:', error);
      toast.error('Erro ao salvar preços de itens');
    } finally {
      setSaving(false);
    }
  };

  const renderServiceItems = async (serviceId?: string, subServiceId?: string, specialtyId?: string) => {
    if (!user) return [];
    
    try {
      const items = await getServiceItems(serviceId, subServiceId, specialtyId);
      return items;
    } catch (error) {
      console.error('Error fetching service items:', error);
      return [];
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando serviços...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meus Serviços e Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="items">Itens e Materiais</TabsTrigger>
            </TabsList>
            
            <TabsContent value="services" className="space-y-6">
              <p className="text-sm text-gray-500 mb-4">
                Configure os preços base para os serviços que você oferece. 
                Você pode definir preços para qualquer especialidade disponível.
              </p>
              
              {services.map(service => (
                <div key={service.id} className="space-y-4">
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => toggleServiceExpanded(service.id)}
                  >
                    <h3 className="text-lg font-medium">{service.name}</h3>
                    <Button variant="ghost" size="sm">
                      {expandedServices[service.id] ? 'Esconder' : 'Expandir'}
                    </Button>
                  </div>
                  
                  {expandedServices[service.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="pl-4 space-y-4"
                    >
                      {service.subServices.map(subService => (
                        <div key={subService.id} className="space-y-3">
                          <h4 className="font-medium text-gray-700">{subService.name}</h4>
                          
                          <div className="space-y-3">
                            {subService.specialties.map(specialty => (
                              <div key={specialty.id} className="flex items-center border p-3 rounded-md">
                                <div className="flex-1">
                                  <p>{specialty.name}</p>
                                </div>
                                <div className="relative w-32">
                                  <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    step="0.01"
                                    className="pl-9"
                                    placeholder="0,00"
                                    value={providerServices[specialty.id] || ''}
                                    onChange={(e) => handleServicePriceChange(
                                      specialty.id, 
                                      parseFloat(e.target.value) || 0
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
              
              <div className="mt-4 flex justify-end">
                <Button onClick={saveServices} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Serviços'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="items" className="space-y-6">
              <p className="text-sm text-gray-500 mb-4">
                Configure os preços unitários para os itens e materiais que você utiliza em seus serviços.
              </p>
              
              {services.map(async service => {
                const serviceItems = await renderServiceItems(service.id);
                
                return (
                  <div key={service.id} className="space-y-4">
                    <h3 className="text-lg font-medium">{service.name}</h3>
                    
                    {serviceItems.length > 0 && (
                      <div className="space-y-3 ml-4">
                        {serviceItems.map(item => (
                          <div key={item.id} className="flex items-center border p-3 rounded-md">
                            <div className="flex-1">
                              <p>{item.name}</p>
                              <p className="text-sm text-gray-500">
                                {item.type === 'quantity' ? 'Preço por unidade' : 
                                 item.type === 'square_meter' ? 'Preço por m²' : 'Preço por m linear'}
                              </p>
                            </div>
                            <div className="relative w-32">
                              <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                className="pl-9"
                                placeholder="0,00"
                                value={providerItems[item.id] || ''}
                                onChange={(e) => handleItemPriceChange(
                                  item.id, 
                                  parseFloat(e.target.value) || 0
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {service.subServices.map(async subService => {
                      const subServiceItems = await renderServiceItems(undefined, subService.id);
                      
                      return (
                        <div key={subService.id} className="space-y-3 ml-4">
                          <h4 className="font-medium text-gray-700">{subService.name}</h4>
                          
                          {subServiceItems.length > 0 && (
                            <div className="space-y-3 ml-4">
                              {subServiceItems.map(item => (
                                <div key={item.id} className="flex items-center border p-3 rounded-md">
                                  <div className="flex-1">
                                    <p>{item.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {item.type === 'quantity' ? 'Preço por unidade' : 
                                       item.type === 'square_meter' ? 'Preço por m²' : 'Preço por m linear'}
                                    </p>
                                  </div>
                                  <div className="relative w-32">
                                    <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      step="0.01"
                                      className="pl-9"
                                      placeholder="0,00"
                                      value={providerItems[item.id] || ''}
                                      onChange={(e) => handleItemPriceChange(
                                        item.id, 
                                        parseFloat(e.target.value) || 0
                                      )}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {subService.specialties.map(async specialty => {
                            const specialtyItems = await renderServiceItems(undefined, undefined, specialty.id);
                            
                            return (
                              <div key={specialty.id} className="space-y-3 ml-4">
                                <h5 className="font-medium text-gray-600">{specialty.name}</h5>
                                
                                {specialtyItems.length > 0 && (
                                  <div className="space-y-3 ml-4">
                                    {specialtyItems.map(item => (
                                      <div key={item.id} className="flex items-center border p-3 rounded-md">
                                        <div className="flex-1">
                                          <p>{item.name}</p>
                                          <p className="text-sm text-gray-500">
                                            {item.type === 'quantity' ? 'Preço por unidade' : 
                                             item.type === 'square_meter' ? 'Preço por m²' : 'Preço por m linear'}
                                          </p>
                                        </div>
                                        <div className="relative w-32">
                                          <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                                          <Input 
                                            type="number" 
                                            min="0" 
                                            step="0.01"
                                            className="pl-9"
                                            placeholder="0,00"
                                            value={providerItems[item.id] || ''}
                                            onChange={(e) => handleItemPriceChange(
                                              item.id, 
                                              parseFloat(e.target.value) || 0
                                            )}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              
              <div className="mt-4 flex justify-end">
                <Button onClick={saveItems} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Preços de Itens'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderServices;
