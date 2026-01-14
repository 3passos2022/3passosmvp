
import { useEffect, useState } from 'react';

// Interface para configuração do Google Maps
interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

// Função para geocodificar um endereço (converter endereço em coordenadas)
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    // Verificar se a API do Google Maps está disponível
    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
      console.error('Google Maps API não está carregada');
      // Usando uma API de geocodificação alternativa como fallback
      return await geocodeFallback(address);
    }

    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address
          });
        } else {
          console.error('Erro na geocodificação:', status);
          // Em caso de falha, tentar geocodificação alternativa
          geocodeFallback(address).then(resolve).catch(reject);
        }
      });
    });
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    // Em caso de exceção, tentar geocodificação alternativa
    return await geocodeFallback(address);
  }
};

// Função auxiliar para buscar no Nominatim
const searchNominatim = async (query: string): Promise<GeocodingResult | null> => {
  try {
    const encodedAddress = encodeURIComponent(query);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`, {
      headers: {
        'Accept-Language': 'pt-BR'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        formattedAddress: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Erro na requisição Nominatim:', error);
    return null;
  }
};

// Função de fallback para geocodificar usando uma API pública
const geocodeFallback = async (address: string): Promise<GeocodingResult | null> => {
  try {
    // 1. Tentar endereço completo
    let result = await searchNominatim(address);
    if (result) return result;

    // Se falhar, tentar extrair partes do endereço (assumindo formato: Rua, Numero, Bairro, Cidade, Estado, CEP)
    const parts = address.split(',').map(p => p.trim());

    // 2. Tentar Rua, Cidade, Estado (sem número, bairro e CEP que podem confundir)
    if (parts.length >= 5) {
      const street = parts[0];
      const city = parts[parts.length - 3];
      const state = parts[parts.length - 2];
      const simplifiedAddress = `${street}, ${city}, ${state}`;

      console.log('Tentando geocodificação simplificada:', simplifiedAddress);
      result = await searchNominatim(simplifiedAddress);
      if (result) return result;
    }

    // 3. Tentar apenas Cidade e Estado (fallback final para garantir alguma localização)
    if (parts.length >= 3) {
      const city = parts[parts.length - 3];
      const state = parts[parts.length - 2];
      const cityState = `${city}, ${state}`;

      console.log('Tentando apenas cidade/estado:', cityState);
      result = await searchNominatim(cityState);
      if (result) return result;
    }

    console.error('Nenhum resultado encontrado na geocodificação alternativa após várias tentativas');
    return null;
  } catch (error) {
    console.error('Erro na geocodificação alternativa:', error);
    return null;
  }
};

// Função para calcular distância entre dois pontos (em km)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  try {
    // Verificar se a API do Google Maps está carregada
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      console.error('Google Maps API Geometry não está carregada');
      // Fallback para cálculo simples (fórmula Haversine)
      return haversineDistance(lat1, lng1, lat2, lng2);
    }

    const point1 = new window.google.maps.LatLng(lat1, lng1);
    const point2 = new window.google.maps.LatLng(lat2, lng2);

    // Calcula a distância em metros e converte para km
    const distanceInMeters = window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
    return distanceInMeters / 1000;
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    // Fallback para cálculo simples
    return haversineDistance(lat1, lng1, lat2, lng2);
  }
};

// Função de fallback para calcular distância usando a fórmula Haversine
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Raio médio da Terra em km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Hook customizado para carregar a API do Google Maps
export const useGoogleMaps = (apiKey: string): boolean => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Verifica se a API já foi carregada
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Evita carregamento múltiplo
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) return;

    // Cria o script para carregar a API
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Maps API carregada com sucesso');
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Erro ao carregar a API do Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup não remove o script para evitar recarregamento desnecessário
    };
  }, [apiKey]);

  return isLoaded;
};
