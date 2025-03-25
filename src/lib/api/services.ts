
import { supabase } from '@/integrations/supabase/client';
import { Service, SubService, Specialty, ServiceQuestion, QuestionOption, ServiceItem } from '@/lib/types';

// Fetch all services with their sub-services and specialties
export async function getAllServices(): Promise<Service[]> {
  const { data: servicesData, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .order('name');
  
  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return [];
  }

  const services: Service[] = [];
  
  for (const service of servicesData) {
    // Get sub-services for this service
    const { data: subServicesData, error: subServicesError } = await supabase
      .from('sub_services')
      .select('*')
      .eq('service_id', service.id)
      .order('name');
    
    if (subServicesError) {
      console.error('Error fetching sub-services:', subServicesError);
      continue;
    }

    const subServices: SubService[] = [];
    
    for (const subService of subServicesData) {
      // Get specialties for this sub-service
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from('specialties')
        .select('*')
        .eq('sub_service_id', subService.id)
        .order('name');
      
      if (specialtiesError) {
        console.error('Error fetching specialties:', specialtiesError);
        continue;
      }

      const specialties: Specialty[] = specialtiesData.map(specialty => ({
        id: specialty.id,
        name: specialty.name,
        subServiceId: specialty.sub_service_id
      }));

      subServices.push({
        id: subService.id,
        name: subService.name,
        serviceId: subService.service_id,
        specialties
      });
    }

    services.push({
      id: service.id,
      name: service.name,
      subServices
    });
  }

  return services;
}

// Get questions for a service, sub-service, or specialty
export async function getQuestions(
  serviceId?: string,
  subServiceId?: string,
  specialtyId?: string
): Promise<ServiceQuestion[]> {
  let query = supabase.from('service_questions').select('*');
  
  if (serviceId) {
    query = query.eq('service_id', serviceId);
  } else if (subServiceId) {
    query = query.eq('sub_service_id', subServiceId);
  } else if (specialtyId) {
    query = query.eq('specialty_id', specialtyId);
  } else {
    return [];
  }
  
  const { data: questionsData, error: questionsError } = await query;
  
  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return [];
  }
  
  const questions: ServiceQuestion[] = [];
  
  for (const question of questionsData) {
    // Get options for this question
    const { data: optionsData, error: optionsError } = await supabase
      .from('question_options')
      .select('*')
      .eq('question_id', question.id);
    
    if (optionsError) {
      console.error('Error fetching question options:', optionsError);
      continue;
    }
    
    const options: QuestionOption[] = optionsData.map(option => ({
      id: option.id,
      questionId: option.question_id,
      optionText: option.option_text
    }));
    
    questions.push({
      id: question.id,
      question: question.question,
      serviceId: question.service_id,
      subServiceId: question.sub_service_id,
      specialtyId: question.specialty_id,
      options
    });
  }
  
  return questions;
}

// Get service items for a service, sub-service, or specialty
export async function getServiceItems(
  serviceId?: string,
  subServiceId?: string,
  specialtyId?: string
): Promise<ServiceItem[]> {
  let query = supabase.from('service_items').select('*');
  
  if (serviceId) {
    query = query.eq('service_id', serviceId);
  } else if (subServiceId) {
    query = query.eq('sub_service_id', subServiceId);
  } else if (specialtyId) {
    query = query.eq('specialty_id', specialtyId);
  } else {
    return [];
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching service items:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    serviceId: item.service_id,
    subServiceId: item.sub_service_id,
    specialtyId: item.specialty_id
  }));
}
