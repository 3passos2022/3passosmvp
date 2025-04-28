
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const SubscriptionCancel: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-2">
                  <XCircle className="h-16 w-16 text-gray-400" />
                </div>
                <CardTitle className="text-center text-2xl">Assinatura Cancelada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p>
                    O processo de assinatura foi cancelado.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nenhum valor foi cobrado. Você pode tentar novamente quando quiser.
                  </p>
                  
                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={() => navigate('/subscription')}
                      className="w-full"
                    >
                      Voltar para planos
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/')}
                      className="w-full"
                    >
                      Ir para página inicial
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

export default SubscriptionCancel;
