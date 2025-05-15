import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/lib/types';
import { toast } from 'sonner';

// Cache para perfis
const profileCache = new Map<string, {
  profile: UserProfile,
  timestamp: number
}>();

// Tempo de expiração do cache (10 minutos)
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Mapeia role string do banco para enum UserRole
 */
export const mapDatabaseRoleToEnum = (role: string): UserRole => {
  if (!role) return UserRole.CLIENT;
  
  const roleString = String(role).toLowerCase().trim();
  
  switch(roleString) {
    case 'provider':
      return UserRole.PROVIDER;
    case 'admin':
      return UserRole.ADMIN;
    default:
      return UserRole.CLIENT;
  }
};

/**
 * Transforma dados do banco em UserProfile
 */
export const transformDatabaseProfile = (
  profileData: any, 
  email: string | null = null
): UserProfile => {
  const userRole = mapDatabaseRoleToEnum(profileData.role);
  
  return {
    id: profileData.id,
    email: email || profileData.email || profileData.id,
    role: userRole,
    name: profileData.name || undefined,
    avatar_url: profileData.avatar_url || undefined,
    address: profileData.address || undefined,
    phone: profileData.phone || undefined,
    created_at: profileData.created_at || new Date().toISOString(),
    subscribed: profileData.subscribed || false,
    subscription_tier: profileData.subscription_tier || 'free',
    subscription_end: profileData.subscription_end || null
  };
};

/**
 * Verifica se usuário tem role específica
 */
export const hasRole = (user: UserProfile | null, role: UserRole | string): boolean => {
  if (!user) return false;
  
  const userRoleStr = String(user.role).toLowerCase().trim();
  const checkRoleStr = String(role).toLowerCase().trim();
  
  return userRoleStr === checkRoleStr;
};

/**
 * Serviço para operações com perfis
 */
export class ProfileService {
  /**
   * Obtém perfil do usuário por ID
   */
  static async getUserProfile(userId: string, email: string | null = null, forceRefresh = false): Promise<UserProfile | null> {
    if (!userId) {
      console.log('getUserProfile: userId é nulo');
      return null;
    }
    
    // Verificar cache primeiro
    if (!forceRefresh) {
      const cached = profileCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.profile;
      }
    }
    
    try {
      console.log(`Tentando obter perfil para userId: ${userId}`);
      
      // Obter role usando função security definer
      const { data: role, error: roleError } = await supabase
        .rpc('get_role_for_user', { user_id: userId });
      
      if (roleError) {
        console.error('Erro ao obter role do usuário via RPC:', roleError);
      }
      
      // Obter perfil diretamente, sem usar o RLS recursivo
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao obter perfil do usuário via tabela profiles:', error);
        
        // Criar perfil mínimo se outras abordagens falharem
        if (email) {
          console.log('Criando perfil mínimo para usuário com email:', email);
          
          const minimalProfile: UserProfile = {
            id: userId,
            email: email,
            role: UserRole.CLIENT,
            created_at: new Date().toISOString(),
            subscribed: false,
            subscription_tier: 'free',
            subscription_end: null
          };
          
          profileCache.set(userId, {
            profile: minimalProfile,
            timestamp: Date.now()
          });
          
          return minimalProfile;
        }
        
        return null;
      }
      
      if (!profileData) {
        console.log(`Nenhum perfil encontrado para userId: ${userId}`);
        return null;
      }
      
      console.log(`Perfil encontrado para userId: ${userId}`, profileData);
      
      // Se temos dados de role da função secure e é diferente, usar esse
      if (role && profileData.role !== role) {
        console.log(`Atualizando role de ${profileData.role} para ${role}`);
        profileData.role = role;
      }
      
      // Transformar e armazenar em cache
      const profile = transformDatabaseProfile(profileData, email);
      profileCache.set(userId, {
        profile,
        timestamp: Date.now()
      });
      
      return profile;
    } catch (error) {
      console.error('Erro em getUserProfile:', error);
      return null;
    }
  }
  
  /**
   * Cria perfil padrão para usuário
   */
  static async createDefaultProfile(userId: string, email: string, role: UserRole = UserRole.CLIENT): Promise<UserProfile | null> {
    try {
      console.log(`Criando perfil padrão para userId: ${userId}, email: ${email}, role: ${role}`);
      
      const defaultName = email?.split('@')[0] || 'User';
      const roleString = String(role).toLowerCase();
      
      // Criar perfil no banco usando inserção direta
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: defaultName,
          role: roleString,
          email: email
        });
          
      if (error) {
        console.error('Erro ao criar perfil:', error);
        return null;
      }
      
      console.log('Perfil criado com sucesso, obtendo perfil atualizado');
      
      // Limpar cache para garantir que dados novos sejam obtidos
      profileCache.delete(userId);
      
      // Obter o perfil recém-criado
      return await this.getUserProfile(userId, email, true);
    } catch (error) {
      console.error('Erro em createDefaultProfile:', error);
      return null;
    }
  }
  
  /**
   * Atualiza perfil do usuário
   */
  static async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ error: Error | null, data: any }> {
    try {
      console.log(`Atualizando perfil para userId: ${userId}`, data);
      
      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { error, data: null };
      }

      // Invalidar cache
      profileCache.delete(userId);
      
      return { data: updatedData, error: null };
    } catch (error) {
      console.error('Erro em updateProfile:', error);
      return { error: error as Error, data: null };
    }
  }
  
  /**
   * Torna usuário admin
   */
  static async makeAdmin(adminUserId: string, targetUserId: string): Promise<{ error: Error | null, data: any }> {
    try {
      console.log(`Tornando usuário admin: targetUserId=${targetUserId}, por adminUserId=${adminUserId}`);
      
      // Verificar se usuário é admin usando função security definer
      const { data: isAdmin, error: roleCheckError } = await supabase.rpc('is_admin_user', {
        user_id: adminUserId
      });
      
      if (roleCheckError || !isAdmin) {
        console.error('Erro na verificação de admin:', roleCheckError);
        return { error: new Error('Unauthorized - Not an admin'), data: null };
      }

      // Atualizar role do usuário diretamente no banco
      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', targetUserId);

      if (error) {
        console.error('Erro ao atualizar role do usuário:', error);
        return { error, data: null };
      }
      
      // Invalidar cache
      profileCache.delete(targetUserId);
      
      return { error: null, data: updatedData };
    } catch (error) {
      console.error('Erro em makeAdmin:', error);
      return { error: error as Error, data: null };
    }
  }
  
  /**
   * Limpar cache de perfil
   */
  static clearCache(userId?: string) {
    if (userId) {
      profileCache.delete(userId);
    } else {
      profileCache.clear();
    }
  }

  /**
   * Obtém todos os perfis (para administradores)
   */
  static async getAllProfiles(): Promise<UserProfile[]> {
    try {
      console.log('Obtendo todos os perfis');
      
      // Usar a nova policy "Anyone can select profiles" que não causa recursão
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao obter todos os perfis:', error);
        throw error;
      }
      
      console.log('Perfis obtidos do banco:', data.length);
      
      return data.map((profile: any) => transformDatabaseProfile(profile));
    } catch (error) {
      console.error('Erro em getAllProfiles:', error);
      return [];
    }
  }
}

export default ProfileService;
