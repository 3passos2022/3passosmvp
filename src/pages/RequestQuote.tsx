
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, User, Briefcase, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Placeholder component for the three-step form
const RequestQuote: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    // Personal info
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    
    // Service info
    serviceType: '',
    subService: '',
    specialty: '',
    description: '',
    
    // Address info
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };
  
  const submitForm = () => {
    // Here you would send the data to your API
    console.log('Form submitted:', formData);
    toast.success('Orçamento solicitado com sucesso!');
    // Reset form or redirect
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">Solicite um orçamento</h1>
              <p className="text-gray-600">
                Preencha o formulário em 3 passos simples para receber orçamentos de profissionais qualificados.
              </p>
            </div>
            
            {/* Steps indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <span className="text-sm mt-2 font-medium">Dados pessoais</span>
                </div>
                
                <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="text-sm mt-2 font-medium">Detalhes do serviço</span>
                </div>
                
                <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
                
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-sm mt-2 font-medium">Endereço</span>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Informações pessoais"}
                  {step === 2 && "Detalhes do serviço"}
                  {step === 3 && "Endereço"}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Preencha seus dados de contato"}
                  {step === 2 && "Descreva o serviço que você precisa"}
                  {step === 3 && "Informe onde o serviço será realizado"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step 1: Personal Info */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                        required
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
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button onClick={nextStep} className="w-full sm:w-auto">
                        Próximo
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* Step 2: Service Details */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="serviceType">Tipo de serviço</Label>
                      <Select
                        value={formData.serviceType}
                        onValueChange={(value) => handleSelectChange('serviceType', value)}
                      >
                        <SelectTrigger id="serviceType">
                          <SelectValue placeholder="Selecione o tipo de serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pedreiro">Pedreiro</SelectItem>
                          <SelectItem value="eletricista">Eletricista</SelectItem>
                          <SelectItem value="encanador">Encanador</SelectItem>
                          <SelectItem value="pintor">Pintor</SelectItem>
                          <SelectItem value="jardineiro">Jardineiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.serviceType && (
                      <div className="space-y-2">
                        <Label htmlFor="subService">Especialidade</Label>
                        <Select
                          value={formData.subService}
                          onValueChange={(value) => handleSelectChange('subService', value)}
                        >
                          <SelectTrigger id="subService">
                            <SelectValue placeholder="Selecione a especialidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.serviceType === 'pedreiro' && (
                              <>
                                <SelectItem value="alvenaria">Alvenaria</SelectItem>
                                <SelectItem value="revestimento">Revestimento</SelectItem>
                                <SelectItem value="acabamento">Acabamento</SelectItem>
                              </>
                            )}
                            {formData.serviceType === 'eletricista' && (
                              <>
                                <SelectItem value="instalacao">Instalação</SelectItem>
                                <SelectItem value="manutencao">Manutenção</SelectItem>
                                <SelectItem value="reparo">Reparo</SelectItem>
                              </>
                            )}
                            {formData.serviceType === 'encanador' && (
                              <>
                                <SelectItem value="instalacao">Instalação</SelectItem>
                                <SelectItem value="manutencao">Manutenção</SelectItem>
                                <SelectItem value="reparo">Reparo</SelectItem>
                              </>
                            )}
                            {formData.serviceType === 'pintor' && (
                              <>
                                <SelectItem value="interna">Pintura Interna</SelectItem>
                                <SelectItem value="externa">Pintura Externa</SelectItem>
                                <SelectItem value="decorativa">Pintura Decorativa</SelectItem>
                              </>
                            )}
                            {formData.serviceType === 'jardineiro' && (
                              <>
                                <SelectItem value="paisagismo">Paisagismo</SelectItem>
                                <SelectItem value="manutencao">Manutenção</SelectItem>
                                <SelectItem value="poda">Poda</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {formData.subService && (
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Subespecialidade</Label>
                        <Select
                          value={formData.specialty}
                          onValueChange={(value) => handleSelectChange('specialty', value)}
                        >
                          <SelectTrigger id="specialty">
                            <SelectValue placeholder="Selecione a subespecialidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.serviceType === 'pedreiro' && formData.subService === 'alvenaria' && (
                              <>
                                <SelectItem value="construcao-muro">Construção de Muro</SelectItem>
                                <SelectItem value="construcao-parede">Construção de Parede</SelectItem>
                              </>
                            )}
                            {/* Add more subespecialties based on service type and subService */}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição do serviço</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descreva em detalhes o serviço que você precisa..."
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={prevStep}>
                        Voltar
                      </Button>
                      <Button onClick={nextStep}>
                        Próximo
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* Step 3: Address */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Rua</Label>
                        <Input
                          id="street"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          placeholder="Nome da rua"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          name="number"
                          value={formData.number}
                          onChange={handleChange}
                          placeholder="123"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          name="complement"
                          value={formData.complement}
                          onChange={handleChange}
                          placeholder="Apto, Bloco, etc."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          name="neighborhood"
                          value={formData.neighborhood}
                          onChange={handleChange}
                          placeholder="Seu bairro"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          placeholder="00000-000"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Sua cidade"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) => handleSelectChange('state', value)}
                        >
                          <SelectTrigger id="state">
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AC">Acre</SelectItem>
                            <SelectItem value="AL">Alagoas</SelectItem>
                            <SelectItem value="AP">Amapá</SelectItem>
                            <SelectItem value="AM">Amazonas</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="CE">Ceará</SelectItem>
                            <SelectItem value="DF">Distrito Federal</SelectItem>
                            <SelectItem value="ES">Espírito Santo</SelectItem>
                            <SelectItem value="GO">Goiás</SelectItem>
                            <SelectItem value="MA">Maranhão</SelectItem>
                            <SelectItem value="MT">Mato Grosso</SelectItem>
                            <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="PA">Pará</SelectItem>
                            <SelectItem value="PB">Paraíba</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                            <SelectItem value="PE">Pernambuco</SelectItem>
                            <SelectItem value="PI">Piauí</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="RO">Rondônia</SelectItem>
                            <SelectItem value="RR">Roraima</SelectItem>
                            <SelectItem value="SC">Santa Catarina</SelectItem>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="SE">Sergipe</SelectItem>
                            <SelectItem value="TO">Tocantins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={prevStep}>
                        Voltar
                      </Button>
                      <Button onClick={submitForm}>
                        Solicitar orçamentos
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RequestQuote;
