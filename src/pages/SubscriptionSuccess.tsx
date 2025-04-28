
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const SubscriptionSuccess: React.FC = () => {
  const { checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier');

  useEffect(() => {
    // Verificar a assinatura quando a página carregar
    const verifySubscription = async () => {
      if (checkSubscription) {
        await checkSubscription();
      }
    };
    
    verifySubscription();
  }, [checkSubscription]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-2">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-center text-2xl">Assinatura Confirmada!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p>
                    Parabéns! Sua assinatura do plano{' '}
                    <span className="font-semibold">
                      {tier === 'premium' ? 'Premium' : 'Básico'}
                    </span>{' '}
                    foi confirmada com sucesso.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Você já pode aproveitar todos os benefícios do seu novo plano.
                  </p>
                  
                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={() => navigate('/profile')}
                      className="w-full"
                    >
                      Ir para meu perfil
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/subscription')}
                      className="w-full"
                    >
                      Gerenciar assinatura
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubscriptionSuccess;
