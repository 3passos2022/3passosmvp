import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllServices } from '@/lib/api/services';
import { ScrollArea } from "@/components/ui/scroll-area";

interface Service {
  id: string;
  name: string;
  icon_url?: string;
}

const ServiceNavBar: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getAllServices();
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
      className="w-full py-2 bg-white shadow-sm border-b z-[40] relative"
    >
      <div className="container mx-auto">
        <ScrollArea className="w-full">
          <div className="flex items-center space-x-6 px-1 py-1 relative">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col items-center text-center group min-w-[70px] relative z-[41]"
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
                style={{ zIndex: 41 }}
              >
                <button
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/request-quote?serviceId=${service.id}`);
                  }}
                  aria-label={`Solicitar orçamento para ${service.name}`}
                  style={{ zIndex: 42 }}
                >
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
                </button>
                <span className="text-xs mt-1 font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-1">
                  {service.name}
                </span>
                {/* Submenu */}
                {hoveredService === service.id && service.subServices && service.subServices.length > 0 && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-xl p-2 z-[100] min-w-[220px] border border-gray-200 max-h-96 overflow-auto"
                    style={{ top: 48, zIndex: 100 }}
                  >
                    {service.subServices.map((sub) => (
                      <div key={sub.id} className="mb-1 last:mb-0">
                        <button
                          className="w-full text-left px-2 py-1 hover:bg-primary/10 rounded transition-colors font-medium text-sm"
                          onClick={() => navigate(`/request-quote?serviceId=${service.id}&subServiceId=${sub.id}`)}
                        >
                          {sub.name}
                        </button>
                        {/* Especialidades */}
                        {sub.specialties && sub.specialties.length > 0 && (
                          <div className="pl-4 mt-1">
                            {sub.specialties.map((spec) => (
                              <button
                                key={spec.id}
                                className="block w-full text-left px-2 py-1 hover:bg-primary/20 rounded transition-colors text-xs text-gray-700"
                                onClick={() => navigate(`/request-quote?serviceId=${service.id}&subServiceId=${sub.id}&specialtyId=${spec.id}`)}
                              >
                                {spec.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
};

export default ServiceNavBar;
