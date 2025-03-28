
import React, { useState, useEffect } from 'react';
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
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // O ID do usuário a ser promovido para administrador
  const userIdToPromote = '3fd93f8d-06a4-41db-98da-e84801a6bee8';
  const userName = 'André Souza Admin';
  const userEmail = 'pro.andresouza@gmail.com';

  // Verificar o papel atual do usuário ao carregar o componente
  useEffect(() => {
    async function checkCurrentRole() {
      try {
        // Verificar se o usuário existe na tabela profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('role, name, id')
          .eq('id', userIdToPromote)
          .maybeSingle();
        
        if (error) {
          console.error('Erro ao verificar papel:', error);
          setError(`Erro ao verificar o papel: ${error.message}`);
          return;
        }
        
        if (!data) {
          setError(`Usuário com ID ${userIdToPromote} não encontrado na tabela profiles.`);
          return;
        }
        
        console.log('Dados do perfil encontrados:', data);
        setCurrentRole(data.role);
        if (data.role === UserRole.ADMIN) {
          setSuccess(true);
        }
      } catch (error: any) {
        console.error('Erro ao verificar papel do usuário:', error);
        setError(`Erro inesperado: ${error.message}`);
      }
    }
    
    checkCurrentRole();
  }, [userIdToPromote]);

  const handleMakeAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Update the user's role in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ role: UserRole.ADMIN })
        .eq('id', userIdToPromote);
      
      if (error) throw error;
      
      toast.success('Usuário promovido a administrador com sucesso!');
      setSuccess(true);
      setCurrentRole(UserRole.ADMIN);
      
      // Atualize também o contexto de autenticação se o usuário atual for o promovido
      if (user && user.id === userIdToPromote) {
        await refreshUser();
        console.log('Dados do usuário atualizados após promoção:', user);
      }
    } catch (error: any) {
      console.error('Error making admin:', error);
      toast.error('Erro ao promover a administrador. Tente novamente.');
      setError(`Falha ao atualizar: ${error.message}`);
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
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}
            
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-lg">Sucesso!</h3>
                <p className="text-gray-600">
                  O usuário foi promovido a administrador e agora tem acesso ao painel administrativo.
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
                      <p className="font-medium">{userName}</p>
                      <p className="text-sm">Email: {userEmail}</p>
                      <p className="text-xs text-gray-500">ID: {userIdToPromote}</p>
                      {currentRole && (
                        <p className="text-xs bg-gray-200 inline-block px-2 py-1 rounded-full mt-1">
                          Papel atual: {currentRole}
                        </p>
                      )}
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
                  disabled={loading || currentRole === UserRole.ADMIN} 
                  className="w-full"
                >
                  {loading ? 'Processando...' : 
                   currentRole === UserRole.ADMIN ? 'Usuário já é Administrador' : 
                   'Promover a Administrador'}
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
