
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchAddressByCep } from '@/lib/services/viaCepService';
import { geocodeAddress } from '@/lib/services/googleMapsService';
import { toast } from 'sonner';

// Define the structure for address form data
interface AddressFormData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

// Define props for the component
interface AddressStepProps {
  onNext: () => void;
  onBack: () => void;
  formData: any;
  updateFormData: (data: any) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({ onNext, onBack, formData, updateFormData }) => {
  // Initialize address state with values from formData if they exist
  const [address, setAddress] = useState<AddressFormData>({
    street: formData.street || '',
    number: formData.number || '',
    complement: formData.complement || '',
    neighborhood: formData.neighborhood || '',
    city: formData.city || '',
    state: formData.state || '',
    zipCode: formData.zipCode || '',
    latitude: formData.latitude,
    longitude: formData.longitude,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Automatically geocode when address fields change
  useEffect(() => {
    const geocodeTimeout = setTimeout(async () => {
      if (address.street && address.number && address.neighborhood && address.city && address.state) {
        await performGeocode();
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(geocodeTimeout);
  }, [address.street, address.number, address.neighborhood, address.city, address.state]);

  // Perform geocoding
  const performGeocode = async () => {
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
      return;
    }

    setIsGeocoding(true);
    try {
      const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}`;
      console.log('AddressStep: Tentando geocodificar endereço:', fullAddress);
      
      const coordinates = await geocodeAddress(fullAddress);
      
      if (coordinates) {
        console.log('AddressStep: Coordenadas obtidas:', coordinates);
        setAddress(prev => ({
          ...prev,
          latitude: coordinates.lat,
          longitude: coordinates.lng
        }));
        toast.success('Endereço localizado com sucesso!');
      } else {
        console.warn('AddressStep: Não foi possível obter coordenadas');
        toast.warning('Não foi possível localizar o endereço exato. Verifique se os dados estão corretos.');
      }
    } catch (error) {
      console.error('AddressStep: Erro na geocodificação:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle ZIP code lookup
  const handleCepSearch = async () => {
    if (!address.zipCode || address.zipCode.length !== 8) {
      toast.error('Por favor, insira um CEP válido com 8 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      console.log('AddressStep: Buscando endereço para CEP:', address.zipCode);
      const cepData = await fetchAddressByCep(address.zipCode);
      
      // Check if ViaCEP returned an error
      if ('erro' in cepData) {
        toast.error('CEP não encontrado. Verifique se o CEP está correto.');
        setIsLoading(false);
        return;
      }

      // Update the address with the data from ViaCEP
      const updatedAddress = {
        ...address,
        street: cepData.logradouro || address.street,
        neighborhood: cepData.bairro || address.neighborhood,
        city: cepData.localidade || address.city,
        state: cepData.uf || address.state,
      };
      
      setAddress(updatedAddress);
      
      // Auto-geocode after CEP lookup
      if (updatedAddress.street && address.number) {
        setTimeout(() => performGeocode(), 500);
      }
      
      toast.success('CEP encontrado com sucesso!');
    } catch (error) {
      console.error('AddressStep: Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar o endereço. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      let finalAddress = { ...address };

      // If we don't have coordinates yet, try to geocode now
      if (!address.latitude || !address.longitude) {
        console.log('AddressStep: Coordenadas não encontradas, tentando geocodificar antes de prosseguir');
        const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}`;
        
        const coordinates = await geocodeAddress(fullAddress);
        
        if (coordinates) {
          finalAddress = {
            ...address,
            latitude: coordinates.lat,
            longitude: coordinates.lng
          };
          console.log('AddressStep: Coordenadas obtidas durante submissão:', coordinates);
        } else {
          console.warn('AddressStep: Não foi possível obter coordenadas, mas prosseguindo');
          toast.warning('Não foi possível obter a localização exata. Alguns prestadores podem não aparecer nos resultados.');
        }
      }

      // Update form data and proceed to next step
      console.log('AddressStep: Dados finais do endereço:', finalAddress);
      updateFormData(finalAddress);
      onNext();
    } catch (error) {
      console.error('AddressStep: Erro ao processar endereço:', error);
      toast.error('Ocorreu um erro ao processar o endereço. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4">Endereço do Serviço</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="zipCode">CEP</Label>
              <div className="flex space-x-2">
                <Input 
                  id="zipCode"
                  name="zipCode"
                  value={address.zipCode}
                  onChange={handleChange}
                  placeholder="00000000"
                  className="flex-grow"
                  maxLength={8}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCepSearch}
                  disabled={isLoading}
                >
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Digite apenas números</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street">Rua</Label>
              <Input 
                id="street" 
                name="street"
                value={address.street}
                onChange={handleChange}
                placeholder="Nome da rua" 
                required
              />
            </div>
            <div>
              <Label htmlFor="number">Número</Label>
              <Input 
                id="number" 
                name="number"
                value={address.number}
                onChange={handleChange}
                placeholder="Número" 
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complement">Complemento (opcional)</Label>
            <Input 
              id="complement" 
              name="complement"
              value={address.complement || ''}
              onChange={handleChange}
              placeholder="Apto, Bloco, etc." 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input 
                id="neighborhood" 
                name="neighborhood"
                value={address.neighborhood}
                onChange={handleChange}
                placeholder="Bairro" 
                required
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input 
                id="city" 
                name="city"
                value={address.city}
                onChange={handleChange}
                placeholder="Cidade" 
                required
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input 
                id="state" 
                name="state"
                value={address.state}
                onChange={handleChange}
                placeholder="UF" 
                required
                maxLength={2}
              />
            </div>
          </div>

          {/* Status da geocodificação */}
          {isGeocoding && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Localizando endereço...
            </div>
          )}

          {address.latitude && address.longitude && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="h-2 w-2 bg-green-600 rounded-full"></div>
              Endereço localizado com sucesso
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || isGeocoding}
          >
            {isLoading ? 'Processando...' : 'Continuar'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddressStep;
