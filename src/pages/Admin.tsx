
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Navigate, Outlet } from 'react-router-dom';
import UserManagement from '@/components/admin/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, LayoutGrid } from 'lucide-react';
import ServiceManagement from '@/components/admin/ServiceManagement';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Admin: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // Atualizar dados do usuário ao carregar a página e ajustar a sessão se necessário
  useEffect(() => {
    const updateUserData = async () => {
      console.log("Admin page - Refreshing user data");
      try {
        // Verificar se o usuário está logado
        if (user?.id) {
          console.log("Admin page - Checking user role via RPC for:", user.id);
          
          // Usar a função SECURITY DEFINER para verificar o papel do usuário
          const { data, error } = await supabase.rpc('get_user_role', {
            user_id: user.id
          });
          
          if (error) {
            console.error("Error fetching user role:", error);
            // Fallback para o papel do contexto do usuário
            setCurrentRole(user.role);
          } else {
            console.log("Admin page - User role from RPC:", data);
            // Armazenar o papel como uma string da chamada RPC
            setCurrentRole(data);
            
            // Verificar se o papel do contexto está desatualizado e atualizar se necessário
            if (data !== user.role) {
              console.log("Admin page - Role mismatch, refreshing user context");
              await refreshUser();
            }
          }
        } else {
          console.log("Admin page - No user ID available");
          setCurrentRole(null);
        }
      } catch (error) {
        console.error("Error updating user data:", error);
      } finally {
        setIsCheckingRole(false);
      }
    };
    
    updateUserData();
    
    // Log para depuração
    console.log("Admin page - Current user:", user);
    
  }, [refreshUser, user?.id, user?.role]);

  // Mostrar estado de carregamento enquanto verifica o papel
  if (isCheckingRole) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto py-8 flex items-center justify-center">
          <p>Verificando permissões de acesso...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Redirecionar para login se não estiver logado
  if (!user) {
    console.log("Admin page - User not logged in, redirecting to login");
    toast.error("Você precisa estar logado para acessar esta página");
    return <Navigate to="/login" replace />;
  }
  
  // Verificar o papel obtido diretamente da função RPC
  const hasAdminAccess = currentRole === UserRole.ADMIN;
  
  // Redirecionar para a página inicial se não for administrador
  if (!hasAdminAccess) {
    console.log("Access denied - User role:", currentRole, "Expected:", UserRole.ADMIN);
    toast.error("Você não tem permissão para acessar esta página");
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>
        
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span>Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>

        <Outlet />
      </div>
      
      <Footer />
    </div>
  );
};

export default Admin;
