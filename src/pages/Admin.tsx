
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import UserManagement from '@/components/admin/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, LayoutGrid } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();

  // Redirect to homepage if not an admin
  if (!user || user.role !== UserRole.ADMIN) {
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
            <Routes>
              <Route index element={<UserManagement />} />
            </Routes>
          </TabsContent>
          
          <TabsContent value="services">
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">Gerenciamento de Serviços</h3>
              <p className="text-gray-500">
                Funcionalidade em desenvolvimento. Em breve você poderá gerenciar os serviços da plataforma aqui.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Outlet />
      </div>
      
      <Footer />
    </div>
  );
};

export default Admin;
