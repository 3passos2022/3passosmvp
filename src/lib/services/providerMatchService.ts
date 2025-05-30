
import { supabase } from '@/integrations/supabase/client';
import { QuoteDetails, ProviderMatch, ProviderProfile, PriceDetail } from '@/lib/types/providerMatch';

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
    console.log('Iniciando busca por prestadores para:', quoteDetails);

    // Verificar se temos coordenadas
    if (!quoteDetails.address.latitude || !quoteDetails.address.longitude) {
      console.warn('Coordenadas não disponíveis, será necessário geocodificar endereço');
      return [];
    }

    // Obter prestadores que prestam serviços para a especialidade
    const { data: providers, error: providersError } = await supabase
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
      .eq('specialty_id', quoteDetails.specialtyId);

    if (providersError) {
      console.error('Erro ao buscar prestadores:', providersError);
      return [];
    }

    if (!providers || providers.length === 0) {
      console.log('Nenhum prestador encontrado para esta especialidade');
      return [];
    }

    console.log(`Encontrados ${providers.length} prestadores`);

    // Processar cada prestador
    const matches: ProviderMatch[] = [];

    for (const provider of providers) {
      console.log('Processando prestador:', provider);

      // Verificar se o prestador tem configurações de localização
      const settings = Array.isArray(provider.provider_settings) 
        ? provider.provider_settings[0] 
        : provider.provider_settings;
        
      if (!settings || !settings.latitude || !settings.longitude) {
        console.log(`Prestador ${provider.profiles.name} não tem coordenadas configuradas`);
        continue;
      }

      // Calcular distância
      const distance = calculateDistance(
        quoteDetails.address.latitude,
        quoteDetails.address.longitude,
        Number(settings.latitude),
        Number(settings.longitude)
      );

      console.log(`Distância calculada para ${provider.profiles.name}: ${distance.toFixed(2)}km`);

      // Verificar raio de atendimento (padrão 50km se não configurado)
      const serviceRadius = settings.service_radius_km || 50;
      const isWithinRadius = distance <= serviceRadius;

      console.log(`Raio de atendimento: ${serviceRadius}km, Dentro da área: ${isWithinRadius}`);

      // Calcular preço total baseado nos itens ou medidas
      let totalPrice = provider.base_price || 0;
      const priceDetails: PriceDetail[] = [];

      // Se há itens, calcular preço baseado nos itens
      if (quoteDetails.items && Object.keys(quoteDetails.items).length > 0) {
        const { data: itemPrices } = await supabase
          .from('provider_item_prices')
          .select(`
            item_id,
            price_per_unit,
            service_items(name, type)
          `)
          .eq('provider_id', provider.provider_id)
          .in('item_id', Object.keys(quoteDetails.items));

        if (itemPrices) {
          let itemsTotal = 0;
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
          totalPrice += itemsTotal;
        }
      }

      // Se há medidas, calcular preço baseado na área
      if (quoteDetails.measurements && quoteDetails.measurements.length > 0) {
        const totalArea = quoteDetails.measurements.reduce((sum, measurement) => {
          return sum + (measurement.area || measurement.width * measurement.length);
        }, 0);

        if (totalArea > 0) {
          const areaPrice = totalArea * (provider.base_price || 0);
          totalPrice = areaPrice;

          priceDetails.push({
            itemId: 'area',
            itemName: 'Área total',
            area: totalArea,
            pricePerUnit: provider.base_price || 0,
            total: areaPrice
          });
        }
      }

      // Obter avaliação média do prestador
      const { data: ratings } = await supabase
        .from('provider_ratings')
        .select('rating')
        .eq('provider_id', provider.provider_id);

      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      // Criar perfil do prestador
      const providerProfile: ProviderProfile = {
        userId: provider.provider_id,
        name: provider.profiles.name,
        phone: provider.profiles.phone,
        email: '', // Email não está disponível na tabela profiles
        role: provider.profiles.role,
        bio: settings.bio || '',
        city: settings.city || '',
        neighborhood: settings.neighborhood || '',
        averageRating,
        specialties: [{
          id: provider.specialties.id,
          name: provider.specialties.name,
          price: provider.base_price
        }],
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
      console.log(`Prestador ${provider.profiles.name} adicionado aos resultados`, match);
    }

    // Ordenar por relevância (dentro da área primeiro, depois por distância)
    matches.sort((a, b) => {
      if (a.isWithinRadius && !b.isWithinRadius) return -1;
      if (!a.isWithinRadius && b.isWithinRadius) return 1;
      return (a.distance || 0) - (b.distance || 0);
    });

    console.log(`Retornando ${matches.length} prestadores encontrados`);
    return matches;

  } catch (error) {
    console.error('Erro na busca por prestadores:', error);
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
