
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

const MakeAndreAdmin: React.FC = () => {
  const { makeAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleMakeAdmin = async () => {
    setLoading(true);
    try {
      // André's user ID
      const andreId = 'ad9e2a2a-0a39-4e49-80b6-a5699ca6a866';
      
      await makeAdmin(andreId);
      toast.success('André promovido a administrador com sucesso!');
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error('Erro ao promover a administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Promoção de Administrador</h1>
        
        <div className="space-y-6">
          <Card className="p-4 bg-gray-50">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-6 w-6 text-primary" />
                Usuário para promover
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="font-medium">Email: pro.andresouza@gmail.com</p>
              <p className="text-sm text-gray-500">ID: ad9e2a2a-0a39-4e49-80b6-a5699ca6a866</p>
            </CardContent>
          </Card>
          
          <Button 
            onClick={handleMakeAdmin} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Processando...' : 'Promover a Administrador'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MakeAndreAdmin;
