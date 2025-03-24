
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ArrowRight, Briefcase, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Services: React.FC = () => {
  const { serviceId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Placeholder data for services
  const services = [
    {
      id: 'pedreiro',
      name: 'Pedreiro',
      description: 'Profissionais especializados em construção e reformas',
      icon: '🧱',
      subServices: ['Alvenaria', 'Revestimento', 'Acabamento'],
    },
    {
      id: 'eletricista',
      name: 'Eletricista',
      description: 'Instalação e manutenção de sistemas elétricos',
      icon: '⚡',
      subServices: ['Instalação', 'Manutenção', 'Reparo'],
    },
    {
      id: 'encanador',
      name: 'Encanador',
      description: 'Serviços relacionados a sistemas hidráulicos',
      icon: '🚿',
      subServices: ['Instalação', 'Manutenção', 'Reparo'],
    },
    {
      id: 'pintor',
      name: 'Pintor',
      description: 'Pintura residencial e comercial',
      icon: '🎨',
      subServices: ['Interna', 'Externa', 'Decorativa'],
    },
    {
      id: 'jardineiro',
      name: 'Jardineiro',
      description: 'Cuidados com jardins e áreas verdes',
      icon: '🌱',
      subServices: ['Paisagismo', 'Manutenção', 'Poda'],
    },
    {
      id: 'limpeza',
      name: 'Limpeza',
      description: 'Serviços de limpeza residencial e comercial',
      icon: '🧹',
      subServices: ['Residencial', 'Comercial', 'Pós-obra'],
    },
  ];
  
  // Filter services based on search term
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Find the selected service if serviceId is provided
  const selectedService = serviceId 
    ? services.find(service => service.id === serviceId) 
    : null;
  
  // Placeholder for top providers
  const topProviders = [
    { id: 1, name: 'João Silva', service: 'Pedreiro', rating: 4.9, jobs: 124 },
    { id: 2, name: 'Maria Oliveira', service: 'Pintora', rating: 4.8, jobs: 98 },
    { id: 3, name: 'Carlos Santos', service: 'Eletricista', rating: 4.7, jobs: 156 },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          {!selectedService ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-3xl mx-auto mb-16"
              >
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Serviços disponíveis
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Encontre o profissional ideal para o serviço que você precisa
                </p>
                
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Buscar serviços..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/services/${service.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow hover:scale-[1.02] transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="text-3xl">{service.icon}</div>
                            <Briefcase className="h-5 w-5 text-gray-400" />
                          </div>
                          <CardTitle className="mt-2">{service.name}</CardTitle>
                          <CardDescription>{service.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {service.subServices.map((subService, i) => (
                              <span 
                                key={i} 
                                className="inline-block py-1 px-2 rounded-full bg-primary/10 text-primary text-sm"
                              >
                                {subService}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="ghost" className="w-full justify-between">
                            Ver detalhes
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Top providers section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-24"
              >
                <h2 className="text-2xl font-bold mb-8 text-center">Profissionais em destaque</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topProviders.map((provider, index) => (
                    <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">
                              {provider.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-xl">{provider.name}</CardTitle>
                            <CardDescription>{provider.service}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2 mb-2">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium">{provider.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600">{provider.jobs} trabalhos realizados</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">Ver perfil</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            // Service detail view
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <Link to="/services" className="text-primary hover:underline inline-flex items-center">
                  ← Voltar para serviços
                </Link>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-12">
                <div className="flex-1">
                  <div className="mb-8">
                    <div className="text-5xl mb-4">{selectedService.icon}</div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{selectedService.name}</h1>
                    <p className="text-lg text-gray-600">{selectedService.description}</p>
                  </div>
                  
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Especialidades</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      {selectedService.subServices.map((subService, i) => (
                        <Card key={i}>
                          <CardHeader>
                            <CardTitle className="text-xl">{subService}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600">
                              Contrate profissionais especializados em {subService.toLowerCase()} 
                              para o seu projeto.
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Link to="/request-quote" className="w-full">
                              <Button className="w-full">
                                Solicitar orçamento
                              </Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-1/3">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle>Solicite um orçamento</CardTitle>
                      <CardDescription>
                        Receba propostas de profissionais qualificados em {selectedService.name.toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                          <div>
                            <h3 className="font-bold text-lg">Informações pessoais</h3>
                            <p className="text-gray-600">Preencha seus dados básicos</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                          <div>
                            <h3 className="font-bold text-lg">Detalhes do serviço</h3>
                            <p className="text-gray-600">Explique o que você precisa</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                          <div>
                            <h3 className="font-bold text-lg">Seu endereço</h3>
                            <p className="text-gray-600">Informe onde o serviço será realizado</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link to="/request-quote" className="w-full">
                        <Button className="w-full hover-scale">
                          Solicitar orçamento
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Services;
