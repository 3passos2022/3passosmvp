
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { pageVariants } from '@/lib/animations';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ThankYou: React.FC = () => {
  const { user, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      // Se não houver usuário logado, redirecionamos para a página de login
      navigate('/login');
      return;
    }
    
    // Atualizar informações da assinatura quando a página carregar
    const updateSubscription = async () => {
      try {
        await refreshSubscription();
        toast.success("Informações de assinatura atualizadas com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar informações de assinatura:", error);
        toast.error("Não foi possível atualizar as informações de assinatura. Tente novamente mais tarde.");
      }
    };
    
    updateSubscription();
  }, [user, refreshSubscription, navigate]);
  
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Obrigado pela sua assinatura!</h1>
          
          <p className="text-gray-600 mb-8">
            Sua assinatura foi processada com sucesso. Agradecemos por confiar em nossos serviços!
          </p>
          
          <div className="space-y-4">
            <Link to="/profile">
              <Button className="w-full">Ir para Meu Perfil</Button>
            </Link>
            
            <Link to="/">
              <Button variant="outline" className="w-full">Voltar para Página Inicial</Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ThankYou;
