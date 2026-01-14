
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { geocodeAddress } from '@/lib/services/googleMapsService';
import { fetchAddressByCep } from '@/lib/services/viaCepService';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const settingsSchema = z.object({
  bio: z.string().max(500, 'A bio deve ter no máximo 500 caracteres'),
  serviceRadiusKm: z.number().min(0, 'O raio de serviço não pode ser negativo').max(500, 'O raio máximo é de 500km'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  zipCode: z.string().min(1, 'CEP é obrigatório')
});

const ProviderSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [settings, setSettings] = useState<{
    id?: string;
    bio?: string;
    serviceRadiusKm?: number;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  }>({});

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      bio: '',
      serviceRadiusKm: 0,
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  // Watch the service radius value to update the slider
  const serviceRadiusKm = watch('serviceRadiusKm');
  const zipCode = watch('zipCode');

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('provider_settings')
          .select('*')
          .eq('provider_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings(data);
          setValue('bio', data.bio || '');
          setValue('serviceRadiusKm', data.service_radius_km || 0);
          setValue('street', data.street || '');
          setValue('number', data.number || '');
          setValue('complement', data.complement || '');
          setValue('neighborhood', data.neighborhood || '');
          setValue('city', data.city || '');
          setValue('state', data.state || '');
          setValue('zipCode', data.zip_code || '');
        }
      } catch (error) {
        console.error('Error loading provider settings:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user, setValue]);

  const handleGeocodeAddress = async (formData: z.infer<typeof settingsSchema>) => {
    try {
      setGeocoding(true);
      const fullAddress = `${formData.street}, ${formData.number}, ${formData.neighborhood}, ${formData.city}, ${formData.state}, ${formData.zipCode}`;
      console.log('Tentando geocodificar endereço:', fullAddress);

      const location = await geocodeAddress(fullAddress);

      if (!location) {
        toast.error('Não foi possível geocodificar o endereço. O endereço será salvo sem coordenadas.');
        // Retornar objeto vazio para continuar o salvamento sem as coordenadas
        return { latitude: null, longitude: null };
      }

      console.log('Coordenadas obtidas:', location);
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      toast.error('Não foi possível obter as coordenadas do endereço. O endereço será salvo sem coordenadas.');
      // Retornar objeto vazio para continuar o salvamento sem as coordenadas
      return { latitude: null, longitude: null };
    } finally {
      setGeocoding(false);
    }
  };

  const handleSearchCep = async () => {
    if (!zipCode || zipCode.length < 8) {
      toast.error('Digite um CEP válido');
      return;
    }

    try {
      setSearchingCep(true);
      const address = await fetchAddressByCep(zipCode);

      if (address) {
        setValue('street', address.logradouro || '');
        setValue('neighborhood', address.bairro || '');
        setValue('city', address.localidade || '');
        setValue('state', address.uf || '');

        if (address.complemento) {
          setValue('complement', address.complemento);
        }

        // Manter o foco no campo número após preencher o endereço
        document.getElementById('number')?.focus();

        toast.success('Endereço encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar endereço');
    } finally {
      setSearchingCep(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;

    setSaving(true);
    try {
      // Geocodificar o endereço para obter latitude e longitude
      const coordinates = await handleGeocodeAddress(data);

      const settingsData = {
        provider_id: user.id,
        bio: data.bio,
        service_radius_km: data.serviceRadiusKm,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      };

      let resultData;

      if (settings.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('provider_settings')
          .update(settingsData)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('provider_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
      }

      // Atualizar o estado local com os dados salvos (incluindo o ID gerado)
      if (resultData) {
        setSettings(resultData);
      }

      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error saving provider settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Prestador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Descreva sua experiência profissional, especialidades e diferenciais..."
                className="h-32"
                {...register('bio')}
              />
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Esta informação será exibida para os clientes que solicitarem orçamentos.
              </p>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h3 className="text-md font-medium">Raio de Atendimento</h3>
              <Label>Raio de Atendimento: {serviceRadiusKm} km</Label>
              <Slider
                min={0}
                max={500}
                step={5}
                value={[serviceRadiusKm]}
                onValueChange={(value) => setValue('serviceRadiusKm', value[0])}
              />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>0 km</span>
                <span>250 km</span>
                <span>500 km</span>
              </div>

              <p className="text-xs text-gray-500">
                {serviceRadiusKm === 0
                  ? 'Nenhum limite de distância definido (todo o Brasil)'
                  : `Você receberá orçamentos de clientes em um raio de ${serviceRadiusKm} km`}
              </p>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-md font-medium mb-4">Endereço</h3>
              <p className="text-xs text-gray-500 mb-4">
                Seu endereço será utilizado para calcular a distância até os clientes, mas não será exibido publicamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="zipCode"
                      placeholder="CEP"
                      {...register('zipCode')}
                    />
                    <Button
                      type="button"
                      onClick={handleSearchCep}
                      disabled={searchingCep}
                      className="whitespace-nowrap"
                    >
                      {searchingCep ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Buscando...
                        </>
                      ) : 'Buscar CEP'}
                    </Button>
                  </div>
                  {errors.zipCode && (
                    <p className="text-sm text-red-500">{errors.zipCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    placeholder="Rua/Avenida"
                    {...register('street')}
                  />
                  {errors.street && (
                    <p className="text-sm text-red-500">{errors.street.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    placeholder="Número"
                    {...register('number')}
                  />
                  {errors.number && (
                    <p className="text-sm text-red-500">{errors.number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Complemento (opcional)"
                    {...register('complement')}
                  />
                  {errors.complement && (
                    <p className="text-sm text-red-500">{errors.complement.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Bairro"
                    {...register('neighborhood')}
                  />
                  {errors.neighborhood && (
                    <p className="text-sm text-red-500">{errors.neighborhood.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    {...register('city')}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="Estado"
                    {...register('state')}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving || geocoding}
              className="w-full md:w-auto"
            >
              {saving || geocoding ? (
                <>
                  <span className="mr-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  {geocoding ? 'Obtendo coordenadas...' : 'Salvando...'}
                </>
              ) : 'Salvar Configurações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSettings;
