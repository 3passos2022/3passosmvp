
import { supabase } from '@/integrations/supabase/client';
import { ProviderMatch, ProviderDetails, QuoteDetails, ProviderProfile, ProviderSpecialty } from '@/lib/types/providerMatch';
import { calculateDistance, geocodeAddress } from './googleMapsService';

// Function to find matching providers for a quote
export const findMatchingProviders = async (quoteDetails: QuoteDetails): Promise<ProviderMatch[]> => {
  try {
    if (!quoteDetails || !quoteDetails.serviceId) {
      console.error('Invalid quote details:', quoteDetails);
      return [];
    }

    console.log('Starting provider search with details:', {
      serviceId: quoteDetails.serviceId,
      serviceName: quoteDetails.serviceName,
      subServiceId: quoteDetails.subServiceId || 'not specified',
      subServiceName: quoteDetails.subServiceName || 'not specified',
      specialtyId: quoteDetails.specialtyId || 'not specified',
      specialtyName: quoteDetails.specialtyName || 'not specified'
    });
    
    if (!quoteDetails.address) {
      console.error('No address provided in quote');
      return [];
    }
    console.log('Client address:', quoteDetails.address);

    // Fetch all providers - we'll filter them later
    const { data: allProviders, error: providersError } = await supabase
      .rpc('get_all_providers');
      
    if (providersError) {
      console.error('Error fetching provider list:', providersError);
      return [];
    }
    
    console.log('Total available providers:', allProviders?.length);
    
    // For debugging, check if we have any providers at all
    if (!allProviders || allProviders.length === 0) {
      console.error('No providers found in the database');
      return [];
    }

    // Get provider settings
    const { data: providerSettings, error: settingsError } = await supabase
      .from('provider_settings')
      .select('*');

    if (settingsError) {
      console.error('Error fetching provider settings:', settingsError);
    }
    
    console.log('Provider settings fetched:', providerSettings?.length || 0);
    
    // Create map for settings
    const settingsMap = new Map();
    if (providerSettings) {
      providerSettings.forEach(settings => {
        if (settings && settings.provider_id) {
          settingsMap.set(settings.provider_id, settings);
        }
      });
    }

    // Fetch provider item prices
    const { data: providerItemPrices, error: itemPricesError } = await supabase
      .from('provider_item_prices')
      .select('*');
      
    if (itemPricesError) {
      console.error('Error fetching provider item prices:', itemPricesError);
    }
    
    console.log('Provider item prices fetched:', providerItemPrices?.length || 0);
    
    // Create map for item prices
    const itemPricesMap = new Map();
    if (providerItemPrices) {
      providerItemPrices.forEach(price => {
        const key = `${price.provider_id}-${price.item_id}`;
        itemPricesMap.set(key, price.price_per_unit);
      });
    }

    // Fetch service items
    const { data: serviceItems, error: serviceItemsError } = await supabase
      .from('service_items')
      .select('*')
      .or(`service_id.eq.${quoteDetails.serviceId},sub_service_id.eq.${quoteDetails.subServiceId || null},specialty_id.eq.${quoteDetails.specialtyId || null}`);
      
    if (serviceItemsError) {
      console.error('Error fetching service items:', serviceItemsError);
    }
    
    console.log('Service items fetched:', serviceItems?.length || 0);

    // Fetch provider ratings
    const ratingsMap = new Map<string, number>();
    for (const provider of allProviders) {
      const { data: avgRating, error: ratingError } = await supabase.rpc(
        'get_provider_average_rating',
        { p_provider_id: provider.id }
      );
      
      if (ratingError) {
        console.error(`Error fetching average rating for provider ${provider.id}:`, ratingError);
      } else {
        ratingsMap.set(provider.id, avgRating || 0);
      }
    }

    // Geocode client address
    let clientLocation = null;
    try {
      if (quoteDetails.address.street && quoteDetails.address.city) {
        const fullAddress = `${quoteDetails.address.street}, ${quoteDetails.address.number || ''}, ${quoteDetails.address.neighborhood || ''}, ${quoteDetails.address.city}, ${quoteDetails.address.state || ''}, ${quoteDetails.address.zipCode || ''}`;
        console.log('Geocoding client address:', fullAddress);
        
        clientLocation = await geocodeAddress(fullAddress);
        
        if (clientLocation) {
          console.log('Client coordinates:', clientLocation);
        } else {
          console.warn('Could not geocode client address');
        }
      } else {
        console.warn('Incomplete address for geocoding');
      }
    } catch (geoError) {
      console.error('Error geocoding address:', geoError);
    }
    
    // Process each provider
    const matchedProviders: ProviderMatch[] = [];
    
    for (const providerData of allProviders) {
      try {
        const providerId = providerData.id;
        
        console.log('Processing provider:', providerData.name, 'ID:', providerId);
        
        const settings = settingsMap.get(providerId);
        
        // Calculate provider relevance (simplified for now)
        let relevanceScore = 1;
        
        // Calculate distance if possible
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
          
          console.log(`Provider ${providerData.name}, distance: ${distance?.toFixed(2)}km, radius: ${serviceRadius}km, within radius: ${isWithinRadius}`);
          
          // If provider has defined radius and is not within it, skip
          if (serviceRadius > 0 && !isWithinRadius) {
            console.log(`Provider ${providerData.name} is outside service radius. Distance: ${distance.toFixed(2)}km, radius: ${serviceRadius}km`);
            continue; // Skip this provider since they are outside their service radius
          }
        } else {
          console.log(`Provider ${providerData.name} has no coordinates or radius configuration`);
          distance = null;
          isWithinRadius = true;
        }
        
        // Calculate price based on items and measurements
        let totalPrice = 0;
        
        // Add prices for each item if quantity is specified
        if (quoteDetails.items && serviceItems) {
          for (const itemId in quoteDetails.items) {
            const quantity = quoteDetails.items[itemId];
            const key = `${providerId}-${itemId}`;
            const pricePerUnit = itemPricesMap.get(key) || 0;
            
            const itemTotal = pricePerUnit * quantity;
            totalPrice += itemTotal;
            
            console.log(`Item ${itemId}: ${quantity} units × ${pricePerUnit} = ${itemTotal}`);
          }
        }
        
        // Add prices for measurements (square meters) if specified
        if (quoteDetails.measurements && serviceItems) {
          // Find square meter items
          const squareMeterItems = serviceItems.filter(item => item.type === 'square_meter');
          
          // Calculate total area from all measurements
          let totalArea = 0;
          for (const measurement of quoteDetails.measurements) {
            const area = measurement.area || (measurement.width * measurement.length);
            totalArea += area;
          }
          
          // Apply area to each square meter item
          for (const item of squareMeterItems) {
            const key = `${providerId}-${item.id}`;
            const pricePerUnit = itemPricesMap.get(key) || 0;
            
            const areaTotal = pricePerUnit * totalArea;
            totalPrice += areaTotal;
            
            console.log(`Square meter item ${item.id}: ${totalArea} m² × ${pricePerUnit} = ${areaTotal}`);
          }
        }
        
        // If no items or measurements were calculated, set a default price
        if (totalPrice === 0) {
          totalPrice = 100; // Default price
          console.log(`Using default price (${totalPrice}) for provider ${providerData.name}`);
        } else {
          console.log(`Calculated price for provider ${providerData.name}: ${totalPrice}`);
        }
        
        // Get average rating from map
        const averageRating = ratingsMap.get(providerId) || 0;
        
        // Create ProviderProfile object
        const provider: ProviderProfile = {
          userId: providerId,
          bio: settings?.bio || '',
          averageRating,
          specialties: [], // Would be populated if needed
          name: providerData.name || 'No name',
          phone: providerData.phone || '',
          city: settings?.city || '',
          neighborhood: settings?.neighborhood || '',
          relevanceScore: relevanceScore,
          hasAddress: !!(settings?.latitude && settings?.longitude)
        };
        
        // Add to list of compatible providers
        matchedProviders.push({
          provider,
          distance,
          totalPrice,
          isWithinRadius
        });
        
        console.log(`Provider added: ${provider.name}, price: ${totalPrice}, distance: ${distance || 'unknown'}`);
      } catch (providerError) {
        console.error('Error processing provider:', providerError);
      }
    }

    console.log(`Found ${matchedProviders.length} compatible providers total`);

    if (matchedProviders.length === 0) {
      console.log('No providers found within service radius, showing all providers as fallback');
      
      // Fall back to showing all providers ignoring radius
      return await findMatchingProviders_ignoreRadius(quoteDetails);
    }

    // Sort: first those within radius and by relevance, then the others
    matchedProviders.sort((a, b) => {
      // First sort by "is within radius"
      if (a.isWithinRadius && !b.isWithinRadius) return -1;
      if (!a.isWithinRadius && b.isWithinRadius) return 1;
      
      // If both are in the same group, sort by relevance
      const relevanceA = a.provider.relevanceScore || 0;
      const relevanceB = b.provider.relevanceScore || 0;
      
      if (relevanceA !== relevanceB) {
        return relevanceB - relevanceA; // Higher relevance first
      }
      
      // If same relevance and both have distance, sort by distance
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      
      // If one has distance and the other doesn't, prioritize the one with distance
      if (a.distance !== null && b.distance === null) return -1;
      if (a.distance === null && b.distance !== null) return 1;
      
      return 0;
    });

    console.log(`Returning ${matchedProviders.length} providers, ${matchedProviders.filter(p => p.isWithinRadius).length} within radius`);
    return matchedProviders;
  } catch (error) {
    console.error('Error finding matching providers:', error);
    return []; // Return empty array in case of error to avoid breaking the UI
  }
};

// Fallback function to find providers ignoring service radius
const findMatchingProviders_ignoreRadius = async (quoteDetails: QuoteDetails): Promise<ProviderMatch[]> => {
  try {
    if (!quoteDetails || !quoteDetails.serviceId) {
      return [];
    }

    // Fetch all providers - we'll filter them later
    const { data: allProviders, error: providersError } = await supabase
      .rpc('get_all_providers');
      
    if (providersError || !allProviders) {
      console.error('Error fetching provider list:', providersError);
      return [];
    }
    
    // Get provider settings
    const { data: providerSettings } = await supabase
      .from('provider_settings')
      .select('*');
    
    // Create map for settings
    const settingsMap = new Map();
    if (providerSettings) {
      providerSettings.forEach(settings => {
        if (settings && settings.provider_id) {
          settingsMap.set(settings.provider_id, settings);
        }
      });
    }

    // Fetch provider item prices
    const { data: providerItemPrices } = await supabase
      .from('provider_item_prices')
      .select('*');
    
    // Create map for item prices
    const itemPricesMap = new Map();
    if (providerItemPrices) {
      providerItemPrices.forEach(price => {
        const key = `${price.provider_id}-${price.item_id}`;
        itemPricesMap.set(key, price.price_per_unit);
      });
    }

    // Fetch service items
    const { data: serviceItems } = await supabase
      .from('service_items')
      .select('*')
      .or(`service_id.eq.${quoteDetails.serviceId},sub_service_id.eq.${quoteDetails.subServiceId || null},specialty_id.eq.${quoteDetails.specialtyId || null}`);

    // Fetch provider ratings
    const ratingsMap = new Map<string, number>();
    for (const provider of allProviders) {
      const { data: avgRating } = await supabase.rpc(
        'get_provider_average_rating',
        { p_provider_id: provider.id }
      );
      
      ratingsMap.set(provider.id, avgRating || 0);
    }

    // Geocode client address
    let clientLocation = null;
    if (quoteDetails.address.street && quoteDetails.address.city) {
      const fullAddress = `${quoteDetails.address.street}, ${quoteDetails.address.number || ''}, ${quoteDetails.address.neighborhood || ''}, ${quoteDetails.address.city}, ${quoteDetails.address.state || ''}, ${quoteDetails.address.zipCode || ''}`;
      
      clientLocation = await geocodeAddress(fullAddress).catch(() => null);
    }
    
    // Process each provider
    const matchedProviders: ProviderMatch[] = [];
    
    for (const providerData of allProviders) {
      try {
        const providerId = providerData.id;
        const settings = settingsMap.get(providerId);
        
        // Calculate distance if possible
        let distance = null;
        
        if (settings && settings.latitude && settings.longitude && clientLocation) {
          distance = calculateDistance(
            clientLocation.lat, 
            clientLocation.lng, 
            settings.latitude, 
            settings.longitude
          );
        }
        
        // Calculate price based on items and measurements
        let totalPrice = 0;
        
        // Add prices for each item if quantity is specified
        if (quoteDetails.items && serviceItems) {
          for (const itemId in quoteDetails.items) {
            const quantity = quoteDetails.items[itemId];
            const key = `${providerId}-${itemId}`;
            const pricePerUnit = itemPricesMap.get(key) || 0;
            
            totalPrice += pricePerUnit * quantity;
          }
        }
        
        // Add prices for measurements (square meters) if specified
        if (quoteDetails.measurements && serviceItems) {
          // Find square meter items
          const squareMeterItems = serviceItems.filter(item => item.type === 'square_meter');
          
          // Calculate total area from all measurements
          let totalArea = 0;
          for (const measurement of quoteDetails.measurements) {
            const area = measurement.area || (measurement.width * measurement.length);
            totalArea += area;
          }
          
          // Apply area to each square meter item
          for (const item of squareMeterItems) {
            const key = `${providerId}-${item.id}`;
            const pricePerUnit = itemPricesMap.get(key) || 0;
            
            totalPrice += pricePerUnit * totalArea;
          }
        }
        
        // If no items or measurements were calculated, set a default price
        if (totalPrice === 0) {
          totalPrice = 100; // Default price
        }
        
        // Get average rating from map
        const averageRating = ratingsMap.get(providerId) || 0;
        
        // Create ProviderProfile object
        const provider: ProviderProfile = {
          userId: providerId,
          bio: settings?.bio || '',
          averageRating,
          specialties: [], // Would be populated if needed
          name: providerData.name || 'No name',
          phone: providerData.phone || '',
          city: settings?.city || '',
          neighborhood: settings?.neighborhood || '',
          hasAddress: !!(settings?.latitude && settings?.longitude)
        };
        
        // All providers are considered within radius in the fallback
        matchedProviders.push({
          provider,
          distance,
          totalPrice,
          isWithinRadius: false // All are marked as outside radius in fallback
        });
      } catch (providerError) {
        console.error('Error processing provider in fallback:', providerError);
      }
    }

    // Sort by distance if possible, otherwise by name
    matchedProviders.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      
      return (a.provider.name || '').localeCompare(b.provider.name || '');
    });

    return matchedProviders;
  } catch (error) {
    console.error('Error in fallback provider search:', error);
    return [];
  }
};

// Function to get details of a provider
export const getProviderDetails = async (providerId: string): Promise<ProviderDetails | null> => {
  try {
    // Use the security function to get the specific provider
    const { data: allProviders, error: providersError } = await supabase
      .rpc('get_all_providers');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
      return null;
    }
    
    // Find the specific provider
    const provider = allProviders.find(p => p.id === providerId);
    
    if (!provider) {
      console.error('Provider not found:', providerId);
      return null;
    }

    // Get provider settings separately
    const { data: settings, error: settingsError } = await supabase
      .from('provider_settings')
      .select('*')
      .eq('provider_id', providerId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching provider settings:', settingsError);
    }

    // Fetch portfolio of the provider
    const { data: portfolio, error: portfolioError } = await supabase
      .from('provider_portfolio')
      .select('id, image_url, description')
      .eq('provider_id', providerId);

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
    }

    // Fetch ratings of the provider via RPC function
    const { data: avgRating, error: ratingError } = await supabase.rpc(
      'get_provider_average_rating',
      { p_provider_id: providerId }
    );
    
    if (ratingError) {
      console.error('Error fetching ratings:', ratingError);
    }
    
    // Use the average rating obtained from the RPC function
    const averageRating = avgRating || 0;

    // Create explicitly a ProviderProfile object to avoid type issues
    const providerProfile: ProviderProfile = {
      userId: provider.id,
      name: provider.name,
      phone: provider.phone,
      bio: settings?.bio || '',
      averageRating, // Use the calculated average rating
      specialties: [], // Array empty initially
      city: settings?.city || '',
      neighborhood: settings?.neighborhood || '',
      hasAddress: !!(settings?.latitude && settings?.longitude)
    };

    // Calculate distance if coordinates available
    let distance = null;
    let isWithinRadius = true;
    
    if (settings && settings.latitude && settings.longitude) {
      distance = 0; // Will be calculated when needed
    }

    return {
      provider: providerProfile,
      portfolioItems: portfolio ? portfolio.map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        description: item.description
      })) : [],
      distance,
      totalPrice: 0, // Will be calculated when needed
      rating: averageRating, // Use the calculated average rating
      isWithinRadius
    };
  } catch (error) {
    console.error('Error fetching details of provider:', error);
    return null;
  }
};

// Function to send a quote to a provider
export const sendQuoteToProvider = async (
  quoteDetails: QuoteDetails, 
  providerId: string
): Promise<{ success: boolean; message: string; quoteId?: string; requiresLogin?: boolean }> => {
  try {
    // If no quote ID is provided, we need to create it
    if (!quoteDetails.id) {
      return { success: false, message: 'Quote ID not provided', requiresLogin: false };
    }

    // Associate the quote with the provider
    const { error: providerQuoteError } = await supabase
      .from('quote_providers')
      .insert({
        quote_id: quoteDetails.id,
        provider_id: providerId,
        status: 'pending'
      });

    if (providerQuoteError) {
      console.error('Error associating quote with provider:', providerQuoteError);
      return { success: false, message: 'Error sending quote to provider' };
    }

    return { 
      success: true, 
      message: 'Quote sent successfully', 
      quoteId: quoteDetails.id 
    };
  } catch (error) {
    console.error('Error sending quote:', error);
    return { success: false, message: 'Error processing quote' };
  }
};
