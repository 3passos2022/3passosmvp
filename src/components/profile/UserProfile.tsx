
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@/lib/types';

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  
  // Log para debug do tipo de usuário
  useEffect(() => {
    if (user) {
      console.log('UserProfile - User data:', {
        role: user.role,
        roleType: typeof user.role,
        roleString: String(user.role).toLowerCase().trim(),
        isProvider: String(user.role).toLowerCase().trim() === String(UserRole.PROVIDER).toLowerCase().trim(),
        isAdmin: String(user.role).toLowerCase().trim() === String(UserRole.ADMIN).toLowerCase().trim(),
        userRoleEnum: UserRole.PROVIDER,
        userEnumStr: String(UserRole.PROVIDER).toLowerCase().trim()
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile({
        name,
        phone
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Perfil atualizado com sucesso');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setIsEditing(false);
  };

  if (!user) return null;

  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  // Helper para determinar o tipo de conta de forma mais robusta
  const getAccountType = () => {
    const role = String(user.role).toLowerCase().trim();
    const providerRole = String(UserRole.PROVIDER).toLowerCase().trim();
    const adminRole = String(UserRole.ADMIN).toLowerCase().trim();
    
    console.log('Checking account type:', {
      userRole: role,
      providerRole: providerRole,
      adminRole: adminRole,
      isProvider: role === providerRole,
      isAdmin: role === adminRole
    });
    
    if (role === providerRole) {
      return 'Prestador de Serviços';
    } else if (role === adminRole) {
      return 'Administrador';
    } else {
      return 'Cliente';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Minhas Informações</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url} alt={user.name || 'Avatar'} />
            <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name || 'Usuário'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{user.name || 'Não informado'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{user.email}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{user.phone || 'Não informado'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tipo de conta</p>
                <p className="font-medium">
                  {getAccountType()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor: {String(user.role)} | Enum: {String(UserRole.PROVIDER)} | 
                  Comparação: {String(user.role).toLowerCase().trim() === String(UserRole.PROVIDER).toLowerCase().trim() ? 'Igual' : 'Diferente'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar perfil</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserProfile;
