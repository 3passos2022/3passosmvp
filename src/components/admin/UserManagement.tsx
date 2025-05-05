
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProfileService } from '@/services/ProfileService';
import UsersList from './UsersList';

interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileExists: boolean;
  created_at: string;
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
      console.log('Carregando usuários...');
      
      // Verificar se o usuário atual é admin
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin_user', {
        user_id: user?.id
      });
      
      if (adminCheckError || !isAdmin) {
        console.error('Erro ou usuário não é admin:', adminCheckError);
        toast.error('Você precisa ter permissões de administrador para ver usuários');
        setLoading(false);
        return;
      }
      
      // Obter todos os perfis usando o ProfileService que agora usa a política correta
      const profiles = await ProfileService.getAllProfiles();
      console.log('Perfis obtidos:', profiles?.length || 0);
      
      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      // Transformar os perfis no formato esperado pelo componente
      const usersWithEmails = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || profile.id, // Usar email do perfil ou ID como fallback
        name: profile.name || '',
        role: profile.role,
        profileExists: true,
        created_at: profile.created_at || new Date().toISOString(),
      }));
      
      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Falha ao carregar usuários. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
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
        // Se o perfil não existir, criar um perfil primeiro usando ProfileService
        setCreatingProfile(userId);
        await ProfileService.createDefaultProfile(userId, 'Usuário', UserRole.CLIENT);
        setCreatingProfile(null);
      }
      
      // Promover o usuário a administrador usando a nova função de makeAdmin que usa a política correta
      const result = await ProfileService.makeAdmin(user?.id || '', userId);
      
      if (result.error) {
        throw result.error;
      }
      
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
      console.error('Erro ao promover usuário:', error);
      toast.error('Falha ao promover usuário a administrador.');
    } finally {
      setPromoting(null);
    }
  };

  const isPromoting = (userId: string): boolean => promoting === userId;
  const isCreatingProfile = (userId: string): boolean => creatingProfile === userId;

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      String(user.role)?.toLowerCase().includes(searchLower)
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
        filteredUsers.length > 0 ? (
          <UsersList 
            users={filteredUsers} 
            onPromoteUser={handleMakeAdmin}
            isPromoting={isPromoting}
            isCreatingProfile={isCreatingProfile}
          />
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">Nenhum usuário encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">
              Verifique se você tem permissões de administrador para ver usuários.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default UserManagement;
