
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';

const MakeAndreAdmin: React.FC = () => {
  const { makeAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    const findAndreUser = async () => {
      try {
        // Search for Andre's account
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email:id')
          .eq('id', 'ad9e2a2a-0a39-4e49-80b6-a5699ca6a866')
          .single();

        if (error) {
          console.error('Error finding Andre:', error);
          return;
        }

        if (data) {
          setAdminUser({
            id: data.id,
            email: 'pro.andresouza@gmail.com' // Hardcoded since we know this is Andre's email
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    findAndreUser();
  }, []);

  const handleMakeAdmin = async () => {
    if (!adminUser) return;
    
    setLoading(true);
    try {
      await makeAdmin(adminUser.id);
      toast.success(`Usuário ${adminUser.email} promovido a administrador com sucesso!`);
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error('Erro ao promover usuário a administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Promoção de Administrador</h1>
        
        {adminUser ? (
          <div className="space-y-6">
            <div className="p-4 border rounded-md bg-gray-50">
              <p className="font-medium">Email: {adminUser.email}</p>
              <p className="text-sm text-gray-500">ID: {adminUser.id}</p>
            </div>
            
            <Button 
              onClick={handleMakeAdmin} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? 'Processando...' : 'Promover a Administrador'}
            </Button>
          </div>
        ) : (
          <p className="text-center text-gray-500">Buscando usuário...</p>
        )}
      </div>
    </div>
  );
};

export default MakeAndreAdmin;
