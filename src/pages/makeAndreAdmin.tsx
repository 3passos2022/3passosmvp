import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const MakeAndreAdmin: React.FC = () => {
  const { user, makeAdmin, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [success, setSuccess] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  const userIdToPromote = 'e8bcccb9-d1ba-494f-bfe8-9b9e9c8da5ca';

  useEffect(() => {
    async function checkUserProfile() {
      setCheckingProfile(true);
      try {
        console.log('Verificando perfil do usuário:', userIdToPromote);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, name, id')
          .eq('id', userIdToPromote)
          .maybeSingle();
        
        if (profileError) {
          console.error('Erro ao verificar perfil:', profileError);
          setError(`Erro ao verificar o perfil: ${profileError.message}`);
          setProfileExists(false);
          setCheckingProfile(false);
          return;
        }
        
        if (!profile) {
          console.log('Perfil não encontrado, será necessário criar um');
          setProfileExists(false);
          setCheckingProfile(false);
          return;
        }
        
        console.log('Perfil encontrado:', profile);
        setProfileExists(true);
        setCurrentRole(profile.role);
        if (profile.role === UserRole.ADMIN) {
          setSuccess(true);
        }
      } catch (error: any) {
        console.error('Erro ao verificar perfil do usuário:', error);
        setError(`Erro inesperado: ${error.message}`);
        setProfileExists(false);
      } finally {
        setCheckingProfile(false);
      }
    }
    
    checkUserProfile();
  }, [userIdToPromote]);

  const handleCreateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Criando perfil para usuário:', userIdToPromote);
      
      const { data, error } = await supabase.rpc('create_user_profile', { 
        user_id: userIdToPromote,
        user_name: 'André Souza',
        user_role: UserRole.PROVIDER
      });
      
      if (error) {
        console.error('Erro ao criar perfil:', error);
        throw error;
      }
      
      toast.success('Perfil criado com sucesso!');
      setProfileExists(true);
      setCurrentRole(UserRole.PROVIDER);
      
    } catch (error: any) {
      console.error('Erro ao criar perfil:', error);
      toast.error('Falha ao criar perfil. Tente novamente.');
      setError(`Falha ao criar perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Promovendo usuário a admin:', userIdToPromote);
      
      if (!profileExists) {
        throw new Error('É necessário criar um perfil primeiro');
      }
      
      const { error } = await supabase.rpc('update_user_role', { 
        user_id: userIdToPromote,
        new_role: UserRole.ADMIN
      });
      
      if (error) throw error;
      
      toast.success('Usuário promovido a administrador com sucesso!');
      setSuccess(true);
      setCurrentRole(UserRole.ADMIN);
      
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

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto p-8 flex flex-col items-center justify-center">
          <Card className="max-w-md w-full shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Verificando perfil do usuário...</CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

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
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
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
                      <p className="font-medium">André Souza</p>
                      <p className="text-sm">Email: pro.andresouza@gmail.com</p>
                      <p className="text-xs text-gray-500">ID: {userIdToPromote}</p>
                      <p className="text-sm mt-2">
                        Status do perfil: {profileExists ? (
                          <span className="text-green-600 font-medium">Perfil encontrado</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Perfil não encontrado</span>
                        )}
                      </p>
                      {currentRole && (
                        <p className="text-sm">
                          Função atual: <span className="font-medium">{currentRole}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {!profileExists ? (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                      <p>É necessário criar um perfil para este usuário antes de promovê-lo a administrador.</p>
                    </div>
                    <Button 
                      onClick={handleCreateProfile} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Criando perfil...' : 'Criar perfil para usuário'}
                    </Button>
                  </>
                ) : (
                  <>
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
