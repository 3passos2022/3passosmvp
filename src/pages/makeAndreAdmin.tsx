
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Shield, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const MakeAndreAdmin: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMakeAdmin = async () => {
    setLoading(true);
    try {
      // André's user ID
      const andreId = '3fd93f8d-06a4-41db-98da-e84801a6bee8';
      
      // Directly update the user's role in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ role: UserRole.ADMIN })
        .eq('id', andreId);
      
      if (error) throw error;
      
      toast.success('André promovido a administrador com sucesso!');
      setSuccess(true);
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error('Erro ao promover a administrador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto p-8 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Promoção de Administrador</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-4">
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-lg">Sucesso!</h3>
                <p className="text-gray-600">
                  André foi promovido a administrador e agora tem acesso ao painel administrativo.
                </p>
              </div>
            ) : (
              <>
                <Card className="bg-gray-50 border">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserCircle className="h-5 w-5 text-primary" />
                      Usuário para promover
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-1">
                      <p className="font-medium">André Souza</p>
                      <p className="text-sm">Email: pro.andresouza@gmail.com</p>
                      <p className="text-xs text-gray-500">ID:</p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                  <p>Esta ação irá conceder ao usuário permissões de administrador na plataforma, 
                  o que inclui acesso ao painel administrativo e a capacidade de gerenciar usuários 
                  e serviços.</p>
                </div>
                
                <Button 
                  onClick={handleMakeAdmin} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading ? 'Processando...' : 'Promover a Administrador'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default MakeAndreAdmin;
