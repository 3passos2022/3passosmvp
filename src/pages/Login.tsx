
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { UserRole } from "@/lib/types";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Schemas for validation
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  phone: z.string().optional(),
  role: z.enum(["client", "provider"]),
});

const Login = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the return path from location state if exists
  const returnTo = location.state?.returnTo || '/';

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(returnTo, { replace: true });
    }
  }, [user, navigate, returnTo]);

  // Login form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Register form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "client",
    },
  });

  const onLogin = async (data) => {
    try {
      await signIn(data.email, data.password);
      // Will automatically redirect via the useEffect above
    } catch (error) {
      toast.error("Falha ao fazer login. Verifique suas credenciais.");
    }
  };

  const onRegister = async (data) => {
    try {
      await signUp(data.email, data.password, {
        name: data.name,
        role: data.role,
        phone: data.phone || "",
      });
      toast.success("Conta criada com sucesso! Por favor, faça login.");
      setActiveTab("login");
    } catch (error) {
      toast.error("Erro ao criar conta. Este e-mail já está em uso ou houve um problema com o servidor.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-center mb-6">Bem-vindo(a)</h1>
            
            <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      {...loginRegister("email")} 
                    />
                    {loginErrors.email && (
                      <p className="text-sm text-red-500">{loginErrors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="******" 
                      {...loginRegister("password")} 
                    />
                    {loginErrors.password && (
                      <p className="text-sm text-red-500">{loginErrors.password.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    type="submit" 
                    disabled={isLoginSubmitting}
                  >
                    {isLoginSubmitting ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input 
                      id="name" 
                      placeholder="Seu nome" 
                      {...registerRegister("name")} 
                    />
                    {registerErrors.name && (
                      <p className="text-sm text-red-500">{registerErrors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-mail</Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      {...registerRegister("email")} 
                    />
                    {registerErrors.email && (
                      <p className="text-sm text-red-500">{registerErrors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input 
                      id="phone" 
                      placeholder="(00) 00000-0000" 
                      {...registerRegister("phone")} 
                    />
                    {registerErrors.phone && (
                      <p className="text-sm text-red-500">{registerErrors.phone.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="******" 
                      {...registerRegister("password")} 
                    />
                    {registerErrors.password && (
                      <p className="text-sm text-red-500">{registerErrors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Você é:</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:border-primary transition-colors">
                        <input 
                          type="radio" 
                          value="client" 
                          {...registerRegister("role")} 
                          className="rounded-full text-primary" 
                        />
                        <span>Cliente</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:border-primary transition-colors">
                        <input 
                          type="radio" 
                          value="provider" 
                          {...registerRegister("role")} 
                          className="rounded-full text-primary" 
                        />
                        <span>Prestador</span>
                      </label>
                    </div>
                    {registerErrors.role && (
                      <p className="text-sm text-red-500">{registerErrors.role.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    type="submit" 
                    disabled={isRegisterSubmitting}
                  >
                    {isRegisterSubmitting ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
