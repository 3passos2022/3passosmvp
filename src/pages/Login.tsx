
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserRole } from '@/lib/types';
import { User as UserIcon, Briefcase } from 'lucide-react';
import logoMenu from './../img/Logos/LogotipoHorizontalPreto.png'

const loginSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um e-mail válido",
  }),
  password: z.string().min(1, { message: "A senha é obrigatória" }),
});

const signupSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres",
  }),
  email: z.string().email({
    message: "Por favor, insira um e-mail válido",
  }),
  phone: z.string().min(10, {
    message: "Por favor, insira um telefone válido",
  }).optional(),
  password: z.string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" })
    .regex(/[^A-Za-z0-9]/, { message: "A senha deve conter pelo menos um caractere especial" }),
  role: z.enum([UserRole.CLIENT, UserRole.PROVIDER], {
    message: "Selecione o tipo de conta",
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Login: React.FC = () => {
  const { user, session, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Obter caminho de redirecionamento
  const from = location.state?.from || "/";
  
  useEffect(() => {
    if (user && session) {
      // Verificar se há um redirecionamento pós-login no sessionStorage
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
      const selectedProviderId = sessionStorage.getItem('selectedProviderId');

      if (redirectAfterLogin) {
        // Limpar o redirecionamento da sessionStorage
        sessionStorage.removeItem('redirectAfterLogin');
        
        // Verificar se há um ID de prestador selecionado
        if (selectedProviderId) {
          // Redirecionar com o estado do provedor
          navigate(redirectAfterLogin, { 
            state: { 
              selectedProviderId,
              fromLogin: true 
            } 
          });
          // Não limpar o selectedProviderId aqui, deixar para o componente de destino
        } else {
          // Simples redirecionamento sem estado
          navigate(redirectAfterLogin);
        }
      } else {
        // Redirecionamento padrão
        navigate(from);
      }
    }
  }, [user, session, navigate, from]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: UserRole.CLIENT,
    },
  });

  const handleLoginSubmit = async (formData: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast.error(`Erro ao fazer login: ${error.message}`);
      } else {
        toast.success("Login realizado com sucesso!");
        
        // Não é necessário redirecionar aqui, o useEffect cuidará disso
      }
    } catch (error) {
      toast.error("Erro inesperado ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (formData: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData.role);

      if (error) {
        toast.error(`Erro ao criar conta: ${error.message}`);
      } else {
        toast.success(
          "Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro."
        );
        
        setActiveTab("login");
        loginForm.setValue("email", formData.email);
        signupForm.reset();
      }
    } catch (error) {
      toast.error("Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirecionar se já estiver logado
  if (!loading && user && session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
                 <img src={logoMenu} id="logoMenu" alt="Logo" className="h-8" />
            </Link>
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Entrar</CardTitle>
                  <CardDescription>
                    Entre com sua conta para acessar o sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="seu@email.com"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Sua senha"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("signup")}
                    className="text-sm"
                  >
                    Não tem uma conta? Crie agora
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Conta</CardTitle>
                  <CardDescription>
                    Preencha os dados para criar sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...signupForm}>
                    <form
                      onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Seu nome completo"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="seu@email.com"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(00) 00000-0000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Sua senha"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Tipo de Conta</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                <div>
                                  <RadioGroupItem
                                    value={UserRole.CLIENT}
                                    id="client"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="client"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-muted-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <UserIcon className="mb-2 h-6 w-6" />
                                    Cliente
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem
                                    value={UserRole.PROVIDER}
                                    id="provider"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="provider"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-muted-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <Briefcase className="mb-2 h-6 w-6" />
                                    Prestador
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Criando conta..." : "Criar Conta"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("login")}
                    className="text-sm"
                  >
                    Já tem uma conta? Entre agora
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;
