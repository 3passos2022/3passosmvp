
import { supabase } from '@/integrations/supabase/client';
import { ProviderMatch, QuoteDetails, ProviderProfile } from '@/lib/types/providerMatch';
import { UserProfile } from '@/lib/types';
import { getQuoteSentProviders, markQuoteSentToProvider } from '@/lib/utils/quoteStorage';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180)
}

export const findMatchingProviders = async (quoteDetails: QuoteDetails): Promise<ProviderMatch[] | null> => {
  try {
    // Extract data from quoteDetails
    const {
      serviceId,
      subServiceId,
      specialtyId,
      address,
      items,
    } = quoteDetails;

    // Validate required data
    if (!serviceId || !address || !address.city) {
      console.error('Missing required data for provider matching');
      return null;
    }

    // Fetch providers based on service, sub-service, and specialty
    let query = supabase
      .from('profiles')
      .select(`
        userId,
        name,
        email,
        phone,
        role,
        city,
        neighborhood,
        averageRating,
        latitude,
        longitude,
        bio,
        services (
          id,
          name
        ),
        sub_services (
          id,
          name,
          service_id
        ),
        specialties (
          id,
          name,
          sub_service_id
        )
      `)
      .eq('role', 'provider');

    // Filter by service
    query = query.contains('services', [{ id: serviceId }]);

    // Filter by sub-service if available
    if (subServiceId) {
      query = query.contains('sub_services', [{ id: subServiceId }]);
    }

    // Filter by specialty if available
    if (specialtyId) {
      query = query.contains('specialties', [{ id: specialtyId }]);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('Error fetching providers:', error);
      throw new Error(`Error fetching providers: ${error.message}`);
    }

    if (!providers || providers.length === 0) {
      console.warn('No providers found for the given criteria');
      return [];
    }

    // Calculate distance and total price for each provider
    const providersWithDistance: ProviderMatch[] = await Promise.all(
      providers.map(async (provider: any) => {
        let distance: number | null = null;
        let isWithinRadius = false;

        // Check if we have coordinate data for both the provider and the address
        if (provider.latitude && provider.longitude && 
            address.latitude !== undefined && address.longitude !== undefined) {
          distance = calculateDistance(
            address.latitude, 
            address.longitude, 
            provider.latitude, 
            provider.longitude
          );
          isWithinRadius = distance <= 10; // 10km radius
        }

        const priceDetails = await calculateProviderPrice(provider.userId, items || {});
        const totalPrice = priceDetails.total;

        // Create the provider profile object with required specialties array
        const providerProfile: ProviderProfile = {
          userId: provider.userId,
          name: provider.name,
          email: provider.email,
          phone: provider.phone,
          role: provider.role,
          city: provider.city,
          neighborhood: provider.neighborhood,
          averageRating: provider.averageRating || 0,
          bio: provider.bio,
          relevanceScore: Math.random(), // Temporário
          specialties: provider.specialties || [] // Add empty array as fallback
        };

        return {
          provider: providerProfile,
          distance: distance,
          isWithinRadius: isWithinRadius,
          totalPrice: totalPrice,
          priceDetails: priceDetails.details
        };
      })
    );

    return providersWithDistance;
  } catch (error: any) {
    console.error('Error in findMatchingProviders:', error);
    throw new Error(`Error finding matching providers: ${error.message}`);
  }
};

export const getProviderDetails = async (providerId: string): Promise<any | null> => {
  try {
    const { data: provider, error } = await supabase
      .from('profiles')
      .select(`
        userId,
        name,
        email,
        phone,
        role,
        city,
        neighborhood,
        averageRating,
        bio
      `)
      .eq('userId', providerId)
      .single();

    if (error) {
      console.error('Error fetching provider details:', error);
      return null;
    }

    // Fetch portfolio items
    const { data: portfolioItems, error: portfolioError } = await supabase
      .from('provider_portfolio') // Updated to use the correct table name
      .select('*')
      .eq('provider_id', providerId);

    if (portfolioError) {
      console.error('Error fetching portfolio items:', portfolioError);
    }

    return {
      provider: provider,
      portfolioItems: portfolioItems || []
    };
  } catch (error) {
    console.error('Error in getProviderDetails:', error);
    return null;
  }
};

export const calculateProviderPrice = async (providerId: string, items: { [itemId: string]: number }): Promise<{ total: number, details: any }> => {
  let total = 0;
  const details: any = {};

  try {
    // Fetch the price for each item
    for (const itemId in items) {
      if (items.hasOwnProperty(itemId)) {
        const quantity = items[itemId];

        const { data: priceData, error: priceError } = await supabase
          .from('provider_item_prices') // Updated to use the correct table name
          .select('price_per_unit') // Updated to use the correct column name
          .eq('provider_id', providerId)
          .eq('item_id', itemId)
          .single();

        if (priceError) {
          console.error(`Error fetching price for item ${itemId}:`, priceError);
          continue; // Skip to the next item if there's an error
        }

        if (priceData) {
          const itemPrice = priceData.price_per_unit || 0; // Updated to use the correct property name
          const itemTotal = itemPrice * quantity;
          total += itemTotal;
          details[itemId] = {
            price: itemPrice,
            quantity: quantity,
            total: itemTotal
          };
        }
      }
    }

    return { total: parseFloat(total.toFixed(2)), details: details };
  } catch (error) {
    console.error('Error in calculateProviderPrice:', error);
    return { total: 0, details: {} };
  }
};

export const sendQuoteToProvider = async (quoteDetails: QuoteDetails, providerId: string): Promise<any> => {
  try {
    const { id: quoteId, clientId } = quoteDetails;

    if (!clientId) {
      return { requiresLogin: true };
    }

    const { data, error } = await supabase
      .from('quote_providers')
      .insert([
        { quote_id: quoteId, provider_id: providerId, client_id: clientId }
      ])
      .select('id');

    if (error) {
      console.error('Error sending quote to provider:', error);
      return { success: false, message: error.message };
    }

    if (data) {
      // Mark this provider as having received a quote in sessionStorage
      markQuoteSentToProvider(providerId);
      
      return {
        success: true,
        quoteId: data[0].id,
        message: "Orçamento enviado com sucesso"
      };
    }
  } catch (error: any) {
    console.error('Error in sendQuoteToProvider:', error);
    return { success: false, message: error.message };
  }
};

export const checkQuoteSentToProvider = async (quoteId: string, providerId: string): Promise<boolean> => {
  // For non-authenticated users, check sessionStorage
  if (!supabase.auth.getSession()) {
    const sentProviders = getQuoteSentProviders();
    return sentProviders.includes(providerId);
  }
  
  // For logged in users, check database
  try {
    const { data, error } = await supabase
      .from('quote_providers')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('provider_id', providerId)
      .single();
      
    if (error) {
      console.error('Error checking quote status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking quote status:', error);
    return false;
  }
};
