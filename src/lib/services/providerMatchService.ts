import { supabase } from '@/integrations/supabase/client';
import { ProviderMatch, ProviderDetails, QuoteDetails, ProviderProfile, ProviderSpecialty, PriceDetail } from '@/lib/types/providerMatch';
import { calculateDistance, geocodeAddress } from './googleMapsService';

// Function to find matching providers for a quote
export const findMatchingProviders = async (quoteDetails: QuoteDetails): Promise<ProviderMatch[]> => {
  try {
    console.log('==================== PROVIDER SEARCH STARTED ====================');
    if (!quoteDetails || !quoteDetails.serviceId) {
      console.error('Invalid quote details:', quoteDetails);
      return [];
    }

    console.log('Quote details:', {
      serviceId: quoteDetails.serviceId,
      serviceName: quoteDetails.serviceName,
      subServiceId: quoteDetails.subServiceId || 'not specified',
      subServiceName: quoteDetails.subServiceName || 'not specified',
      specialtyId: quoteDetails.specialtyId || 'not specified',
      specialtyName: quoteDetails.specialtyName || 'not specified'
    });
    
    // Fetch all providers first - CRITICAL QUERY
    const { data: allProviders, error: providersError } = await supabase
      .rpc('get_all_providers');
      
    if (providersError) {
      console.error('Error fetching provider list:', providersError);
      return [];
    }
    
    console.log('Total providers found in database:', allProviders?.length || 0);
    
    if (!allProviders || allProviders.length === 0) {
      console.error('No providers found in the database - CRITICAL ERROR');
      return [];
    }

    allProviders.forEach(provider => {
      console.log(`Provider found: ID=${provider.id}, Name=${provider.name}, Role=${provider.role}`);
    });

    // Get provider settings - FIXING THE EMPTY ARRAY ISSUE BY USING FROM QUERY
    console.log('Fetching provider settings directly from table...');
    const { data: providerSettings, error: settingsError } = await supabase
      .from('provider_settings')
      .select('*');

    if (settingsError) {
      console.error('Error fetching provider settings:', settingsError);
    } else {
      console.log('Provider settings raw response:', providerSettings);
    }
    
    console.log('Provider settings fetched:', providerSettings?.length || 0);

    // Create map for settings
    const settingsMap = new Map();
    if (providerSettings) {
      providerSettings.forEach(settings => {
        if (settings && settings.provider_id) {
          settingsMap.set(settings.provider_id, settings);
          console.log(`Provider ${settings.provider_id} settings loaded: radius=${settings.service_radius_km || 'not set'}, location=${settings.latitude && settings.longitude ? 'set' : 'not set'}`);
        }
      });
    }

    // Fetch provider item prices - Using FROM query instead of the problematic approach
    console.log('Fetching provider item prices directly from table...');
    const { data: providerItemPrices, error: itemPricesError } = await supabase
      .from('provider_item_prices')
      .select('*');
      
    if (itemPricesError) {
      console.error('Error fetching provider item prices:', itemPricesError);
    } else {
      console.log('Provider item prices raw response:', providerItemPrices);
    }
    
    console.log('Provider item prices fetched:', providerItemPrices?.length || 0);
    
    // Log all item prices for debugging - IMPORTANT for troubleshooting
    if (providerItemPrices && providerItemPrices.length > 0) {
      console.log('Provider item prices sample:');
      providerItemPrices.slice(0, 5).forEach(price => {
        console.log(`Provider ${price.provider_id}, Item ${price.item_id}: ${price.price_per_unit}`);
      });
      console.log(`... and ${providerItemPrices.length - 5} more prices`);
    } else {
      console.warn('No provider item prices found in the database!');
    }
    
    // Create map for item prices for faster lookups
    const itemPricesMap = new Map();
    if (providerItemPrices) {
      providerItemPrices.forEach(price => {
        const key = `${price.provider_id}-${price.item_id}`;
        itemPricesMap.set(key, price.price_per_unit);
      });
    }

    // Fetch service items to get their names and types
    const { data: serviceItems, error: serviceItemsError } = await supabase
      .from('service_items')
      .select('*');
      
    if (serviceItemsError) {
      console.error('Error fetching service items:', serviceItemsError);
    }
    
    // Create a map for service items
    const serviceItemsMap = new Map();
    if (serviceItems) {
      serviceItems.forEach(item => {
        serviceItemsMap.set(item.id, item);
      });
      
      console.log('Service items loaded:', serviceItems.length);
    } else {
      console.warn('No service items found in the database!');
    }
    
    // Filter for relevant service items to our quote
    const relevantItems = serviceItems?.filter(item => 
      item.service_id === quoteDetails.serviceId || 
      (quoteDetails.subServiceId && item.sub_service_id === quoteDetails.subServiceId) || 
      (quoteDetails.specialtyId && item.specialty_id === quoteDetails.specialtyId));
    
    console.log('Relevant service items found for this quote:', relevantItems?.length || 0);
    
    if (relevantItems && relevantItems.length > 0) {
      console.log('Sample of relevant service items:');
      relevantItems.slice(0, 3).forEach(item => {
        console.log(`Item ${item.id}: ${item.name}, Type: ${item.type}, Service: ${item.service_id}, SubService: ${item.sub_service_id || 'none'}, Specialty: ${item.specialty_id || 'none'}`);
      });
      if (relevantItems.length > 3) {
        console.log(`... and ${relevantItems.length - 3} more items`);
      }
    } else {
      console.warn('No relevant service items found for this quote - THIS MIGHT BE NORMAL FOR NEW SERVICES');
    }

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
      if (quoteDetails.address && quoteDetails.address.street && quoteDetails.address.city) {
        const fullAddress = `${quoteDetails.address.street}, ${quoteDetails.address.number || ''}, ${quoteDetails.address.neighborhood || ''}, ${quoteDetails.address.city}, ${quoteDetails.address.state || ''}, ${quoteDetails.address.zipCode || ''}`;
        console.log('Geocoding client address:', fullAddress);
        
        clientLocation = await geocodeAddress(fullAddress);
        
        if (clientLocation) {
          console.log('Client coordinates:', clientLocation);
        } else {
          console.warn('Could not geocode client address - using fallback');
          // Use a fallback coordinate to show providers anyway
          clientLocation = { lat: -23.550520, lng: -46.633308 }; // São Paulo coordinates as fallback
          console.log('Using fallback client coordinates:', clientLocation);
        }
      } else {
        console.warn('Incomplete address for geocoding, using fallback coordinates');
        clientLocation = { lat: -23.550520, lng: -46.633308 }; // São Paulo coordinates as fallback
      }
    } catch (geoError) {
      console.error('Error geocoding address:', geoError);
      // Use fallback even if there's an error
      clientLocation = { lat: -23.550520, lng: -46.633308 }; // São Paulo coordinates as fallback
      console.log('Using fallback coordinates due to error:', clientLocation);
    }
    
    // Process each provider
    const matchedProviders: ProviderMatch[] = [];
    
    for (const providerData of allProviders) {
      try {
        const providerId = providerData.id;
        
        console.log('\n----- Processing provider:', providerData.name, '(ID:', providerId, ') -----');
        
        // Get provider settings from the map
        const settings = settingsMap.get(providerId);
        console.log('Provider settings:', settings ? 'Found' : 'Not found', settings);
        
        const serviceRadiusKm = settings?.service_radius_km || 0;
        
        // Calculate distance if possible
        let distance = null;
        let isWithinRadius = true; // Default to true to show all providers
        
        if (settings && settings.latitude && settings.longitude && clientLocation) {
          distance = calculateDistance(
            clientLocation.lat, 
            clientLocation.lng, 
            settings.latitude, 
            settings.longitude
          );
          
          console.log(`Provider ${providerData.name}: distance=${distance?.toFixed(2)}km, radius=${serviceRadiusKm}km`);
          
          // If service radius is set (greater than 0), check if client is within radius
          if (serviceRadiusKm > 0) {
            isWithinRadius = distance <= serviceRadiusKm;
            console.log(`Provider ${providerData.name}: within radius=${isWithinRadius}`);
          }
        } else {
          console.log(`Provider ${providerData.name} has no coordinates or radius configuration - showing as available`);
        }
        
        // Calculate price based on items and measurements
        let totalPrice = 0;
        const priceDetails: PriceDetail[] = [];
        let hasCalculatedPrice = false;
        
        // Process quote items
        if (quoteDetails.items && Object.keys(quoteDetails.items).length > 0) {
          console.log(`Processing ${Object.keys(quoteDetails.items).length} quote items for provider ${providerData.name}`);
          
          for (const itemId in quoteDetails.items) {
            const quantity = quoteDetails.items[itemId];
            const key = `${providerId}-${itemId}`;
            
            // Look up price in the item prices map
            const pricePerUnit = itemPricesMap.get(key);
            const itemInfo = serviceItemsMap.get(itemId);
            
            console.log(`Item ${itemId} (${itemInfo?.name || 'unknown'}): quantity=${quantity}, pricePerUnit=${pricePerUnit || 'not found'} - Key: ${key}`);

            if (pricePerUnit !== undefined && pricePerUnit > 0) {
              const itemTotal = pricePerUnit * quantity;
              totalPrice += itemTotal;
              hasCalculatedPrice = true;

              console.log(`Provider ${providerData.name}: Item ${itemId} (${itemInfo?.name || 'unknown'}): ${quantity} × ${pricePerUnit} = ${itemTotal}`);
              priceDetails.push({
                itemId,
                itemName: itemInfo?.name || `Item ${itemId}`,
                quantity,
                pricePerUnit,
                total: itemTotal
              });
            } else {
              console.log(`Provider ${providerData.name}: No price found for item ${itemId} (${itemInfo?.name || 'unknown'}) with key ${key}`);
            }
          }
        } else {
          console.log(`Provider ${providerData.name}: No items in quote`);
        }
        
        // Process quote measurements (square meters)
        if (quoteDetails.measurements && quoteDetails.measurements.length > 0) {
          // Find square meter items for this service
          const squareMeterItems = relevantItems?.filter(item => item.type === 'square_meter') || [];
          
          console.log(`Provider ${providerData.name}: Found ${squareMeterItems.length} square meter items for this service`);
          
          if (squareMeterItems.length > 0) {
            // Calculate total area from all measurements
            let totalArea = 0;
            for (const measurement of quoteDetails.measurements) {
              // Use provided area or calculate from width × length
              const area = measurement.area || (measurement.width * measurement.length);
              totalArea += area;
              console.log(`Measurement: ${measurement.roomName || 'Room'} - ${area.toFixed(2)} m²`);
            }
            
            console.log(`Provider ${providerData.name}: Total area from measurements: ${totalArea.toFixed(2)} m²`);
            
            // Apply area to each square meter item
            for (const item of squareMeterItems) {
              const key = `${providerId}-${item.id}`;
              const pricePerUnit = itemPricesMap.get(key);
              
              console.log(`Checking square meter item price: ${key}, price=${pricePerUnit || 'not found'}`);
              
              if (pricePerUnit !== undefined && pricePerUnit > 0) {
                const areaTotal = pricePerUnit * totalArea;
                totalPrice += areaTotal;
                hasCalculatedPrice = true;
                
                console.log(`Provider ${providerData.name}: Square meter item ${item.id} (${item.name}): ${totalArea.toFixed(2)} m² × ${pricePerUnit} = ${areaTotal.toFixed(2)}`);
                priceDetails.push({
                  itemId: item.id,
                  itemName: item.name,
                  area: totalArea,
                  pricePerUnit,
                  total: areaTotal
                });
              } else {
                console.log(`Provider ${providerData.name}: No price found for square meter item ${item.id} (${item.name}) with key ${key}`);
              }
            }
          } else {
            console.log(`Provider ${providerData.name}: No square meter items found for this service`);
          }
        } else {
          console.log(`Provider ${providerData.name}: No measurements in quote`);
        }
        
        // If we couldn't calculate a price, let's try to find any related price for this provider
        if (!hasCalculatedPrice) {
          console.log(`Provider ${providerData.name}: No specific prices calculated, using fallback pricing`);
          
          // DEBUG: Log all keys in the itemPricesMap to diagnose why we can't find prices
          console.log("Available price keys in map:");
          if (itemPricesMap.size > 0) {
            Array.from(itemPricesMap.keys()).forEach(key => {
              console.log(` - ${key}: ${itemPricesMap.get(key)}`);
            });
          } else {
            console.log(" - No price keys available");
          }
          
          // Get all prices for this provider from the raw data
          const providerPrices = providerItemPrices?.filter(price => 
            price.provider_id === providerId && price.price_per_unit > 0
          ) || [];
          
          console.log(`Found ${providerPrices.length} general prices for provider ${providerData.name}`);
          
          if (providerPrices.length > 0) {
            // Get the average price of all items this provider has defined
            const avgPrice = providerPrices.reduce((sum, price) => sum + price.price_per_unit, 0) / providerPrices.length;
            
            // Find the most relevant price if possible (same service or subservice)
            const relevantPrices = providerPrices.filter(price => {
              const item = serviceItemsMap.get(price.item_id);
              return item && (
                item.service_id === quoteDetails.serviceId ||
                (quoteDetails.subServiceId && item.sub_service_id === quoteDetails.subServiceId) ||
                (quoteDetails.specialtyId && item.specialty_id === quoteDetails.specialtyId)
              );
            });
            
            if (relevantPrices.length > 0) {
              // Use the average price of relevant services if available
              const relevantAvgPrice = relevantPrices.reduce((sum, price) => sum + price.price_per_unit, 0) / relevantPrices.length;
              totalPrice = relevantAvgPrice * 3; // Multiplying by 3 as a base estimate for service
              console.log(`Using relevant service average price (${relevantAvgPrice} × 3 = ${totalPrice}) for provider ${providerData.name}`);
            } else {
              // Fallback to general average price
              totalPrice = avgPrice * 3; // Multiplying by 3 as a base estimate
              console.log(`Using average base price (${avgPrice} × 3 = ${totalPrice}) for provider ${providerData.name}`);
            }
            
            priceDetails.push({
              itemId: "base-price",
              itemName: "Valor base (estimado)",
              quantity: 1,
              pricePerUnit: totalPrice,
              total: totalPrice
            });
            
            hasCalculatedPrice = true;
          } else {
            // No prices at all for this provider - use default
            totalPrice = 150; // Default price
            console.log(`Using default price (${totalPrice}) for provider ${providerData.name} because no prices were found`);
            priceDetails.push({
              itemId: "default-price",
              itemName: "Valor base (aproximado)",
              quantity: 1,
              pricePerUnit: totalPrice,
              total: totalPrice
            });
            
            hasCalculatedPrice = true;
          }
        }
        
        console.log(`Final price for provider ${providerData.name}: ${totalPrice.toFixed(2)}`);
        
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
          relevanceScore: 1, // Default relevance score
          hasAddress: !!(settings?.latitude && settings?.longitude),
          serviceRadiusKm: serviceRadiusKm
        };
        
        // Add to list of matched providers (whether within radius or not)
        matchedProviders.push({
          provider,
          distance,
          totalPrice,
          isWithinRadius,
          priceDetails
        });
        
        console.log(`Provider added to results: ${provider.name}, price: ${totalPrice.toFixed(2)}, distance: ${distance?.toFixed(2) || 'unknown'}, within radius: ${isWithinRadius}`);
      } catch (providerError) {
        console.error(`Error processing provider ${providerData.id}:`, providerError);
      }
    }

    console.log(`Found ${matchedProviders.length} compatible providers total`);
    console.log(`Within radius: ${matchedProviders.filter(p => p.isWithinRadius).length}`);
    console.log(`Outside radius: ${matchedProviders.filter(p => !p.isWithinRadius).length}`);

    if (matchedProviders.length === 0) {
      console.error('NO PROVIDERS MATCHED - CRITICAL ERROR - returning all providers anyway');
      
      // If no providers matched, return all providers with default pricing
      return allProviders.map(provider => {
        return {
          provider: {
            userId: provider.id,
            bio: '',
            averageRating: 0,
            specialties: [],
            name: provider.name,
            phone: provider.phone,
            city: '',
            neighborhood: '',
            relevanceScore: 1,
            hasAddress: false,
            serviceRadiusKm: 0
          },
          distance: null,
          totalPrice: 150,
          isWithinRadius: true,
          priceDetails: [{
            itemId: "default-price",
            itemName: "Valor base (padrão)",
            quantity: 1,
            pricePerUnit: 150,
            total: 150
          }]
        };
      });
    }

    // Sort: first those within radius by relevance, then the others
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
      
      return 0;
    });

    console.log(`Returning ${matchedProviders.length} providers sorted by radius and relevance`);
    console.log('==================== PROVIDER SEARCH COMPLETED ====================');
    
    return matchedProviders;
  } catch (error) {
    console.error('Error finding matching providers:', error);
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
      hasAddress: !!(settings?.latitude && settings?.longitude),
      serviceRadiusKm: settings?.service_radius_km
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
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('User not authenticated, redirecting to login');
      return { success: false, message: 'Login required', requiresLogin: true };
    }
    
    // If no quote ID is provided, we need to create a new quote
    if (!quoteDetails.id) {
      console.log('Creating new quote in database from quote details');
      
      // Create the quote in the database first
      const { data: quoteData, error: quoteError } = await supabase.rpc(
        'submit_quote',
        {
          p_service_id: quoteDetails.serviceId,
          p_sub_service_id: quoteDetails.subServiceId || null,
          p_specialty_id: quoteDetails.specialtyId || null,
          p_description: quoteDetails.description || '',
          p_street: quoteDetails.address.street,
          p_number: quoteDetails.address.number,
          p_complement: quoteDetails.address.complement || null,
          p_neighborhood: quoteDetails.address.neighborhood,
          p_city: quoteDetails.address.city,
          p_state: quoteDetails.address.state,
          p_zip_code: quoteDetails.address.zipCode,
          p_is_anonymous: !quoteDetails.clientId,
          p_service_date: quoteDetails.serviceDate ? new Date(quoteDetails.serviceDate) : null,
          p_service_end_date: quoteDetails.serviceEndDate ? new Date(quoteDetails.serviceEndDate) : null,
          p_service_time_preference: quoteDetails.serviceTimePreference || null
        }
      );
      
      if (quoteError) {
        console.error('Error creating quote:', quoteError);
        return { success: false, message: 'Error creating quote' };
      }
      
      // Set the newly created quote ID
      quoteDetails.id = quoteData;
      
      console.log('Created new quote with ID:', quoteDetails.id);
      
      // Now add any measurements if they exist
      if (quoteDetails.measurements && quoteDetails.measurements.length > 0) {
        console.log('Adding measurements to quote:', quoteDetails.measurements.length);
        
        for (const measurement of quoteDetails.measurements) {
          const { error: measurementError } = await supabase.rpc(
            'add_quote_measurement',
            {
              p_quote_id: quoteDetails.id,
              p_room_name: measurement.roomName || 'Room',
              p_width: measurement.width,
              p_length: measurement.length,
              p_height: measurement.height || null
            }
          );
          
          if (measurementError) {
            console.error('Error adding measurement:', measurementError);
            // Continue with other measurements
          }
        }
      }
      
      // Add any items if they exist
      if (quoteDetails.items && Object.keys(quoteDetails.items).length > 0) {
        console.log('Adding items to quote:', Object.keys(quoteDetails.items).length);
        
        for (const [itemId, quantity] of Object.entries(quoteDetails.items)) {
          const { error: itemError } = await supabase.rpc(
            'add_quote_item',
            {
              p_quote_id: quoteDetails.id,
              p_item_id: itemId,
              p_quantity: quantity
            }
          );
          
          if (itemError) {
            console.error('Error adding item:', itemError);
            // Continue with other items
          }
        }
      }
    }
    
    // At this point, we should have a valid quote ID
    if (!quoteDetails.id) {
      console.error('Quote ID still not available after creation attempt');
      return { success: false, message: 'Could not create or retrieve quote ID' };
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

// Function to check if a quote has been sent to a provider
export const checkQuoteSentToProvider = async (quoteId: string | undefined, providerId: string): Promise<boolean> => {
  if (!quoteId) return false;
  
  try {
    const { data, error } = await supabase
      .from('quote_providers')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('provider_id', providerId)
      .single();
      
    if (error) {
      console.error('Error checking if quote was sent to provider:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking if quote was sent to provider:', error);
    return false;
  }
};
