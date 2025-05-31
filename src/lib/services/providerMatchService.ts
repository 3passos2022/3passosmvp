import { supabase } from '@/integrations/supabase/client';
import { QuoteDetails, ProviderMatch, ProviderProfile, PriceDetail } from '@/lib/types/providerMatch';
import { geocodeAddress } from './googleMapsService';

// Função para calcular distância entre duas coordenadas usando fórmula de Haversine
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export async function findMatchingProviders(quoteDetails: QuoteDetails): Promise<ProviderMatch[]> {
  try {
    console.log('🔍 [ProviderMatch] Iniciando busca por prestadores para:', quoteDetails);

    // Verificar se temos coordenadas ou tentar geocodificar
    let coordinates = {
      latitude: quoteDetails.address.latitude,
      longitude: quoteDetails.address.longitude
    };

    if (!coordinates.latitude || !coordinates.longitude) {
      console.warn('⚠️ [ProviderMatch] Coordenadas não disponíveis, tentando geocodificar endereço');
      
      // Tentar geocodificar o endereço
      const fullAddress = `${quoteDetails.address.street}, ${quoteDetails.address.number}, ${quoteDetails.address.neighborhood}, ${quoteDetails.address.city}, ${quoteDetails.address.state}`;
      console.log('🌍 [ProviderMatch] Tentando geocodificar:', fullAddress);
      
      try {
        const geocoded = await geocodeAddress(fullAddress);
        if (geocoded) {
          coordinates.latitude = geocoded.lat;
          coordinates.longitude = geocoded.lng;
          console.log('✅ [ProviderMatch] Coordenadas obtidas via geocodificação:', coordinates);
        } else {
          console.error('❌ [ProviderMatch] Falha na geocodificação, não foi possível obter coordenadas');
          return [];
        }
      } catch (geocodeError) {
        console.error('❌ [ProviderMatch] Erro durante geocodificação:', geocodeError);
        return [];
      }
    } else {
      console.log('✅ [ProviderMatch] Coordenadas já disponíveis:', coordinates);
    }

    // Obter prestadores que prestam serviços para a especialidade
    console.log(`🔍 [ProviderMatch] Buscando prestadores para especialidade ID: ${quoteDetails.specialtyId}`);
    
  /*  const { data: providers, error: providersError } = await supabase
      .from('provider_services')
      .select(`
        provider_id,
        base_price,
        profiles!inner(
          id,
          name,
          phone,
          role
        ),
        provider_settings(
          bio,
          city,
          neighborhood,
          latitude,
          longitude,
          service_radius_km
        ),
        specialties!inner(
          id,
          name
        )
      `)
      .eq('specialty_id', quoteDetails.specialtyId);  */

/*       const { data: providers, error: providersError } = await supabase
  .from('profiles')
  .select(`
    id,
    name,
    phone,
    role,
    provider_settings(
      bio,
      city,
      neighborhood,
      latitude,
      longitude,
      service_radius_km
    ),
    provider_services(
      provider_id,
      base_price,
      specialty_id
    ),
    provider_services:specialties(
      id,
      name
    )
  `)
  .filter('provider_services.specialty_id', 'eq', quoteDetails.specialtyId); GPT1*/

 /*  GPT 2 */

 const { data: providers, error: providersError } = await supabase
 .from('profiles')
 .select(`
   id,
   name,
   phone,
   role,
   provider_settings(*),
   provider_services(
     id,
     provider_id,
     base_price,
     specialty_id,
     specialties(
       id,
       name
     )
   )
 `)
 .eq('role', 'provider');

    if (providersError) {
      console.error('❌ [ProviderMatch] Erro ao buscar prestadores:', providersError);
      return [];
    }

    if (!providers || providers.length === 0) {
      console.log('⚠️ [ProviderMatch] Nenhum prestador encontrado para esta especialidade');
      return [];
    }

    console.log(`📋 [ProviderMatch] Encontrados ${providers.length} prestadores na base`);
    console.log('Primeiro prestador:', JSON.stringify(providers[0], null, 2));

    // Processar cada prestador
    const matches: ProviderMatch[] = [];

    for (const provider of providers) {
      console.log('👤 [ProviderMatch] Processando prestador:', provider.name);
      console.log('Serviços do prestador:', JSON.stringify(provider.provider_services, null, 2));

      // Verificar se o prestador tem configurações de localização
      const settings = provider.provider_settings;
        
      if (!settings) {
        console.log(`⚠️ [ProviderMatch] Prestador ${provider.name} não tem configurações`);
        continue;
      }

      if (!settings.latitude || !settings.longitude) {
        console.log(`⚠️ [ProviderMatch] Prestador ${provider.name} não tem coordenadas configuradas`);
        continue;
      }

      // Calcular distância
      const distance = calculateDistance(
        coordinates.latitude!,
        coordinates.longitude!,
        Number(settings.latitude),
        Number(settings.longitude)
      );

      console.log(`📏 [ProviderMatch] Distância calculada para ${provider.name}: ${distance.toFixed(2)}km`);

      // Verificar raio de atendimento (padrão 50km se não configurado)
      const serviceRadius = Number(settings.service_radius_km) || 50;
      const isWithinRadius = distance <= serviceRadius;

      console.log(`🎯 [ProviderMatch] Raio de atendimento: ${serviceRadius}km, Dentro da área: ${isWithinRadius}`);

      // Encontrar o serviço da especialidade específica
      const matchingService = provider.provider_services?.find(
        service => service.specialty_id === quoteDetails.specialtyId
      );
      console.log('Serviço encontrado para especialidade:', matchingService);

      // Calcular preço total baseado nos itens ou medidas
      let totalPrice = matchingService?.base_price || 0;
      let itemsTotal = 0;
      let areaPrice = 0;
      let itemPrices: any[] | null | undefined = undefined;
      const priceDetails: PriceDetail[] = [];

      // Se há itens, calcular preço baseado nos itens
      if (quoteDetails.items && Object.keys(quoteDetails.items).length > 0) {
        console.log(`💰 [ProviderMatch] Calculando preços por itens para ${provider.name}`);
        
        const { data } = await supabase
          .from('provider_item_prices')
          .select(`
            item_id,
            price_per_unit,
            service_items(name, type)
          `)
          .eq('provider_id', provider.id)
          .in('item_id', Object.keys(quoteDetails.items));
        itemPrices = data;

        if (itemPrices) {
          for (const itemPrice of itemPrices) {
            const quantity = quoteDetails.items[itemPrice.item_id] || 0;
            const itemTotal = quantity * itemPrice.price_per_unit;
            itemsTotal += itemTotal;

            priceDetails.push({
              itemId: itemPrice.item_id,
              itemName: itemPrice.service_items?.name,
              quantity,
              pricePerUnit: itemPrice.price_per_unit,
              total: itemTotal
            });
          }
          console.log(`💰 [ProviderMatch] Preço total com itens: R$ ${itemsTotal.toFixed(2)}`);
        }
      }

      // Se há medidas, calcular preço baseado na área
      if (quoteDetails.measurements && quoteDetails.measurements.length > 0) {
        console.log(`📐 [ProviderMatch] Calculando preços por área para ${provider.name}`);
        
        const totalArea = quoteDetails.measurements.reduce((sum, measurement) => {
          return sum + (measurement.area || measurement.width * measurement.length);
        }, 0);

        // Procurar item do tipo m² ou metro quadrado
        let areaItem = null;
        if (typeof itemPrices !== 'undefined' && itemPrices !== null) {
          areaItem = itemPrices.find(item => item.service_items?.type === 'm²' || item.service_items?.type === 'metro quadrado');
        }

        if (totalArea > 0) {
          let areaUnitPrice = 0;
          if (areaItem) {
            areaUnitPrice = areaItem.price_per_unit;
          } else {
            areaUnitPrice = matchingService?.base_price || 0;
          }
          areaPrice = totalArea * areaUnitPrice;

          priceDetails.push({
            itemId: areaItem ? areaItem.item_id : 'area',
            itemName: areaItem ? areaItem.service_items?.name : 'Área total',
            area: totalArea,
            pricePerUnit: areaUnitPrice,
            total: areaPrice
          });
          
          console.log(`📐 [ProviderMatch] Área total: ${totalArea}m², Preço: R$ ${areaPrice.toFixed(2)}`);
        }
      }

      // Soma final do total
      totalPrice += itemsTotal + areaPrice;
      console.log('Total final calculado:', totalPrice);

      // Obter avaliação média do prestador
      const { data: ratings } = await supabase
        .from('provider_ratings')
        .select('rating')
        .eq('provider_id', provider.id);

      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      console.log(`⭐ [ProviderMatch] Avaliação média de ${provider.name}: ${averageRating.toFixed(1)}`);

      // Criar perfil do prestador
      const providerProfile: ProviderProfile = {
        userId: provider.id,
        name: provider.name,
        phone: provider.phone,
        email: '', // Email não está disponível na tabela profiles
        role: provider.role,
        bio: settings.bio || '',
        city: settings.city || '',
        neighborhood: settings.neighborhood || '',
        averageRating,
        specialties: provider.provider_services.map(service => ({
          id: service.specialties.id,
          name: service.specialties.name,
          price: service.base_price
        })),
        hasAddress: true,
        serviceRadiusKm: serviceRadius
      };

      // Adicionar à lista de matches
      const match: ProviderMatch = {
        provider: providerProfile,
        distance,
        totalPrice,
        isWithinRadius,
        priceDetails
      };

      matches.push(match);
      console.log(`✅ [ProviderMatch] Prestador ${provider.name} adicionado aos resultados`);
    }

    // Ordenar por relevância (dentro da área primeiro, depois por distância)
    matches.sort((a, b) => {
      if (a.isWithinRadius && !b.isWithinRadius) return -1;
      if (!a.isWithinRadius && b.isWithinRadius) return 1;
      return (a.distance || 0) - (b.distance || 0);
    });

    console.log(`🎉 [ProviderMatch] Retornando ${matches.length} prestadores encontrados`);
    console.log(`📊 [ProviderMatch] Dentro da área: ${matches.filter(m => m.isWithinRadius).length}`);
    console.log(`📊 [ProviderMatch] Fora da área: ${matches.filter(m => !m.isWithinRadius).length}`);
    
    return matches;

  } catch (error) {
    console.error('❌ [ProviderMatch] Erro na busca por prestadores:', error);
    return [];
  }
}

export async function getProviderDetails(providerId: string, quoteDetails: QuoteDetails) {
  try {
    // Obter dados completos do prestador
    const { data: provider, error } = await supabase
      .from('profiles')
      .select(`
        *,
        provider_settings(*),
        provider_services(
          *,
          specialties(*)
        ),
        provider_portfolio(*)
      `)
      .eq('id', providerId)
      .single();

    if (error || !provider) {
      throw new Error('Prestador não encontrado');
    }

    // Calcular distância e preço
    const matches = await findMatchingProviders(quoteDetails);
    const match = matches.find(m => m.provider.userId === providerId);

    if (!match) {
      throw new Error('Prestador não está disponível para este serviço');
    }

    return {
      provider: match.provider,
      portfolioItems: provider.provider_portfolio?.map((item: any) => ({
        id: item.id,
        imageUrl: item.image_url,
        description: item.description
      })) || [],
      rating: match.provider.averageRating,
      distance: match.distance,
      totalPrice: match.totalPrice,
      isWithinRadius: match.isWithinRadius,
      priceDetails: match.priceDetails
    };

  } catch (error) {
    console.error('Erro ao obter detalhes do prestador:', error);
    throw error;
  }
}
