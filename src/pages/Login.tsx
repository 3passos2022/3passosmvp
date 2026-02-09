import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserRole } from '@/lib/types';
import { User as UserIcon, Briefcase, ArrowRight, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import logoMenu from './../img/Logos/LogotipoHorizontal-08 20White.png';
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ } from '@/lib/utils';
import EmailConfirmationModal from '@/components/auth/EmailConfirmationModal';

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
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  isIndividualProvider: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.role === UserRole.CLIENT) {
    if (!data.cpf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF é obrigatório para clientes",
        path: ["cpf"],
      });
    } else if (!validateCPF(data.cpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF inválido",
        path: ["cpf"],
      });
    }
  }

  if (data.role === UserRole.PROVIDER) {
    if (data.isIndividualProvider) {
      if (!data.cpf) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF é obrigatório para prestadores autônomos",
          path: ["cpf"],
        });
      } else if (!validateCPF(data.cpf)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF inválido",
          path: ["cpf"],
        });
      }
    } else {
      if (!data.cnpj) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CNPJ é obrigatório para empresas",
          path: ["cnpj"],
        });
      } else if (!validateCNPJ(data.cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CNPJ inválido",
          path: ["cnpj"],
        });
      }
    }
  }
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Login: React.FC = () => {
  const { user, session, loading, signIn, signUp, isRecoveringPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const from = location.state?.from || "/";

  useEffect(() => {
    if (user && session && !isRecoveringPassword) {
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
      const selectedProviderId = sessionStorage.getItem('selectedProviderId');

      if (redirectAfterLogin) {
        sessionStorage.removeItem('redirectAfterLogin');

        if (selectedProviderId) {
          navigate(redirectAfterLogin, {
            state: {
              selectedProviderId,
              fromLogin: true
            }
          });
        } else {
          navigate(redirectAfterLogin);
        }
      } else {
        navigate(from);
      }
    }
  }, [user, session, navigate, from, isRecoveringPassword]);

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
      cpf: "",
      cnpj: "",
      isIndividualProvider: false,
    },
  });

  const selectedRole = signupForm.watch("role");
  const isIndividualProvider = signupForm.watch("isIndividualProvider");

  const handleLoginSubmit = async (formData: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast.error(`Erro ao fazer login: ${error.message}`);
      } else {
        toast.success("Login realizado com sucesso!");
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
      const { error } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        cpf: (formData.role === UserRole.CLIENT || (formData.role === UserRole.PROVIDER && formData.isIndividualProvider)) ? formData.cpf : undefined,
        cnpj: (formData.role === UserRole.PROVIDER && !formData.isIndividualProvider) ? formData.cnpj : undefined,
      });

      if (error) {
        toast.error(`Erro ao criar conta: ${error.message}`);
      } else {
        setConfirmationEmail(formData.email);
        setShowEmailConfirmationModal(true);
        signupForm.reset();
      }
    } catch (error) {
      toast.error("Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  if (!loading && user && session) {
    return null;
  }

  return (
    <div className="w-full lg:grid lg:grid-cols-2 min-h-screen">
      {/* Esquerda - Branding (Desktop) */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581094794329-cd1096a7a5e6?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>

        <div className="z-10">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <img src={logoMenu} alt="Logo" />
          </Link>
        </div>

        <div className="z-10 max-w-lg">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Conectando você aos melhores profissionais do mercado.
          </h1>
          <p className="text-lg text-zinc-300 mb-8">
            Simples, rápido e seguro. A plataforma ideal para quem busca serviços de qualidade e para quem quer crescer profissionalmente.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Verificação rigorosa</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Pagamento seguro</span>
            </div>
          </div>
        </div>

        <div className="z-10 text-zinc-400 text-sm">
          &copy; 2024 3Passos. Todos os direitos reservados.
        </div>
      </div>

      {/* Direita - Formulário */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-8 lg:p-12 bg-background">
        <div className="mx-auto w-full max-w-[450px] space-y-6">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="lg:hidden mx-auto mb-4">
              <Link to="/">
                <img src={logoMenu} alt="Logo" className="h-10" />
              </Link>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {activeTab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'login'
                ? 'Entre com suas credenciais para acessar sua conta'
                : 'Preencha os dados abaixo para começar gratuitamente'}
            </p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="login" asChild>
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input placeholder="seu@email.com" type="email" {...field} />
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
                            <div className="flex items-center justify-between">
                              <FormLabel>Senha</FormLabel>
                              <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                Esqueceu?
                              </Link>
                            </div>
                            <FormControl>
                              <Input placeholder="******" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                            Entrando...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            Entrar <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              </TabsContent>

              <TabsContent value="signup" asChild>
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={signupForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="João Silva" {...field} />
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
                                <Input placeholder="(11) 99999-9999" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input placeholder="seu@email.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Eu sou...</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                <FormItem>
                                  <FormControl>
                                    <RadioGroupItem value={UserRole.CLIENT} className="peer sr-only" />
                                  </FormControl>
                                  <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full">
                                    <UserIcon className="mb-3 h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                    <span className="font-semibold">Cliente</span>
                                    <span className="text-xs text-center text-muted-foreground mt-1">Quero contratar serviços</span>
                                  </FormLabel>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <RadioGroupItem value={UserRole.PROVIDER} className="peer sr-only" />
                                  </FormControl>
                                  <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full">
                                    <Briefcase className="mb-3 h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                    <span className="font-semibold">Prestador</span>
                                    <span className="text-xs text-center text-muted-foreground mt-1">Quero oferecer serviços</span>
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedRole === UserRole.CLIENT && (
                        <FormField
                          control={signupForm.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="000.000.000-00"
                                  {...field}
                                  onChange={(e) => field.onChange(formatCPF(e.target.value))}
                                  maxLength={14}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedRole === UserRole.PROVIDER && (
                        <div className="bg-muted/40 p-4 rounded-lg space-y-4 border border-border/50">
                          <FormField
                            control={signupForm.control}
                            name="isIndividualProvider"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-medium">
                                    Sou profissional autônomo
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    Não possuo CNPJ, usarei meu CPF
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />

                          {isIndividualProvider ? (
                            <FormField
                              control={signupForm.control}
                              name="cpf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CPF do Profissional</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="000.000.000-00"
                                      {...field}
                                      onChange={(e) => field.onChange(formatCPF(e.target.value))}
                                      maxLength={14}
                                      className="bg-background"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : (
                            <FormField
                              control={signupForm.control}
                              name="cnpj"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CNPJ da Empresa</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="00.000.000/0000-00"
                                      {...field}
                                      onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                                      maxLength={18}
                                      className="bg-background"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      )}

                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input placeholder="Crie uma senha forte" type="password" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Mínimo 8 caracteres, maiúscula, número e símbolo.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                            Criando conta...
                          </div>
                        ) : "Criar Conta e Começar"}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground px-8">
            Ao clicar em continuar, você concorda com nossos{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
      <EmailConfirmationModal
        isOpen={showEmailConfirmationModal}
        onClose={() => {
          setShowEmailConfirmationModal(false);
          setActiveTab("login");
          loginForm.setValue("email", confirmationEmail);
        }}
        email={confirmationEmail}
      />
    </div>
  );
};

export default Login;
