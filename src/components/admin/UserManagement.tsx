
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole } from '@/lib/types';
import { Search, UserCheck } from 'lucide-react';

interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { makeAdmin } = useAuth();

  const loadUsers = async (search: string = '') => {
    try {
      setSearching(true);
      let query = supabase
        .from('profiles')
        .select('id, name, role')
        .neq('role', UserRole.ADMIN);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Limit to 10 users if no search term
      if (!search) {
        query = query.limit(10);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // For each user, fetch their email from auth.users
      const userPromises = data.map(async (profile) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (userError || !userData) {
          console.error('Error fetching user email:', userError);
          return {
            ...profile,
            email: 'Email não disponível'
          };
        }

        return {
          ...profile,
          email: userData.user.email || 'Email não disponível'
        };
      });

      const usersWithEmail = await Promise.all(userPromises);
      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    loadUsers(searchTerm);
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      setLoading(true);
      await makeAdmin(userId);
      // Refresh users list
      await loadUsers(searchTerm);
    } catch (error) {
      console.error('Error making user admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="search-user">Buscar usuário</Label>
              <Input
                id="search-user"
                placeholder="Nome do usuário"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-1" /> Buscar
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Usuários</h3>
            
            {users.length === 0 ? (
              <p className="text-gray-500 text-center p-4">
                {searching ? 'Buscando usuários...' : 'Nenhum usuário encontrado'}
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        {user.role === UserRole.CLIENT ? 'Cliente' : 'Prestador'}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleMakeAdmin(user.id)}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                    >
                      <UserCheck className="h-4 w-4 mr-1" /> Tornar Administrador
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
