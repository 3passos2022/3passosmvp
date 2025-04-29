
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { RoleUtils } from '@/lib/utils/RoleUtils';

interface UserListProps {
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    profileExists: boolean;
    created_at: string;
  }>;
  onPromoteUser: (userId: string) => void;
  isPromoting: (userId: string) => boolean;
  isCreatingProfile: (userId: string) => boolean;
}

const UsersList: React.FC<UserListProps> = ({ 
  users, 
  onPromoteUser, 
  isPromoting, 
  isCreatingProfile 
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">Nenhum usuário encontrado.</p>
        <p className="text-sm text-gray-400 mt-2">
          Verifique se você tem permissões de administrador para ver usuários.
        </p>
      </div>
    );
  }
  
  return (
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
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium truncate max-w-[100px]" title={user.id}>
              {user.id}
            </TableCell>
            <TableCell>{user.name || 'Sem nome'}</TableCell>
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
                  onClick={() => onPromoteUser(user.id)}
                  disabled={isPromoting(user.id) || isCreatingProfile(user.id)}
                >
                  {isPromoting(user.id) ? 'Processando...' : 
                   isCreatingProfile(user.id) ? 'Criando perfil...' : 
                   'Promover a Admin'}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UsersList;
