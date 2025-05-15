import { supabase } from '@/integrations/supabase/client';
import { ProviderMatch, QuoteDetails, ProviderProfile } from '@/lib/types/providerMatch';
import { UserProfile } from '@/lib/types';
import { getQuoteSentProviders, markQuoteSentToProvider } from '@/lib/utils/quoteStorage';
import { toast } from '@/components/ui/use-toast';

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

/**
 * Gets the average rating for a provider
 */
const getProviderAverageRating = async (providerId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .rpc('get_provider_average_rating', { p_provider_id: providerId });

    if (error) {
      console.error('Error fetching provider average rating:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in getProviderAverageRating:', error);
    return 0;
  }
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
    if (!serviceId || !address) {
      console.error('Missing required data for provider matching');
      return null;
    }

    // Get providers that match the service first
    const { data: providers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        phone, 
        role,
        avatar_url
      `)
      .eq('role', 'provider');

    if (error) {
      console.error('Error fetching providers:', error);
      throw new Error(`Error fetching providers: ${error.message}`);
    }

    if (!providers || providers.length === 0) {
      console.warn('No providers found');
      return [];
    }

    // Get provider settings for location info
    const { data: providerSettings, error: settingsError } = await supabase
      .from('provider_settings')
      .select(`
        provider_id,
        latitude,
        longitude,
        bio,
        city,
        neighborhood
      `);

    if (settingsError) {
      console.error('Error fetching provider settings:', settingsError);
      // Continue without settings - we'll just have less data
    }

    // Create a map of provider settings by provider_id for easier lookup
    const settingsMap = new Map();
    if (providerSettings) {
      providerSettings.forEach((setting) => {
        settingsMap.set(setting.provider_id, setting);
      });
    }

    // Filter providers based on role
    const filteredProviders = providers.filter(provider => 
      provider.role === 'provider' // Additional safety check
    );

    // Calculate distance and total price for each provider
    const providersWithDistance: ProviderMatch[] = await Promise.all(
      filteredProviders.map(async (provider: any) => {
        let distance: number | null = null;
        let isWithinRadius = false;
        let city = '';
        let neighborhood = '';
        let bio = null;

        // Get provider settings if available
        const settings = settingsMap.get(provider.id);
        if (settings) {
          bio = settings.bio;
          city = settings.city || '';
          neighborhood = settings.neighborhood || '';
          
          // Check if we have coordinate data for both the provider and the address
          if (settings.latitude && settings.longitude && 
              address.latitude !== undefined && address.longitude !== undefined) {
            distance = calculateDistance(
              address.latitude, 
              address.longitude, 
              settings.latitude, 
              settings.longitude
            );
            isWithinRadius = distance <= 10; // 10km radius
          }
        }

        // Get average rating for this provider
        const averageRating = await getProviderAverageRating(provider.id);

        const priceDetails = await calculateProviderPrice(provider.id, items || {});
        const totalPrice = priceDetails.total;

        // Create the provider profile object with required specialties array
        const providerProfile: ProviderProfile = {
          userId: provider.id,
          name: provider.name || '',
          phone: provider.phone || '',
          role: provider.role || 'provider',
          city: city,
          neighborhood: neighborhood,
          averageRating: averageRating,
          bio: bio || '',
          relevanceScore: Math.random(), // Temporário
          specialties: [], // Empty array as we can't get this data currently
          avatar_url: provider.avatar_url || undefined
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

export const getProviderDetails = async (providerId: string): Promise<any> => {
  try {
    // First, check if the provider exists with a simple query
    const providerCheckResult = await supabase
      .from('profiles')
      .select('id')
      .eq('id', providerId)
      .maybeSingle();
    
    if (providerCheckResult.error || !providerCheckResult.data) {
      console.error('Error checking if provider exists:', providerCheckResult.error);
      console.warn(`Provider not found with ID: ${providerId}`);
      return null;
    }
    
    // Now, query for the basic provider details
    const providerResult = await supabase
      .from('profiles')
      .select('id, name, phone, role, avatar_url')
      .eq('id', providerId)
      .maybeSingle();

    // Handle error or no provider found
    if (providerResult.error) {
      console.error('Error fetching provider details:', providerResult.error);
      return null;
    }

    // Make sure we have data
    const profileData = providerResult.data;
    if (!profileData) {
      console.warn(`Provider details not found for ID: ${providerId}`);
      return null;
    }

    // Get the provider's average rating
    const averageRating = await getProviderAverageRating(providerId);

    // Get the provider settings for additional data
    const settingsResult = await supabase
      .from('provider_settings')
      .select('bio, city, neighborhood')
      .eq('provider_id', providerId)
      .maybeSingle();
    
    const settingsData = settingsResult.data || { bio: '', city: '', neighborhood: '' };

    // Map the data to our expected structure with safe defaults
    const provider = {
      userId: profileData.id || '',
      name: profileData.name || '',
      phone: profileData.phone || '',
      role: profileData.role || '',
      city: settingsData.city || '',
      neighborhood: settingsData.neighborhood || '',
      averageRating: averageRating,
      bio: settingsData.bio || '',
      avatar_url: profileData.avatar_url || undefined
    };

    // Fetch portfolio items
    const portfolioResult = await supabase
      .from('provider_portfolio')
      .select('id, image_url, description')
      .eq('provider_id', providerId);

    if (portfolioResult.error) {
      console.error('Error fetching portfolio items:', portfolioResult.error);
    }

    // Extract portfolio items with type safety
    const portfolioItems = (portfolioResult.data || []).map(item => ({
      id: item.id,
      imageUrl: item.image_url,
      description: item.description || undefined
    }));

    return {
      provider: provider,
      portfolioItems: portfolioItems
    };
  } catch (error) {
    console.error('Error in getProviderDetails:', error);
    return null;
  }
};

// Simple type for price data
interface SimplePriceData {
  price_per_unit: number;
}

export const calculateProviderPrice = async (providerId: string, items: { [itemId: string]: number }): Promise<{ total: number, details: any }> => {
  let total = 0;
  const details: any = {};

  try {
    // Fetch the price for each item
    for (const itemId in items) {
      if (items.hasOwnProperty(itemId)) {
        const quantity = items[itemId];

        // Use a simpler approach for price queries
        const priceResult = await supabase
          .from('provider_item_prices')
          .select('price_per_unit')
          .eq('provider_id', providerId)
          .eq('item_id', itemId)
          .maybeSingle();

        if (priceResult.error) {
          console.error(`Error fetching price for item ${itemId}:`, priceResult.error);
          continue;
        }

        const priceData = priceResult.data as SimplePriceData | null;

        if (priceData) {
          const itemPrice = priceData.price_per_unit || 0;
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
    // Ensure we have a valid quote ID
    const quoteId = quoteDetails.id;
    
    if (!quoteId) {
      console.error('Missing quote ID when sending quote to provider');
      return {
        success: false,
        message: "Erro: ID do orçamento não encontrado."
      };
    }

    // Check if we've already sent a quote to this provider
    const existingQuote = await supabase
      .from('quote_providers')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('provider_id', providerId)
      .maybeSingle();
      
    if (existingQuote.data) {
      return {
        success: false,
        message: "Orçamento já enviado para este prestador."
      };
    }

    // Insert the new quote_providers record without the client_id field
    const { data, error } = await supabase
      .from('quote_providers')
      .insert([{
        quote_id: quoteId,
        provider_id: providerId,
        status: 'pending'
      }])
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
    
    return { success: false, message: "Falha ao enviar orçamento." };
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
    const result = await supabase
      .from('quote_providers')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('provider_id', providerId)
      .maybeSingle();
      
    if (result.error) {
      console.error('Error checking quote status:', result.error);
      return false;
    }
    
    return !!result.data;
  } catch (error) {
    console.error('Exception checking quote status:', error);
    return false;
  }
};
