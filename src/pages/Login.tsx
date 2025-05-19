
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import SignInCard from '@/components/ui/sign-in-card';
import SignUpCard from '@/components/ui/sign-up-card';

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

  const handleLoginSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
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

  const handleSignupSubmit = async (name: string, email: string, phone: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, role);

      if (error) {
        toast.error(`Erro ao criar conta: ${error.message}`);
      } else {
        toast.success(
          "Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro."
        );
        
        setActiveTab("login");
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
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/40 via-purple-700/50 to-black" />
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-purple-400/20 blur-[80px]" />
      <motion.div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-purple-300/20 blur-[60px]"
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />
      <motion.div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-purple-400/20 blur-[60px]"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1
        }}
      />

      {/* Animated glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse opacity-40" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000 opacity-40" />

      <main className="flex-1 flex items-center justify-center p-4 z-10">
        {activeTab === "login" ? (
          <SignInCard 
            onLogin={handleLoginSubmit} 
            onSignupClick={() => setActiveTab("signup")}
            isLoading={isLoading}
          />
        ) : (
          <SignUpCard
            onSignUp={handleSignupSubmit}
            onLoginClick={() => setActiveTab("login")}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
};

export default Login;
