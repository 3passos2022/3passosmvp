
import { supabase } from '@/integrations/supabase/client';
import { Service, SubService, Specialty, ServiceQuestion, QuestionOption, ServiceItem } from '@/lib/types';

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

export const getQuestions = async (
  serviceId?: string,
  subServiceId?: string,
  specialtyId?: string
): Promise<ServiceQuestion[]> => {
  try {
    let query = supabase.from('service_questions').select(`
      *,
      question_options(*)
    `);

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    if (subServiceId) {
      query = query.eq('sub_service_id', subServiceId);
    }

    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform the data to match our types
    return data.map((item: any) => ({
      id: item.id,
      question: item.question,
      serviceId: item.service_id,
      subServiceId: item.sub_service_id,
      specialtyId: item.specialty_id,
      options: item.question_options.map((option: any) => ({
        id: option.id,
        questionId: option.question_id,
        optionText: option.option_text
      }))
    }));
  } catch (error) {
    console.error('Error fetching service questions:', error);
    throw error;
  }
};

export const getServiceItems = async (
  serviceId?: string,
  subServiceId?: string,
  specialtyId?: string
): Promise<ServiceItem[]> => {
  try {
    let query = supabase.from('service_items').select('*');

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    if (subServiceId) {
      query = query.eq('sub_service_id', subServiceId);
    }

    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform the data to match our types
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type as 'quantity' | 'square_meter' | 'linear_meter',
      serviceId: item.service_id,
      subServiceId: item.sub_service_id,
      specialtyId: item.specialty_id
    }));
  } catch (error) {
    console.error('Error fetching service items:', error);
    throw error;
  }
};

// Interface for services with metadata for the services page
export interface ServiceWithMeta {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  tags: string[];
  subServices: {
    id: string;
    name: string;
  }[];
}

// Get services with metadata for the services page
export const getServicesWithMeta = async (): Promise<ServiceWithMeta[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, icon_url, tags, sub_services(id, name)')
      .order('name');
      
    if (error) throw error;
    
    // Map the data to the expected format
    return data.map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description || 'Sem descrição disponível',
      icon_url: service.icon_url,
      tags: service.tags || [],
      subServices: service.sub_services || []
    }));
  } catch (error) {
    console.error('Error fetching services with meta:', error);
    throw error;
  }
};

// Create a new service with metadata
export const createService = async (service: {
  name: string;
  description?: string;
  tags?: string[];
  icon_url?: string;
}): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert({
        name: service.name,
        description: service.description,
        tags: service.tags,
        icon_url: service.icon_url
      })
      .select('id')
      .single();

    if (error) throw error;
    
    // Clear cache to ensure fresh data on next fetch
    clearServicesCache();
    
    return data.id;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

// Update an existing service
export const updateService = async (id: string, updates: {
  name?: string;
  description?: string;
  tags?: string[];
  icon_url?: string;
}): Promise<void> => {
  try {
    const { error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    
    // Clear cache to ensure fresh data on next fetch
    clearServicesCache();
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

// Delete a service
export const deleteService = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Clear cache to ensure fresh data on next fetch
    clearServicesCache();
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Upload a service icon to storage
export const uploadServiceIcon = async (
  file: File, 
  serviceId: string
): Promise<string> => {
  try {
    // Create a unique file path for the service icon
    const fileExt = file.name.split('.').pop();
    const filePath = `${serviceId}.${fileExt}`;
    
    // Upload the file to the service-assets bucket
    const { error: uploadError } = await supabase.storage
      .from('service-assets')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    // Get the public URL for the uploaded file
    const { data } = supabase.storage
      .from('service-assets')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading service icon:', error);
    throw error;
  }
};

// Delete a service icon from storage
export const deleteServiceIcon = async (url: string): Promise<void> => {
  try {
    // Extract the file path from the public URL
    const urlParts = url.split('/');
    const filePath = urlParts[urlParts.length - 1];
    
    // Delete the file from the service-assets bucket
    const { error } = await supabase.storage
      .from('service-assets')
      .remove([filePath]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting service icon:', error);
    throw error;
  }
};
