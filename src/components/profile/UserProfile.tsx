import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleUtils } from '@/lib/utils/RoleUtils';
import ProfileImageEditor from './ProfileImageEditor';
import { supabase } from '@/integrations/supabase/client';

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
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
      
      if (email !== user.email) {
        setEmailLoading(true);
        const { error: emailError } = await supabase.auth.updateUser({ email });
        setEmailLoading(false);
        if (emailError) throw emailError;
        toast.success('E-mail atualizado! Verifique seu novo e-mail para confirmar a alteração.');
      } else {
        toast.success('Perfil atualizado com sucesso');
      }
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
      setEmailLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setIsEditing(false);
  };
  
  const handleSaveImage = async (imageData: string) => {
    setLoading(true);
    try {
      const { error } = await updateProfile({
        avatar_url: imageData
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setLoading(false);
    }
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
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Minhas Informações</h2>
      </div>

      <Card>
        <br></br>
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
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              {email !== user.email && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha atual (necessária para alterar o e-mail)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                  />
                </div>
              )}
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
                <p className="font-medium">{RoleUtils.getAccountTypeLabel(user)}</p>
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
      
      <ProfileImageEditor
        open={isImageEditorOpen}
        onClose={() => setIsImageEditorOpen(false)}
        onSave={handleSaveImage}
        initialImage={user.avatar_url}
      />
    </div>
  );
};

export default UserProfile;
