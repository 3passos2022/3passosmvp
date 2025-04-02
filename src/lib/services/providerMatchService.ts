
import { supabase } from '@/integrations/supabase/client';
import { ProviderMatch, ProviderDetails, QuoteDetails, ProviderProfile, ProviderSpecialty } from '@/lib/types/providerMatch';
import { calculateDistance, geocodeAddress } from './googleMapsService';

// Função para encontrar prestadores que atendem aos critérios
export const findMatchingProviders = async (quoteDetails: QuoteDetails): Promise<ProviderMatch[]> => {
  try {
    console.log('Iniciando busca de prestadores com serviço:', quoteDetails.serviceName);
    console.log('Detalhes da busca:', {
      serviceId: quoteDetails.serviceId,
      subServiceId: quoteDetails.subServiceId,
      specialtyId: quoteDetails.specialtyId
    });
    
    // Primeiro, vamos verificar se a especialidade existe e obter informações sobre ela
    let specialtyInfo = null;
    if (quoteDetails.specialtyId) {
      const { data: specialty, error: specialtyError } = await supabase
        .from('specialties')
        .select('id, name, sub_service_id')
        .eq('id', quoteDetails.specialtyId)
        .maybeSingle();
      
      if (specialtyError) {
        console.error('Erro ao buscar informações da especialidade:', specialtyError);
      } else if (specialty) {
        specialtyInfo = specialty;
        console.log('Especialidade encontrada:', specialtyInfo);
      }
    }
    
    // Agora, vamos verificar se o subserviço existe e obter informações sobre ele
    let subServiceInfo = null;
    if (quoteDetails.subServiceId) {
      const { data: subService, error: subServiceError } = await supabase
        .from('sub_services')
        .select('id, name, service_id')
        .eq('id', quoteDetails.subServiceId)
        .maybeSingle();
      
      if (subServiceError) {
        console.error('Erro ao buscar informações do subserviço:', subServiceError);
      } else if (subService) {
        subServiceInfo = subService;
        console.log('Subserviço encontrado:', subServiceInfo);
      }
    }
    
    // Construir uma consulta mais abrangente para encontrar prestadores
    console.log('Buscando prestadores que oferecem serviços compatíveis...');
    
    // Abordagem mais simples: buscar todos os provider_services e filtrar depois
    const { data: allProviderServices, error: providerServicesError } = await supabase
      .from('provider_services')
      .select('id, base_price, provider_id, specialty_id');

    if (providerServicesError) {
      console.error('Erro ao buscar serviços dos prestadores:', providerServicesError);
      return [];
    }

    console.log(`Encontrados ${allProviderServices?.length || 0} registros de serviços de prestadores no total`);
    
    // Filtrar manualmente para garantir que pegamos os prestadores corretos
    const providerServices = allProviderServices?.filter(service => {
      // Verificar se o prestador oferece o serviço específico solicitado
      if (quoteDetails.specialtyId && service.specialty_id === quoteDetails.specialtyId) {
        console.log(`Prestador ${service.provider_id} oferece a especialidade exata`);
        return true;
      }
      
      if (quoteDetails.subServiceId && service.specialty_id === quoteDetails.subServiceId) {
        console.log(`Prestador ${service.provider_id} oferece o subserviço`);
        return true;
      }
      
      if (quoteDetails.serviceId && service.specialty_id === quoteDetails.serviceId) {
        console.log(`Prestador ${service.provider_id} oferece o serviço principal`);
        return true;
      }
      
      return false;
    }) || [];
    
    if (!providerServices.length) {
      console.log('Nenhum prestador encontrado para este serviço ou suas categorias relacionadas');
      return [];
    }

    console.log(`Encontrados ${providerServices.length} prestadores que oferecem este serviço ou categorias relacionadas`);
    console.log('Provider services:', providerServices);

    // Get provider profiles in a separate query
    const providerIds = providerServices.map(ps => ps.provider_id);

    // Fetch provider profiles separately to avoid recursion
    const { data: providerProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .in('id', providerIds);

    if (profilesError) {
      console.error('Erro ao buscar perfis dos prestadores:', profilesError);
      return [];
    }

    // Create a map for quick lookup of profiles
    const profilesMap = new Map();
    if (providerProfiles) {
      providerProfiles.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
    }

    // Get provider settings separately
    const { data: providerSettings, error: settingsError } = await supabase
      .from('provider_settings')
      .select('*')
      .in('provider_id', providerIds);

    if (settingsError) {
      console.error('Erro ao buscar configurações dos prestadores:', settingsError);
    }

    // Create a map for quick lookup
    const settingsMap = new Map();
    if (providerSettings) {
      providerSettings.forEach(settings => {
        settingsMap.set(settings.provider_id, settings);
      });
    }

    // Recuperar informações detalhadas sobre os serviços para calcular relevância
    const { data: allSpecialtyInfo, error: allSpecialtyError } = await supabase
      .from('specialties')
      .select('id, name, sub_service_id')
      .in('id', providerServices.map(ps => ps.specialty_id));
      
    if (allSpecialtyError) {
      console.error('Erro ao buscar informações das especialidades:', allSpecialtyError);
    }
    
    const specialtyMap = new Map();
    if (allSpecialtyInfo) {
      allSpecialtyInfo.forEach(specialty => {
        specialtyMap.set(specialty.id, specialty);
      });
    }

    // 2. Geocodificar o endereço do cliente
    const fullAddress = `${quoteDetails.address.street}, ${quoteDetails.address.number}, ${quoteDetails.address.neighborhood}, ${quoteDetails.address.city}, ${quoteDetails.address.state}, ${quoteDetails.address.zipCode}`;
    console.log('Geocodificando endereço do cliente:', fullAddress);
    const clientLocation = await geocodeAddress(fullAddress);

    if (!clientLocation) {
      console.error('Não foi possível geocodificar o endereço do cliente');
      // Continuar mesmo sem coordenadas, apenas não poderemos calcular distâncias precisas
    } else {
      console.log('Coordenadas do cliente:', clientLocation);
    }

    // 3. Buscar itens e medições para calcular preço
    let itemPricesList: any[] = [];
    
    if (quoteDetails.items && Object.keys(quoteDetails.items).length > 0) {
      // Buscar preços específicos de itens que os prestadores oferecem
      const { data: itemPrices, error: itemsError } = await supabase
        .from('provider_item_prices')
        .select('*')
        .in('provider_id', providerIds)
        .in('item_id', Object.keys(quoteDetails.items));
        
      if (itemsError) {
        console.error('Erro ao buscar preços de itens:', itemsError);
      } else if (itemPrices) {
        itemPricesList = itemPrices;
      }
    }

    // 4. Calcular distâncias e preços para cada prestador
    const providers: ProviderMatch[] = [];
    
    for (const ps of providerServices) {
      // Get provider profile from map
      const profile = profilesMap.get(ps.provider_id);
      
      if (!profile) {
        console.log(`Perfil não encontrado para prestador ${ps.provider_id}`);
        continue; // Skip this provider if no profile found
      }
      
      // Get provider settings from map
      const settings = settingsMap.get(ps.provider_id);
      
      // Obter informações da especialidade
      const specialty = specialtyMap.get(ps.specialty_id);
      
      // Calcular relevância do prestador (exata especialidade = maior relevância)
      let relevanceScore = 1; // valor base
      
      if (ps.specialty_id === quoteDetails.specialtyId) {
        relevanceScore = 3; // Especialidade exata
      } else if (ps.specialty_id === quoteDetails.subServiceId) {
        relevanceScore = 2; // Sub-serviço 
      } else if (ps.specialty_id === quoteDetails.serviceId) {
        relevanceScore = 1; // Apenas o serviço principal
      } else if (specialty && specialtyInfo && specialty.sub_service_id === specialtyInfo.sub_service_id) {
        relevanceScore = 2.5; // Especialidade relacionada no mesmo subserviço
      }
      
      // Calcular distância se possível
      let distance = 9999;
      let isWithinRadius = false;
      
      if (settings && settings.latitude && settings.longitude && clientLocation) {
        distance = calculateDistance(
          clientLocation.lat, 
          clientLocation.lng, 
          settings.latitude, 
          settings.longitude
        );
        
        // Definir o raio como o valor da configuração ou um valor padrão de 0 (todo o Brasil)
        const serviceRadius = settings.service_radius_km || 0;
        
        // Se o raio for 0, o prestador atende todo o Brasil
        isWithinRadius = serviceRadius === 0 || distance <= serviceRadius;
        
        console.log(`Prestador ${profile.name}, distância: ${distance.toFixed(2)}km, raio: ${serviceRadius}km, dentro do raio: ${isWithinRadius}, relevância: ${relevanceScore}`);
      } else {
        console.log(`Prestador ${profile.name}, não possui coordenadas de localização ou configuração de raio, relevância: ${relevanceScore}`);
        // Se o prestador não tem localização configurada, considerar que ele atende todo o Brasil
        isWithinRadius = true;
      }
      
      // Calcular preço básico para o serviço
      let totalPrice = ps.base_price || 0;
      
      // Adicionar preços de itens específicos
      if (quoteDetails.items && Object.keys(quoteDetails.items).length > 0) {
        Object.entries(quoteDetails.items).forEach(([itemId, quantity]) => {
          // Encontrar o preço específico do prestador para este item
          const itemPrice = itemPricesList.find(
            (ip) => ip.provider_id === ps.provider_id && ip.item_id === itemId
          );
          
          if (itemPrice) {
            totalPrice += (itemPrice.price_per_unit * Number(quantity));
          } else {
            // Usar preço padrão se o prestador não tiver um preço específico
            totalPrice += ps.base_price * Number(quantity);
          }
        });
      }
      
      // Adicionar preços por medições (metros quadrados/lineares)
      if (quoteDetails.measurements && quoteDetails.measurements.length > 0) {
        quoteDetails.measurements.forEach(measurement => {
          // Calcular área ou comprimento
          const area = measurement.area || (measurement.width * measurement.length);
          totalPrice += ps.base_price * Number(area);
        });
      }
      
      // Cria um objeto ProviderProfile explicitamente para evitar problemas de tipagem
      const providerProfile: ProviderProfile = {
        userId: profile.id,
        bio: settings?.bio || '',
        averageRating: 0, // Será preenchido posteriormente
        specialties: [], // Inicialmente vazia, será preenchida depois se necessário
        name: profile.name,
        phone: profile.phone,
        city: settings?.city || '',
        neighborhood: settings?.neighborhood || '',
        relevanceScore: relevanceScore
      };
      
      providers.push({
        provider: providerProfile,
        distance,
        totalPrice,
        isWithinRadius
      });
    }

    // 5. Buscar dados adicionais dos prestadores (avaliações)
    for (const provider of providers) {
      try {
        // Verificar se o campo rating existe na tabela quotes
        const { data: ratings, error } = await supabase
          .from('quotes')
          .select('rating')
          .eq('provider_id', provider.provider.userId);
          
        if (error) {
          console.error('Erro ao buscar avaliações:', error);
          continue;
        }
        
        // Verificar se temos ratings válidos
        if (ratings && ratings.length > 0) {
          // Filtrar ratings que têm um valor válido
          const validRatings = ratings.filter(r => r.rating !== null && r.rating !== undefined);
          
          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
            provider.provider.averageRating = sum / validRatings.length;
          }
        }
      } catch (err) {
        console.error('Erro ao processar avaliações:', err);
      }
    }

    // Ordenar: primeiro os que estão dentro do raio e por relevância, depois os outros
    providers.sort((a, b) => {
      // Primeiro ordenar por "está no raio"
      if (a.isWithinRadius && !b.isWithinRadius) return -1;
      if (!a.isWithinRadius && b.isWithinRadius) return 1;
      
      // Se ambos estão no mesmo grupo, ordenar por relevância
      const relevanceA = a.provider.relevanceScore || 0;
      const relevanceB = b.provider.relevanceScore || 0;
      
      if (relevanceA !== relevanceB) {
        return relevanceB - relevanceA; // Maior relevância primeiro
      }
      
      // Se mesma relevância, ordenar por distância
      return a.distance - b.distance;
    });

    console.log(`Retornando ${providers.length} prestadores, ${providers.filter(p => p.isWithinRadius).length} dentro do raio`);
    return providers;
  } catch (error) {
    console.error('Erro ao buscar prestadores correspondentes:', error);
    return [];
  }
};

// Função para obter detalhes completos de um prestador
export const getProviderDetails = async (providerId: string): Promise<ProviderDetails | null> => {
  try {
    // 1. Buscar informações básicas do prestador
    const { data: provider, error: providerError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      console.error('Erro ao buscar detalhes do prestador:', providerError);
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

    // 2. Buscar portfólio do prestador
    const { data: portfolio, error: portfolioError } = await supabase
      .from('provider_portfolio')
      .select('id, image_url, description')
      .eq('provider_id', providerId);

    if (portfolioError) {
      console.error('Erro ao buscar portfólio:', portfolioError);
    }

    // 3. Buscar avaliações do prestador
    let averageRating = 0;
    try {
      const { data: ratings, error: ratingError } = await supabase
        .from('quotes')
        .select('rating')
        .eq('provider_id', providerId);

      if (!ratingError && ratings && ratings.length > 0) {
        const validRatings = ratings.filter(r => r.rating !== null && r.rating !== undefined);
        if (validRatings.length > 0) {
          const sum = validRatings.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
          averageRating = sum / validRatings.length;
        }
      }
    } catch (err) {
      console.error('Erro ao calcular avaliações:', err);
    }

    // Criar explicitamente um objeto ProviderProfile para evitar problemas de tipagem
    const providerProfile: ProviderProfile = {
      userId: provider.id,
      name: provider.name,
      phone: provider.phone,
      bio: settings?.bio || '',
      averageRating,
      specialties: [], // Array vazio inicial
      city: settings?.city || '',
      neighborhood: settings?.neighborhood || ''
    };

    return {
      provider: providerProfile,
      portfolioItems: portfolio ? portfolio.map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        description: item.description
      })) : [],
      distance: 0, // Será calculado quando necessário
      totalPrice: 0, // Será calculado quando necessário
      rating: averageRating,
      isWithinRadius: false // Será calculado quando necessário
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
