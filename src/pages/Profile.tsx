
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle, Phone, Mail, Star, Clock, CheckCircle, X, Briefcase, User, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';

// Client Profile Component
const ClientProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would update the user profile in the database
    toast.success('Perfil atualizado com sucesso!');
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
          <CardDescription>
            Atualize suas informações de contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                disabled
              />
              <p className="text-sm text-gray-500">O e-mail não pode ser alterado</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <Button type="submit" className="w-full sm:w-auto">
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Excluir conta</CardTitle>
          <CardDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Client Quotes Component
const ClientQuotes: React.FC = () => {
  // Placeholder data for quotes
  const quotes = [
    {
      id: 1,
      service: 'Pedreiro',
      subService: 'Alvenaria',
      specialty: 'Construção de muro',
      provider: 'João Silva',
      status: 'pending',
      createdAt: '2023-06-15',
    },
    {
      id: 2,
      service: 'Eletricista',
      subService: 'Instalação',
      specialty: 'Instalação de tomadas',
      provider: 'Maria Oliveira',
      status: 'accepted',
      createdAt: '2023-06-10',
    },
    {
      id: 3,
      service: 'Pintor',
      subService: 'Interna',
      specialty: 'Pintura de paredes',
      provider: 'Carlos Santos',
      status: 'completed',
      createdAt: '2023-06-01',
      rating: 4,
    },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meus pedidos de orçamento</CardTitle>
          <CardDescription>
            Acompanhe o status dos seus pedidos de orçamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length > 0 ? (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg">{quote.service} - {quote.specialty}</h3>
                        <p className="text-gray-600">{quote.subService}</p>
                        <div className="flex items-center mt-2">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-600">
                            Solicitado em: {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          {quote.status === 'pending' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Pendente
                            </span>
                          )}
                          {quote.status === 'accepted' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Aceito
                            </span>
                          )}
                          {quote.status === 'completed' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Concluído
                            </span>
                          )}
                        </div>
                        
                        {quote.status === 'completed' && (
                          <div className="mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < (quote.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Sua avaliação</p>
                          </div>
                        )}
                        
                        {quote.provider && quote.status === 'accepted' && (
                          <div className="mt-2">
                            <span className="font-medium">{quote.provider}</span>
                            <p className="text-sm text-gray-600">Prestador de serviço</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        Ver detalhes
                      </Button>
                      
                      {quote.status === 'completed' && !quote.rating && (
                        <Button size="sm">
                          Avaliar serviço
                        </Button>
                      )}
                      
                      {quote.status === 'pending' && (
                        <Button size="sm" variant="destructive">
                          Cancelar pedido
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-600 mb-4">
                Você ainda não solicitou nenhum orçamento
              </p>
              <Link to="/request-quote">
                <Button>
                  Solicitar orçamento
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Provider Services Component
const ProviderServices: React.FC = () => {
  // Placeholder data for provider services
  const providerServices = [
    {
      id: 1,
      service: 'Pedreiro',
      subService: 'Alvenaria',
      specialty: 'Construção de muro',
      price: 150,
    },
    {
      id: 2,
      service: 'Pedreiro',
      subService: 'Alvenaria',
      specialty: 'Construção de parede',
      price: 200,
    },
    {
      id: 3,
      service: 'Pedreiro',
      subService: 'Revestimento',
      specialty: 'Colocação de piso',
      price: 80,
    },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Meus serviços</CardTitle>
            <CardDescription>
              Gerencie os serviços que você oferece
            </CardDescription>
          </div>
          <Button>
            Adicionar serviço
          </Button>
        </CardHeader>
        <CardContent>
          {providerServices.length > 0 ? (
            <div className="space-y-4">
              {providerServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg">{service.service} - {service.specialty}</h3>
                        <p className="text-gray-600">{service.subService}</p>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="font-bold text-xl text-primary">
                          R$ {service.price}
                        </div>
                        <p className="text-sm text-gray-600">Preço por unidade</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive">
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
              <p className="text-gray-600 mb-4">
                Você ainda não oferece nenhum serviço
              </p>
              <Button>
                Adicionar serviço
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main Profile Component
const Profile: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname.split('/').pop();
    if (path === 'profile') setActiveTab('profile');
    else if (path === 'quotes') setActiveTab('quotes');
    else if (path === 'services') setActiveTab('services');
    else setActiveTab('profile');
  }, [location.pathname]);
  
  // If not logged in, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="md:w-64">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h2 className="font-bold text-xl">{user.name}</h2>
                    <p className="text-sm text-gray-600">
                      {user.role === UserRole.CLIENT ? 'Cliente' : 'Prestador de Serviço'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Link 
                      to="/profile" 
                      className={`flex items-center p-2 rounded-lg ${
                        activeTab === 'profile' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <User className="h-5 w-5 mr-2" />
                      Meu perfil
                    </Link>
                    <Link 
                      to="/profile/quotes" 
                      className={`flex items-center p-2 rounded-lg ${
                        activeTab === 'quotes' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Clock className="h-5 w-5 mr-2" />
                      Meus pedidos
                    </Link>
                    {user.role === UserRole.PROVIDER && (
                      <Link 
                        to="/profile/services" 
                        className={`flex items-center p-2 rounded-lg ${
                          activeTab === 'services' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Briefcase className="h-5 w-5 mr-2" />
                        Meus serviços
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main content */}
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<ClientProfile />} />
                <Route path="/quotes" element={<ClientQuotes />} />
                {user.role === UserRole.PROVIDER && (
                  <Route path="/services" element={<ProviderServices />} />
                )}
              </Routes>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
