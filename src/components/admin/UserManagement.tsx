
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RoleUtils } from '@/lib/utils/RoleUtils';

interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileExists: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [promoting, setPromoting] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState<string | null>(null);
  const { makeAdmin, user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Usar a função SECURITY DEFINER para garantir que não teremos o erro de recursão infinita
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear perfis para formato UserListItem
      const usersWithEmails = data?.map(profile => ({
        id: profile.id,
        email: profile.id, // Padrão para ID
        name: profile.name || '',
        role: profile.role as UserRole,
        profileExists: true,
      })) || [];
      
      // Atualizar email codificado para seu usuário específico
      const andreUser = usersWithEmails.find(user => 
        user.id === '9bbc7e62-df90-45ff-bf9e-edb0738fb4b9'
      );
      
      if (andreUser) {
        andreUser.email = 'pro.andresouza@gmail.com';
      }

      setUsers(usersWithEmails);
    } catch (error) {
      toast.error('Falha ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (userId: string, userName: string = '') => {
    setCreatingProfile(userId);
    try {
      // Usar uma função de service role via RPC para criar um perfil
      const { error } = await supabase.rpc('create_user_profile', { 
        user_id: userId,
        user_name: userName || 'Usuário',
        user_role: UserRole.CLIENT
      });
      
      if (error) throw error;
      
      toast.success('Perfil criado com sucesso!');
      
      // Atualizar a lista local
      setUsers(users.map(user => 
        user.id === userId 
          ? {...user, profileExists: true, role: UserRole.CLIENT} 
          : user
      ));
      
      // Recarregar a lista após um pequeno atraso
      setTimeout(loadUsers, 500);
    } catch (error) {
      toast.error('Falha ao criar perfil para o usuário.');
    } finally {
      setCreatingProfile(null);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    setPromoting(userId);
    try {
      // Verificar se o perfil existe antes de promover
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (!profile) {
        // Se o perfil não existir, criar um perfil primeiro usando a RPC
        const { error: createError } = await supabase.rpc('create_user_profile', { 
          user_id: userId,
          user_name: 'Usuário',
          user_role: UserRole.CLIENT
        });
        
        if (createError) throw createError;
      }
      
      // Promover o usuário a administrador
      await makeAdmin(userId);
      toast.success('Usuário promovido a administrador com sucesso!');
      
      // Atualizar a lista de usuários local
      setUsers(users.map(user => 
        user.id === userId 
          ? {...user, role: UserRole.ADMIN} 
          : user
      ));

      // Recarregar a lista após um pequeno atraso
      setTimeout(loadUsers, 500);
    } catch (error) {
      toast.error('Falha ao promover usuário a administrador.');
    } finally {
      setPromoting(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Procurar usuários por nome, email ou função..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
        <Table>
          <TableCaption>Lista de usuários cadastrados no sistema.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === UserRole.ADMIN 
                      ? 'bg-purple-100 text-purple-800' 
                      : user.role === UserRole.PROVIDER
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {RoleUtils.getAccountTypeLabel({...user, email: user.email})}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {user.role !== UserRole.ADMIN && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMakeAdmin(user.id)}
                      disabled={promoting === user.id || creatingProfile === user.id}
                    >
                      {promoting === user.id ? 'Processando...' : 
                       creatingProfile === user.id ? 'Criando perfil...' : 
                       'Promover a Admin'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default UserManagement;
