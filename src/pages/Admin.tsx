
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

  // Atualizar dados do usuário ao carregar a página
  useEffect(() => {
    const updateUserData = async () => {
      console.log("Admin page - Refreshing user data");
      try {
        // Força a atualização do usuário para garantir que temos os dados mais recentes
        await refreshUser();
        
        if (user?.id) {
          // Verificar diretamente no banco de dados o papel atual do usuário
          console.log("Admin page - Checking user role in database for:", user.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user role:", error);
            setCurrentRole(user.role);
          } else if (profile) {
            console.log("Admin page - User role from database:", profile.role);
            setCurrentRole(profile.role);
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
    
  }, [refreshUser, user?.id]);

  // Show loading state while checking role
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

  // Redirect to login if not logged in
  if (!user) {
    console.log("Admin page - User not logged in, redirecting to login");
    toast.error("Você precisa estar logado para acessar esta página");
    return <Navigate to="/login" replace />;
  }
  
  // Check the role we got directly from the database
  const hasAdminAccess = currentRole === UserRole.ADMIN;
  
  // Redirect to homepage if not an admin
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
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span>Serviços</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>
        </Tabs>

        <Outlet />
      </div>
      
      <Footer />
    </div>
  );
};

export default Admin;
