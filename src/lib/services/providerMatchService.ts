import { supabase } from '@/integrations/supabase/client';
import { ProviderMatch, ProviderDetails, QuoteDetails, ProviderProfile, ProviderSpecialty, ProviderRating } from '@/lib/types/providerMatch';
import { calculateDistance, geocodeAddress } from './googleMapsService';

// Função para encontrar prestadores que atendem aos critérios
export const findMatchingProviders = async (quoteDetails: QuoteDetails): Promise<ProviderMatch[]> => {
  try {
    if (!quoteDetails || !quoteDetails.serviceId) {
      console.error('Detalhes do orçamento inválidos:', quoteDetails);
      return [];
    }

    console.log('Iniciando busca de prestadores com detalhes:', {
      serviceId: quoteDetails.serviceId,
      serviceName: quoteDetails.serviceName,
      subServiceId: quoteDetails.subServiceId || 'não especificado',
      subServiceName: quoteDetails.subServiceName || 'não especificado',
      specialtyId: quoteDetails.specialtyId || 'não especificado',
      specialtyName: quoteDetails.specialtyName || 'não especificado'
    });
    
    if (!quoteDetails.address) {
      console.error('Endereço não fornecido no orçamento');
      return [];
    }
    console.log('Endereço do cliente:', quoteDetails.address);

    console.log('Buscando prestadores disponíveis...');
    
    // Buscar todos os prestadores usando a função de segurança que evita a recursão
    const { data: allProviders, error: providersError } = await supabase
      .rpc('get_all_providers');
      
    if (providersError) {
      console.error('Erro ao buscar lista de prestadores:', providersError);
      return [];
    }
    
    console.log('Total de prestadores disponíveis:', allProviders?.length);
    
    // Vamos inspecionar todos os serviços cadastrados para debug
    console.log('Inspecionando todos os provider_services registrados:');
    const { data: allServices, error: allServicesError } = await supabase
      .from('provider_services')
      .select('*');
      
    if (allServicesError) {
      console.error('Erro ao buscar todos os serviços:', allServicesError);
    } else {
      console.log('Total de provider_services na tabela:', allServices?.length || 0);
      if (allServices && allServices.length > 0) {
        allServices.forEach(service => {
          console.log(`Provider ID: ${service.provider_id}, Specialty ID: ${service.specialty_id}, Base Price: ${service.base_price}`);
        });
      } else {
        console.log('Nenhum serviço cadastrado na tabela provider_services');
      }
    }
    
    // Array para armazenar todos os serviços compatíveis
    let matchingServices = [];
    
    // Buscar serviços prestados para a especialidade solicitada (se existir)
    if (quoteDetails.specialtyId) {
      console.log(`Buscando serviços com specialty_id=${quoteDetails.specialtyId}`);
      const { data: specialtyServices, error: specialtyError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('specialty_id', quoteDetails.specialtyId);
        
      if (specialtyError) {
        console.error('Erro ao buscar serviços para especialidade:', specialtyError);
      } else if (specialtyServices && specialtyServices.length > 0) {
        console.log('Serviços encontrados para a especialidade:', specialtyServices.length);
        matchingServices = specialtyServices;
      }
    }
    
    // Se não encontrou para especialidade, tentar para o subserviço
    if (!matchingServices.length && quoteDetails.subServiceId) {
      console.log(`Buscando serviços com specialty_id=${quoteDetails.subServiceId} (subserviço)`);
      const { data: subServiceMatches, error: subServiceError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('specialty_id', quoteDetails.subServiceId);
        
      if (subServiceError) {
        console.error('Erro ao buscar serviços para subserviço:', subServiceError);
      } else if (subServiceMatches && subServiceMatches.length > 0) {
        console.log('Serviços encontrados para subserviço:', subServiceMatches.length);
        matchingServices = subServiceMatches;
      }
    }
    
    // Se ainda não encontrou, tentar para o serviço principal
    if (!matchingServices.length && quoteDetails.serviceId) {
      console.log(`Buscando serviços com specialty_id=${quoteDetails.serviceId} (serviço principal)`);
      const { data: serviceMatches, error: serviceError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('specialty_id', quoteDetails.serviceId);
        
      if (serviceError) {
        console.error('Erro ao buscar serviços para serviço principal:', serviceError);
      } else if (serviceMatches && serviceMatches.length > 0) {
        console.log('Serviços encontrados para serviço principal:', serviceMatches.length);
        matchingServices = serviceMatches;
      }
    }
    
    console.log('Total de serviços compatíveis encontrados:', matchingServices.length);
    
    const matchedProviders: ProviderMatch[] = [];
    
    if (matchingServices.length > 0) {
      // Processamento normal se temos serviços
      // Lista de IDs de prestadores encontrados
      const providerIds = matchingServices.map(service => service.provider_id);
      console.log('IDs dos prestadores encontrados:', providerIds);
      
      // Filtrar prestadores pelo ID e criar um mapa para acesso rápido
      const providersMap = new Map();
      allProviders.forEach(provider => {
        if (providerIds.includes(provider.id)) {
          providersMap.set(provider.id, provider);
        }
      });
      
      console.log('Prestadores mapeados:', providersMap.size);
      
      // Buscar configurações dos prestadores
      const { data: providerSettings, error: settingsError } = await supabase
        .from('provider_settings')
        .select('*')
        .in('provider_id', providerIds);

      if (settingsError) {
        console.error('Erro ao buscar configurações dos prestadores:', settingsError);
      }
      
      console.log('Configurações dos prestadores:', providerSettings?.length || 0);
      
      // Criar mapa para configurações
      const settingsMap = new Map();
      if (providerSettings) {
        providerSettings.forEach(settings => {
          if (settings && settings.provider_id) {
            settingsMap.set(settings.provider_id, settings);
          }
        });
      }

      // Buscar avaliações dos prestadores usando a função RPC
      const ratingsMap = new Map<string, number>();
      for (const providerId of providerIds) {
        const { data: avgRating, error: ratingError } = await supabase.rpc(
          'get_provider_average_rating',
          { p_provider_id: providerId }
        );
        
        if (ratingError) {
          console.error(`Erro ao buscar avaliação média do prestador ${providerId}:`, ratingError);
        } else {
          ratingsMap.set(providerId, avgRating || 0);
        }
      }

      // Geocodificar o endereço do cliente
      let clientLocation = null;
      try {
        if (quoteDetails.address.street && quoteDetails.address.city) {
          const fullAddress = `${quoteDetails.address.street}, ${quoteDetails.address.number || ''}, ${quoteDetails.address.neighborhood || ''}, ${quoteDetails.address.city}, ${quoteDetails.address.state || ''}, ${quoteDetails.address.zipCode || ''}`;
          console.log('Geocodificando endereço do cliente:', fullAddress);
          
          clientLocation = await geocodeAddress(fullAddress);
          
          if (clientLocation) {
            console.log('Coordenadas do cliente:', clientLocation);
          } else {
            console.warn('Não foi possível geocodificar o endereço do cliente');
          }
        } else {
          console.warn('Endereço incompleto para geocodificação');
        }
      } catch (geoError) {
        console.error('Erro ao geocodificar endereço:', geoError);
      }
      
      // Processar cada serviço compatível
      for (const service of matchingServices) {
        try {
          const providerId = service.provider_id;
          const providerData = providersMap.get(providerId);
          
          if (!providerId || !providerData) {
            console.log('Serviço sem provider_id ou dados de prestador válidos');
            continue;
          }
          
          console.log('Processando prestador:', providerData.name, 'ID:', providerId);
          
          const settings = settingsMap.get(providerId);
          
          // Calcular relevância do prestador
          let relevanceScore = 1; // valor base
          
          if (quoteDetails.specialtyId && service.specialty_id === quoteDetails.specialtyId) {
            relevanceScore = 3; // Especialidade exata
            console.log('Match exato na especialidade:', quoteDetails.specialtyName);
          } else if (quoteDetails.subServiceId && service.specialty_id === quoteDetails.subServiceId) {
            relevanceScore = 2; // Sub-serviço 
            console.log('Match no subserviço:', quoteDetails.subServiceName);
          } else if (quoteDetails.serviceId && service.specialty_id === quoteDetails.serviceId) {
            relevanceScore = 1; // Apenas o serviço principal
            console.log('Match no serviço principal:', quoteDetails.serviceName);
          }
          
          // Calcular distância se possível
          let distance = null;
          let isWithinRadius = true;
          
          if (settings && settings.latitude && settings.longitude && clientLocation) {
            distance = calculateDistance(
              clientLocation.lat, 
              clientLocation.lng, 
              settings.latitude, 
              settings.longitude
            );
            
            const serviceRadius = settings?.service_radius_km || 0;
            isWithinRadius = serviceRadius === 0 || distance <= serviceRadius;
            
            console.log(`Prestador ${providerData.name}, distância: ${distance.toFixed(2)}km, raio: ${serviceRadius}km, dentro do raio: ${isWithinRadius}`);
            
            // Se o prestador tem raio definido e não está dentro do raio, pular
            if (serviceRadius > 0 && !isWithinRadius) {
              console.log(`Prestador ${providerData.name} fora do raio de atendimento. Distância: ${distance.toFixed(2)}km, raio: ${serviceRadius}km`);
              continue;
            }
          } else {
            console.log(`Prestador ${providerData.name} não possui coordenadas ou configuração de raio`);
            // Se o prestador não tem localização configurada
            distance = null;
            // Sem localização, verificamos se tem configuração de raio
            if (settings && settings.service_radius_km && settings.service_radius_km > 0) {
              // Se tem configuração de raio mas não tem endereço, não incluímos
              console.log(`Prestador ${providerData.name} tem raio de atendimento mas não tem endereço. Pulando.`);
              continue;
            }
            isWithinRadius = true;
          }
          
          // Calcular preço básico para o serviço
          let totalPrice = service.base_price || 0;
          
          // Obter média de avaliações do mapa
          const averageRating = ratingsMap.get(providerId) || 0;
          
          // Criar objeto ProviderProfile
          const provider: ProviderProfile = {
            userId: providerId,
            bio: settings?.bio || '',
            averageRating,
            specialties: [], // Será preenchido se necessário
            name: providerData.name || 'Sem nome',
            phone: providerData.phone || '',
            city: settings?.city || '',
            neighborhood: settings?.neighborhood || '',
            relevanceScore: relevanceScore,
            hasAddress: !!(settings?.latitude && settings?.longitude)
          };
          
          // Adicionar à lista de prestadores compatíveis
          matchedProviders.push({
            provider,
            distance,
            totalPrice,
            isWithinRadius
          });
          
          console.log(`Prestador adicionado: ${provider.name}`);
        } catch (providerError) {
          console.error('Erro ao processar prestador:', providerError);
        }
      }
    }

    console.log(`Encontrados ${matchedProviders.length} prestadores compatíveis no total`);

    // Ordenar: primeiro os que estão dentro do raio e por relevância, depois os outros
    matchedProviders.sort((a, b) => {
      // Primeiro ordenar por "está no raio"
      if (a.isWithinRadius && !b.isWithinRadius) return -1;
      if (!a.isWithinRadius && b.isWithinRadius) return 1;
      
      // Se ambos estão no mesmo grupo, ordenar por relevância
      const relevanceA = a.provider.relevanceScore || 0;
      const relevanceB = b.provider.relevanceScore || 0;
      
      if (relevanceA !== relevanceB) {
        return relevanceB - relevanceA; // Maior relevância primeiro
      }
      
      // Se mesma relevância e ambos tem distância, ordenar por distância
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      
      // Se um tem distância e outro não, priorizar o que tem distância
      if (a.distance !== null && b.distance === null) return -1;
      if (a.distance === null && b.distance !== null) return 1;
      
      return 0;
    });

    console.log(`Retornando ${matchedProviders.length} prestadores, ${matchedProviders.filter(p => p.isWithinRadius).length} dentro do raio`);
    return matchedProviders;
  } catch (error) {
    console.error('Erro ao buscar prestadores correspondentes:', error);
    return []; // Retornar array vazio em caso de erro para evitar quebra da UI
  }
};

// Função para obter detalhes completos de um prestador
export const getProviderDetails = async (providerId: string): Promise<ProviderDetails | null> => {
  try {
    // Usar a função de segurança para obter o prestador específico
    const { data: allProviders, error: providersError } = await supabase
      .rpc('get_all_providers');

    if (providersError) {
      console.error('Erro ao buscar prestadores:', providersError);
      return null;
    }
    
    // Encontrar o prestador específico
    const provider = allProviders.find(p => p.id === providerId);
    
    if (!provider) {
      console.error('Prestador não encontrado:', providerId);
      return null;
    }

    // Get provider settings separately
    const { data: settings, error: settingsError } = await supabase
      .from('provider_settings')
      .select('*')
      .eq('provider_id', providerId)
      .maybeSingle();

    if (settingsError) {
      console.error('Erro ao buscar configurações do prestador:', settingsError);
    }

    // Buscar portfólio do prestador
    const { data: portfolio, error: portfolioError } = await supabase
      .from('provider_portfolio')
      .select('id, image_url, description')
      .eq('provider_id', providerId);

    if (portfolioError) {
      console.error('Erro ao buscar portfólio:', portfolioError);
    }

    // Buscar avaliações do prestador via RPC function
    const { data: avgRating, error: ratingError } = await supabase.rpc(
      'get_provider_average_rating',
      { p_provider_id: providerId }
    );
    
    if (ratingError) {
      console.error('Erro ao buscar avaliações:', ratingError);
    }
    
    // Usar a nota média obtida da função RPC
    const averageRating = avgRating || 0;

    // Criar explicitamente um objeto ProviderProfile para evitar problemas de tipagem
    const providerProfile: ProviderProfile = {
      userId: provider.id,
      name: provider.name,
      phone: provider.phone,
      bio: settings?.bio || '',
      averageRating, // Usar a média calculada
      specialties: [], // Array vazio inicial
      city: settings?.city || '',
      neighborhood: settings?.neighborhood || '',
      hasAddress: !!(settings?.latitude && settings?.longitude)
    };

    // Calcular distância se coordenadas disponíveis
    let distance = null;
    let isWithinRadius = true;
    
    if (settings && settings.latitude && settings.longitude) {
      distance = 0; // Será calculado quando necessário
    }

    return {
      provider: providerProfile,
      portfolioItems: portfolio ? portfolio.map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        description: item.description
      })) : [],
      distance,
      totalPrice: 0, // Será calculado quando necessário
      rating: averageRating, // Usar a média calculada
      isWithinRadius
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes completos do prestador:', error);
    return null;
  }
};

// Função para enviar orçamento para um prestador
export const sendQuoteToProvider = async (
  quoteDetails: QuoteDetails, 
  providerId: string
): Promise<{ success: boolean; message: string; quoteId?: string; requiresLogin?: boolean }> => {
  try {
    // Se não tivermos um quote ID existente, precisamos criá-lo
    if (!quoteDetails.id) {
      return { success: false, message: 'ID do orçamento não fornecido', requiresLogin: false };
    }

    // Associar o orçamento ao prestador
    const { error: providerQuoteError } = await supabase
      .from('quote_providers')
      .insert({
        quote_id: quoteDetails.id,
        provider_id: providerId,
        status: 'pending'
      });

    if (providerQuoteError) {
      console.error('Erro ao associar orçamento ao prestador:', providerQuoteError);
      return { success: false, message: 'Erro ao enviar orçamento ao prestador' };
    }

    return { 
      success: true, 
      message: 'Orçamento enviado com sucesso', 
      quoteId: quoteDetails.id 
    };
  } catch (error) {
    console.error('Erro ao enviar orçamento:', error);
    return { success: false, message: 'Erro ao processar orçamento' };
  }
};
