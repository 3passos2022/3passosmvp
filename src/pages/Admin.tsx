
import React, { useEffect } from 'react';
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

const Admin: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Atualizar dados do usuário ao carregar a página
  useEffect(() => {
    const updateUserData = async () => {
      await refreshUser();
    };
    
    updateUserData();
    
    // Log para depuração
    console.log("Admin page - Current user:", user);
  }, [refreshUser]);

  // Redirect to login if not logged in
  if (!user) {
    toast.error("Você precisa estar logado para acessar esta página");
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to homepage if not an admin
  if (user.role !== UserRole.ADMIN) {
    console.log("Access denied - User role:", user.role);
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
