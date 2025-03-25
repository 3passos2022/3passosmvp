
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Phone, UserCircle, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Login: React.FC = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>(UserRole.CLIENT);

  // If user is already logged in, redirect to profile
  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      navigate('/profile');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(registerEmail, registerPassword, {
        name: registerName,
        email: registerEmail,
        phone: registerPhone,
        role: registerRole,
      });
      
      // Auto login after registration
      await signIn(registerEmail, registerPassword);
      navigate('/profile');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Cadastro</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" asChild>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>
                          Entre na sua conta para acessar seus orçamentos e serviços.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="login-email">E-mail</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="login-email"
                                type="email"
                                placeholder="seu@email.com"
                                className="pl-10"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="login-password">Senha</Label>
                              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                Esqueceu a senha?
                              </Link>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="login-password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Entrando...' : 'Entrar'}
                          </Button>
                        </form>
                      </CardContent>
                      <CardFooter className="flex justify-center">
                        <p className="text-center text-sm text-gray-600">
                          Ainda não tem uma conta?{' '}
                          <button
                            onClick={() => setActiveTab('register')}
                            className="text-primary hover:underline font-medium"
                          >
                            Cadastre-se
                          </button>
                        </p>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="register" asChild>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Cadastro</CardTitle>
                        <CardDescription>
                          Crie sua conta para solicitar orçamentos ou oferecer serviços.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="register-name">Nome completo</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-name"
                                placeholder="Seu nome completo"
                                className="pl-10"
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="register-email">E-mail</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-email"
                                type="email"
                                placeholder="seu@email.com"
                                className="pl-10"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="register-phone">Telefone</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-phone"
                                placeholder="(00) 00000-0000"
                                className="pl-10"
                                value={registerPhone}
                                onChange={(e) => setRegisterPhone(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="register-password">Senha</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Tipo de conta</Label>
                            <div className="flex gap-4">
                              <div
                                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                                  registerRole === UserRole.CLIENT
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-primary/50'
                                }`}
                                onClick={() => setRegisterRole(UserRole.CLIENT)}
                              >
                                <div className="flex flex-col items-center text-center">
                                  <UserCircle className={`h-8 w-8 mb-2 ${
                                    registerRole === UserRole.CLIENT ? 'text-primary' : 'text-gray-400'
                                  }`} />
                                  <span className="font-medium">Cliente</span>
                                  <span className="text-xs text-gray-500">Solicitar serviços</span>
                                </div>
                              </div>
                              
                              <div
                                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                                  registerRole === UserRole.PROVIDER
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-primary/50'
                                }`}
                                onClick={() => setRegisterRole(UserRole.PROVIDER)}
                              >
                                <div className="flex flex-col items-center text-center">
                                  <Briefcase className={`h-8 w-8 mb-2 ${
                                    registerRole === UserRole.PROVIDER ? 'text-primary' : 'text-gray-400'
                                  }`} />
                                  <span className="font-medium">Prestador</span>
                                  <span className="text-xs text-gray-500">Oferecer serviços</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Criando conta...' : 'Criar conta'}
                          </Button>
                        </form>
                      </CardContent>
                      <CardFooter className="flex justify-center">
                        <p className="text-center text-sm text-gray-600">
                          Já tem uma conta?{' '}
                          <button
                            onClick={() => setActiveTab('login')}
                            className="text-primary hover:underline font-medium"
                          >
                            Faça login
                          </button>
                        </p>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
