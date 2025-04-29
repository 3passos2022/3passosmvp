
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { pageVariants } from '@/lib/animations';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SubscriptionSuccess: React.FC = () => {
  const { refreshSubscription } = useAuth();
  
  useEffect(() => {
    // Delay the subscription check to ensure auth is initialized
    const timer = setTimeout(() => {
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
    }, 1000); // Delay subscription check by 1 second
    
    return () => clearTimeout(timer);
  }, [refreshSubscription]);
  
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
          
          <h1 className="text-2xl font-bold mb-2">Assinatura Confirmada!</h1>
          
          <p className="text-gray-600 mb-8">
            Sua assinatura foi processada com sucesso. Obrigado por se tornar um membro premium!
          </p>
          
          <div className="space-y-4">
            <Link to="/">
              <Button className="w-full">Voltar para Início</Button>
            </Link>
            
            <Link to="/profile">
              <Button variant="outline" className="w-full">Ver Minha Conta</Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default SubscriptionSuccess;
