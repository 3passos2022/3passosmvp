
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
import { toast } from 'sonner';

const settingsSchema = z.object({
  bio: z.string().max(500, 'A bio deve ter no máximo 500 caracteres'),
  serviceRadiusKm: z.number().min(0, 'O raio de serviço não pode ser negativo').max(500, 'O raio máximo é de 500km'),
});

const ProviderSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<{
    id?: string;
    bio?: string;
    serviceRadiusKm?: number;
  }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      bio: '',
      serviceRadiusKm: 0,
    },
  });

  // Watch the service radius value to update the slider
  const serviceRadiusKm = watch('serviceRadiusKm');

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

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const settingsData = {
        provider_id: user.id,
        bio: data.bio,
        service_radius_km: data.serviceRadiusKm,
      };
      
      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from('provider_settings')
          .update(settingsData)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('provider_settings')
          .insert(settingsData);
        
        if (error) throw error;
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
            
            <div className="space-y-4">
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
            
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSettings;
