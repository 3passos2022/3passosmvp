
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from "@/components/ui/scroll-area";

interface Service {
  id: string;
  name: string;
  icon_url?: string;
}

const ServiceNavBar: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, icon_url')
          .order('name');
        
        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-2 bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <div className="h-10 flex items-center justify-center">
            <p className="text-sm text-gray-500">Carregando serviços...</p>
          </div>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="w-full py-2 bg-white shadow-sm border-b"
    >
      <div className="container mx-auto">
        <ScrollArea className="w-full">
          <div className="flex items-center space-x-6 px-1 py-1">
            {services.map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="flex flex-col items-center text-center group min-w-[70px]"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {service.icon_url ? (
                    <img 
                      src={service.icon_url} 
                      alt={service.name} 
                      className="w-5 h-5 object-contain" 
                    />
                  ) : (
                    <span className="text-primary font-semibold text-sm">
                      {service.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-1">
                  {service.name}
                </span>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
};

export default ServiceNavBar;
