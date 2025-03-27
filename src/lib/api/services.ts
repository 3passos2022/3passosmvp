
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/lib/types';

// Global services cache to improve performance
let servicesCache: Service[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const clearServicesCache = () => {
  servicesCache = null;
  lastFetchTime = 0;
};

export const getAllServices = async (): Promise<Service[]> => {
  // Check if cache is valid
  const now = Date.now();
  if (servicesCache && now - lastFetchTime < CACHE_DURATION) {
    return servicesCache;
  }

  try {
    // Fetch services, sub-services, and specialties in parallel for better performance
    const [servicesResult, subServicesResult, specialtiesResult] = await Promise.all([
      supabase.from('services').select('*').order('name'),
      supabase.from('sub_services').select('*').order('name'),
      supabase.from('specialties').select('*').order('name')
    ]);

    // Check for errors
    if (servicesResult.error) throw servicesResult.error;
    if (subServicesResult.error) throw subServicesResult.error;
    if (specialtiesResult.error) throw specialtiesResult.error;

    // Create a map of sub-services by service ID
    const subServicesByServiceId = new Map();
    subServicesResult.data.forEach((subService: any) => {
      if (!subServicesByServiceId.has(subService.service_id)) {
        subServicesByServiceId.set(subService.service_id, []);
      }
      subServicesByServiceId.get(subService.service_id).push(subService);
    });

    // Create a map of specialties by sub-service ID
    const specialtiesBySubServiceId = new Map();
    specialtiesResult.data.forEach((specialty: any) => {
      if (!specialtiesBySubServiceId.has(specialty.sub_service_id)) {
        specialtiesBySubServiceId.set(specialty.sub_service_id, []);
      }
      specialtiesBySubServiceId.get(specialty.sub_service_id).push(specialty);
    });

    // Transform data to match the Service interface
    const result = servicesResult.data.map((service: any) => {
      const subServices = subServicesByServiceId.get(service.id) || [];
      
      return {
        id: service.id,
        name: service.name,
        subServices: subServices.map((subService: any) => {
          const specialties = specialtiesBySubServiceId.get(subService.id) || [];
          
          return {
            id: subService.id,
            name: subService.name,
            serviceId: subService.service_id,
            specialties: specialties.map((specialty: any) => ({
              id: specialty.id,
              name: specialty.name,
              subServiceId: specialty.sub_service_id
            }))
          };
        })
      };
    });

    // Update cache
    servicesCache = result;
    lastFetchTime = now;

    return result;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};
