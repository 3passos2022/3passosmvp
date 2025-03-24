
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, User, Search, PlusCircle, Edit, Trash, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Placeholder data
  const stats = {
    totalUsers: 1245,
    totalProviders: 436,
    totalClients: 809,
    totalQuotes: 3879,
  };
  
  // Placeholder data for services
  const services = [
    { id: 1, name: 'Pedreiro' },
    { id: 2, name: 'Eletricista' },
    { id: 3, name: 'Encanador' },
    { id: 4, name: 'Pintor' },
    { id: 5, name: 'Jardineiro' },
  ];
  
  // Placeholder data for sub-services
  const subServices = [
    { id: 1, name: 'Alvenaria', serviceId: 1 },
    { id: 2, name: 'Revestimento', serviceId: 1 },
    { id: 3, name: 'Acabamento', serviceId: 1 },
    { id: 4, name: 'Instalação', serviceId: 2 },
    { id: 5, name: 'Manutenção', serviceId: 2 },
    { id: 6, name: 'Reparo', serviceId: 2 },
  ];
  
  // Placeholder data for specialties
  const specialties = [
    { id: 1, name: 'Construção de muro', subServiceId: 1 },
    { id: 2, name: 'Construção de parede', subServiceId: 1 },
    { id: 3, name: 'Colocação de piso', subServiceId: 2 },
    { id: 4, name: 'Colocação de azulejo', subServiceId: 2 },
    { id: 5, name: 'Instalação de tomadas', subServiceId: 4 },
    { id: 6, name: 'Instalação de interruptores', subServiceId: 4 },
  ];
  
  // State for dialogs
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [subServiceDialogOpen, setSubServiceDialogOpen] = useState(false);
  const [specialtyDialogOpen, setSpecialtyDialogOpen] = useState(false);
  
  // State for new service form
  const [newService, setNewService] = useState({ name: '' });
  const [newSubService, setNewSubService] = useState({ name: '', serviceId: '' });
  const [newSpecialty, setNewSpecialty] = useState({ name: '', subServiceId: '' });
  
  // If not admin, redirect to home
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      navigate('/');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }
  
  // Filter services based on search term
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter sub-services based on search term
  const filteredSubServices = subServices.filter(subService => 
    subService.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter specialties based on search term
  const filteredSpecialties = specialties.filter(specialty => 
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddService = () => {
    // Here you would add the service to the database
    console.log('Adding service:', newService);
    toast.success('Serviço adicionado com sucesso!');
    setServiceDialogOpen(false);
    setNewService({ name: '' });
  };
  
  const handleAddSubService = () => {
    // Here you would add the sub-service to the database
    console.log('Adding sub-service:', newSubService);
    toast.success('Subespecialidade adicionada com sucesso!');
    setSubServiceDialogOpen(false);
    setNewSubService({ name: '', serviceId: '' });
  };
  
  const handleAddSpecialty = () => {
    // Here you would add the specialty to the database
    console.log('Adding specialty:', newSpecialty);
    toast.success('Especialidade adicionada com sucesso!');
    setSpecialtyDialogOpen(false);
    setNewSpecialty({ name: '', subServiceId: '' });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Painel Admin</h1>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="pl-10 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Dashboard stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Usuários</p>
                    <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Prestadores</p>
                    <h3 className="text-3xl font-bold">{stats.totalProviders}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Briefcase className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Clientes</p>
                    <h3 className="text-3xl font-bold">{stats.totalClients}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <User className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Orçamentos</p>
                    <h3 className="text-3xl font-bold">{stats.totalQuotes}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Briefcase className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Service management tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="subservices">Subespecialidades</TabsTrigger>
              <TabsTrigger value="specialties">Especialidades</TabsTrigger>
            </TabsList>
            
            {/* Services tab */}
            <TabsContent value="services">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Serviços</CardTitle>
                    <CardDescription>
                      Adicione, edite ou remova serviços disponíveis na plataforma
                    </CardDescription>
                  </div>
                  <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Serviço
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Serviço</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para adicionar um novo serviço à plataforma.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="service-name">Nome do serviço</Label>
                          <Input
                            id="service-name"
                            value={newService.name}
                            onChange={(e) => setNewService({ name: e.target.value })}
                            placeholder="Ex: Pedreiro, Eletricista, etc."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddService}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((service) => (
                        <Card key={service.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-lg">{service.name}</h3>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <Trash className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'Tente uma busca diferente' : 'Adicione serviços para começar'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sub-services tab */}
            <TabsContent value="subservices">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Subespecialidades</CardTitle>
                    <CardDescription>
                      Adicione, edite ou remova subespecialidades para cada serviço
                    </CardDescription>
                  </div>
                  <Dialog open={subServiceDialogOpen} onOpenChange={setSubServiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Subespecialidade
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Subespecialidade</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para adicionar uma nova subespecialidade.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="subservice-name">Nome da subespecialidade</Label>
                          <Input
                            id="subservice-name"
                            value={newSubService.name}
                            onChange={(e) => setNewSubService({ ...newSubService, name: e.target.value })}
                            placeholder="Ex: Alvenaria, Instalação, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subservice-service">Serviço relacionado</Label>
                          <select
                            id="subservice-service"
                            className="w-full p-2 border rounded-md"
                            value={newSubService.serviceId}
                            onChange={(e) => setNewSubService({ ...newSubService, serviceId: e.target.value })}
                          >
                            <option value="">Selecione um serviço</option>
                            {services.map((service) => (
                              <option key={service.id} value={service.id}>{service.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSubServiceDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddSubService}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredSubServices.length > 0 ? (
                      filteredSubServices.map((subService) => (
                        <Card key={subService.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-lg">{subService.name}</h3>
                                <p className="text-gray-600">
                                  Serviço: {services.find(s => s.id === subService.serviceId)?.name}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <Trash className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Nenhuma subespecialidade encontrada</h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'Tente uma busca diferente' : 'Adicione subespecialidades para começar'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Specialties tab */}
            <TabsContent value="specialties">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Especialidades</CardTitle>
                    <CardDescription>
                      Adicione, edite ou remova especialidades para cada subespecialidade
                    </CardDescription>
                  </div>
                  <Dialog open={specialtyDialogOpen} onOpenChange={setSpecialtyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Especialidade
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Especialidade</DialogTitle>
                        <DialogDescription>
                          Preencha os dados para adicionar uma nova especialidade.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialty-name">Nome da especialidade</Label>
                          <Input
                            id="specialty-name"
                            value={newSpecialty.name}
                            onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
                            placeholder="Ex: Construção de muro, Instalação de tomadas, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialty-subservice">Subespecialidade relacionada</Label>
                          <select
                            id="specialty-subservice"
                            className="w-full p-2 border rounded-md"
                            value={newSpecialty.subServiceId}
                            onChange={(e) => setNewSpecialty({ ...newSpecialty, subServiceId: e.target.value })}
                          >
                            <option value="">Selecione uma subespecialidade</option>
                            {subServices.map((subService) => (
                              <option key={subService.id} value={subService.id}>
                                {subService.name} ({services.find(s => s.id === subService.serviceId)?.name})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSpecialtyDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddSpecialty}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredSpecialties.length > 0 ? (
                      filteredSpecialties.map((specialty) => {
                        const subService = subServices.find(s => s.id === specialty.subServiceId);
                        const service = subService ? services.find(s => s.id === subService.serviceId) : null;
                        
                        return (
                          <Card key={specialty.id}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-bold text-lg">{specialty.name}</h3>
                                  <p className="text-gray-600">
                                    {service?.name} &gt; {subService?.name}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button size="sm" variant="destructive">
                                    <Trash className="h-4 w-4 mr-1" />
                                    Excluir
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-10">
                        <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Nenhuma especialidade encontrada</h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'Tente uma busca diferente' : 'Adicione especialidades para começar'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
