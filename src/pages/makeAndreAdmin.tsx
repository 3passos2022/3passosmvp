
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MakeAndreAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user by email first
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) throw userError;

      const targetUser = userData.users.find(user => user.email === 'pro.andresouza@gmail.com');
      
      if (!targetUser) {
        throw new Error('Usuário não encontrado');
      }

      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: UserRole.ADMIN })
        .eq('id', targetUser.id);
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      toast.success('Usuário pro.andresouza@gmail.com agora é administrador!');
    } catch (err: any) {
      console.error('Error making admin:', err);
      setError(err.message || 'Erro ao promover usuário');
      toast.error(err.message || 'Erro ao promover usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Promover Admin</h1>
        
        {success ? (
          <div className="bg-green-50 p-4 rounded-md text-green-700 mb-4">
            Usuário pro.andresouza@gmail.com foi promovido a administrador com sucesso!
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
                {error}
              </div>
            )}
            
            <p className="mb-4">
              Esta página irá promover o usuário pro.andresouza@gmail.com a administrador
              do sistema. Clique no botão abaixo para continuar.
            </p>
            
            <Button 
              className="w-full" 
              onClick={makeAdmin}
              disabled={loading}
            >
              {loading ? "Processando..." : "Promover a Admin"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MakeAndreAdmin;
