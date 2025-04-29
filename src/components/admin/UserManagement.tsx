
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
import { ProfileService } from '@/services/ProfileService';

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
      
      // Obter todos os perfis diretamente da tabela profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error('Erro ao carregar perfis:', profilesError);
        throw profilesError;
      }
      
      console.log('Perfis obtidos:', profiles?.length || 0);
      
      if (!profiles || profiles.length === 0) {
        // Tentar usar método alternativo se nenhum perfil for encontrado
        console.log('Tentando método alternativo: get_user_role_safely');
        
        // Verificar se o usuário atual é admin
        const { data: isAdmin } = await supabase.rpc('is_admin', {
          user_id: user?.id
        });
        
        if (!isAdmin) {
          toast.error('Você precisa ter permissões de administrador para ver usuários');
          setLoading(false);
          return;
        }
      }
      
      // Transformar os perfis no formato esperado pelo componente
      const usersWithEmails = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || profile.id, // Usar email do perfil ou ID como fallback
        name: profile.name || '',
        role: profile.role as UserRole,
        profileExists: true,
        created_at: profile.created_at || new Date().toISOString(),
      })) || [];
      
      // Obter emails diretamente da tabela de autenticação usando o serviço ProfileService
      // Isso faz uma chamada segura via RPC que só retorna se o usuário atual for admin
      try {
        for (const userItem of usersWithEmails) {
          if (userItem.email === userItem.id) {
            const userProfile = await ProfileService.getUserProfile(userItem.id, null, true);
            if (userProfile?.email && userProfile.email !== userItem.id) {
              userItem.email = userProfile.email;
            }
          }
        }
      } catch (error) {
        console.error('Erro ao obter emails dos usuários:', error);
        // Continuar mesmo se falhar a obtenção de emails
      }

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Falha ao carregar usuários. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (userId: string, userName: string = '') => {
    setCreatingProfile(userId);
    try {
      // Usar ProfileService para criar um perfil
      const profile = await ProfileService.createDefaultProfile(userId, userName || 'Usuário', UserRole.CLIENT);
      
      if (!profile) {
        throw new Error('Falha ao criar perfil');
      }
      
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
      console.error('Erro ao criar perfil:', error);
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
        // Se o perfil não existir, criar um perfil primeiro usando ProfileService
        await ProfileService.createDefaultProfile(userId, 'Usuário', UserRole.CLIENT);
      }
      
      // Promover o usuário a administrador
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
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
                      {RoleUtils.getAccountTypeLabel({
                        ...user, 
                        created_at: user.created_at || new Date().toISOString()
                      })}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default UserManagement;
