import { supabase } from '@/integrations/supabase/client';
import { ProviderMatch, ProviderDetails, QuoteDetails, ProviderProfile, ProviderSpecialty } from '@/lib/types/providerMatch';
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
      subServiceId: quoteDetails.subServiceId,
      subServiceName: quoteDetails.subServiceName,
      specialtyId: quoteDetails.specialtyId,
      specialtyName: quoteDetails.specialtyName
    });
    
    // Vamos registrar o endereço para verificar se os dados estão corretos
    if (!quoteDetails.address) {
      console.error('Endereço não fornecido no orçamento');
      return [];
    }
    console.log('Endereço do cliente:', quoteDetails.address);

    // Primeiro, vamos buscar todos os prestadores com seus serviços
    console.log('Buscando prestadores disponíveis...');
    
    // Usar variáveis separadas para armazenar os resultados da busca
    let allProviders = [];
    
    // Modificação: Usar RPC para evitar recursão infinita nas políticas RLS
    const { data: rpcProviders, error: providersError } = await supabase.rpc(
      'get_all_providers'
    );

    if (providersError) {
      console.error('Erro ao buscar prestadores via RPC:', providersError);
      // Fallback: tentar busca direta sem RLS
      try {
        const { data: fallbackProviders, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, name, phone, role')
          .eq('role', 'provider');

        if (fallbackError) {
          console.error('Erro no fallback ao buscar prestadores:', fallbackError);
          return [];
        }

        console.log(`Encontrados ${fallbackProviders?.length || 0} prestadores no fallback`);
        allProviders = fallbackProviders || [];
      } catch (fallbackException) {
        console.error('Exceção no fallback ao buscar prestadores:', fallbackException);
        return [];
      }
    } else {
      allProviders = rpcProviders || [];
    }

    if (!allProviders || allProviders.length === 0) {
      console.log('Nenhum prestador encontrado no sistema');
      return [];
    }

    console.log(`Encontrados ${allProviders.length || 0} prestadores no total`);

    // Obter os IDs dos prestadores para uso nas próximas consultas
    // Modificação: Extrair os IDs dos objetos JSON retornados pelo RPC
    const providerIds = allProviders.map(p => {
      // Verificar se é um objeto ou uma string JSON
      if (typeof p === 'string') {
        try {
          const parsed = JSON.parse(p);
          return parsed.id;
        } catch (e) {
          console.error('Erro ao analisar JSON do prestador:', e);
          return null;
        }
      } else if (p && p.id) {
        return p.id;
      }
      return null;
    }).filter(Boolean); // Remover valores nulos
    
    if (providerIds.length === 0) {
      console.log('Nenhum ID de prestador foi obtido');
      return [];
    }

    console.log('IDs de prestadores encontrados:', providerIds);
    
    // Buscar serviços oferecidos por esses prestadores
    let providerServices = [];
    try {
      // Consulta modificada: Usar .in() corretamente para cada providerID
      const { data, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .in('provider_id', providerIds);
        
      if (servicesError) {
        console.error('Erro ao buscar serviços dos prestadores:', servicesError);
        return [];
      }
      
      providerServices = data || [];
      console.log('Serviços retornados da consulta:', providerServices);
    } catch (err) {
      console.error('Exceção ao buscar serviços dos prestadores:', err);
      return [];
    }

    // Filtrar prestadores que oferecem o serviço/subserviço/especialidade solicitado
    const matchingProviderServices = providerServices.filter(service => {
      // Log para depuração - comparar IDs
      console.log(`Comparando: service.specialty_id=${service.specialty_id} com specialty=${quoteDetails.specialtyId}, subService=${quoteDetails.subServiceId}, service=${quoteDetails.serviceId}`);
      
      // Match direto com especialidade, subserviço ou serviço
      return (
        (quoteDetails.specialtyId && service.specialty_id === quoteDetails.specialtyId) || 
        (quoteDetails.subServiceId && service.specialty_id === quoteDetails.subServiceId) || 
        (quoteDetails.serviceId && service.specialty_id === quoteDetails.serviceId)
      );
    });

    console.log(`Encontrados ${matchingProviderServices.length} prestadores compatíveis com o serviço solicitado`);
    
    if (matchingProviderServices.length === 0) {
      return [];
    }

    // Buscar configurações dos prestadores com localização
    let providerSettings = [];
    try {
      const matchingProviderIds = matchingProviderServices.map(ps => ps.provider_id);
      
      if (matchingProviderIds.length === 0) {
        console.log('Nenhum ID de prestador correspondente foi obtido');
        return [];
      }
      
      const { data, error: settingsError } = await supabase
        .from('provider_settings')
        .select('*')
        .in('provider_id', matchingProviderIds);

      if (settingsError) {
        console.error('Erro ao buscar configurações dos prestadores:', settingsError);
        // Continuar mesmo sem configurações, apenas com dados básicos
      }
      
      providerSettings = data || [];
    } catch (err) {
      console.error('Exceção ao buscar configurações dos prestadores:', err);
      // Continuar mesmo sem configurações, apenas com dados básicos
      providerSettings = [];
    }

    // Criar um mapa para acesso rápido
    const settingsMap = new Map();
    providerSettings.forEach(settings => {
      if (settings && settings.provider_id) {
        settingsMap.set(settings.provider_id, settings);
      }
    });

    // Criar um mapa para acessar rapidamente os dados do prestador
    const providerMap = new Map();
    allProviders.forEach(provider => {
      if (provider && provider.id) {
        providerMap.set(provider.id, provider);
      } else if (typeof provider === 'string') {
        try {
          const parsedProvider = JSON.parse(provider);
          if (parsedProvider && parsedProvider.id) {
            providerMap.set(parsedProvider.id, parsedProvider);
          }
        } catch (e) {
          console.error('Erro ao processar provider como string JSON:', e);
        }
      }
    });

    // 2. Geocodificar o endereço do cliente
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
      // Continuamos mesmo se a geocodificação falhar
    }

    // Array para armazenar os prestadores compatíveis
    const matchedProviders: ProviderMatch[] = [];
    
    // Processar cada prestador compatível
    for (const service of matchingProviderServices) {
      try {
        const providerId = service.provider_id;
        if (!providerId) {
          console.log('Serviço sem provider_id válido');
          continue;
        }
        
        const provider = providerMap.get(providerId);
        
        if (!provider) {
          console.log(`Perfil não encontrado para prestador ${providerId}`);
          continue;
        }
        
        const settings = settingsMap.get(providerId);
        
        // Calcular relevância do prestador
        let relevanceScore = 1; // valor base
        
        if (quoteDetails.specialtyId && service.specialty_id === quoteDetails.specialtyId) {
          relevanceScore = 3; // Especialidade exata
        } else if (quoteDetails.subServiceId && service.specialty_id === quoteDetails.subServiceId) {
          relevanceScore = 2; // Sub-serviço 
        } else if (quoteDetails.serviceId && service.specialty_id === quoteDetails.serviceId) {
          relevanceScore = 1; // Apenas o serviço principal
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
          const serviceRadius = settings?.service_radius_km || 0;
          
          // Se o raio for 0, o prestador atende todo o Brasil
          isWithinRadius = serviceRadius === 0 || distance <= serviceRadius;
          
          console.log(`Prestador ${provider.name}, distância: ${distance.toFixed(2)}km, raio: ${serviceRadius}km, dentro do raio: ${isWithinRadius}, relevância: ${relevanceScore}`);
        } else {
          console.log(`Prestador ${provider.name}, não possui coordenadas de localização ou configuração de raio, relevância: ${relevanceScore}`);
          // Se o prestador não tem localização configurada, considerar que ele atende todo o Brasil
          isWithinRadius = true;
          distance = 0; // Valor padrão quando não há coordenadas
        }
        
        // Calcular preço básico para o serviço
        let totalPrice = service.base_price || 0;
        
        // Buscar avaliações do prestador
        let averageRating = 0;
        try {
          const { count, error: countError } = await supabase
            .from('quote_providers')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', providerId);
            
          if (countError) {
            console.error('Erro ao contar orçamentos do prestador:', countError);
          }
          
          const numberOfQuotes = count || 0;
          
          // Aqui estamos apenas atribuindo uma classificação fictícia baseada no número de orçamentos
          if (numberOfQuotes > 10) {
            averageRating = 4.5;
          } else if (numberOfQuotes > 5) {
            averageRating = 4.0;
          } else if (numberOfQuotes > 0) {
            averageRating = 3.5;
          } else {
            averageRating = 0; // Sem avaliações
          }
        } catch (err) {
          console.error('Erro ao processar avaliações:', err);
          averageRating = 0; // Valor padrão em caso de erro
        }
        
        // Criar objeto ProviderProfile
        const providerProfile: ProviderProfile = {
          userId: provider.id,
          bio: settings?.bio || '',
          averageRating: averageRating,
          specialties: [], // Será preenchido se necessário
          name: provider.name || 'Sem nome',
          phone: provider.phone || '',
          city: settings?.city || '',
          neighborhood: settings?.neighborhood || '',
          relevanceScore: relevanceScore
        };
        
        // Adicionar à lista de prestadores compatíveis
        matchedProviders.push({
          provider: providerProfile,
          distance,
          totalPrice,
          isWithinRadius
        });
      } catch (providerError) {
        console.error('Erro ao processar prestador:', providerError);
        // Continuar com o próximo prestador
      }
    }

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
      
      // Se mesma relevância, ordenar por distância
      return a.distance - b.distance;
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

    // 3. Buscar avaliações do prestador (modificado para não usar mais o campo 'rating')
    let averageRating = 0;
    try {
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id')  // Removendo a referência ao campo 'rating'
        .eq('provider_id', providerId);

      if (!quotesError && quotes) {
        // Atribuição de classificação fictícia baseada no número de orçamentos
        const numberOfQuotes = quotes.length;
        
        if (numberOfQuotes > 10) {
          averageRating = 4.5;
        } else if (numberOfQuotes > 5) {
          averageRating = 4.0;
        } else if (numberOfQuotes > 0) {
          averageRating = 3.5;
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
