
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
      // Usar a função RPC segura para evitar problemas de RLS
      const { data: role, error: roleError } = await supabase
        .rpc('get_user_role_safely', { user_id: userId });
      
      if (roleError) {
        console.error('Error getting user role:', roleError);
      }
      
      // Obter perfil diretamente
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // Criar perfil mínimo se outras abordagens falharem
        if (email) {
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
        return null;
      }
      
      // Se temos dados de role da RPC e é diferente, usar esse
      if (role && profileData.role !== role) {
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
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }
  
  /**
   * Cria perfil padrão para usuário
   */
  static async createDefaultProfile(userId: string, email: string, role: UserRole = UserRole.CLIENT): Promise<UserProfile | null> {
    try {
      const defaultName = email?.split('@')[0] || 'User';
      const roleString = String(role).toLowerCase();
      
      // Criar perfil no banco usando RPC
      const { error } = await supabase.rpc('create_user_profile', { 
        user_id: userId,
        user_name: defaultName,
        user_role: roleString
      });
        
      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      
      // Obter o perfil recém-criado
      return await this.getUserProfile(userId, email, true);
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
      return null;
    }
  }
  
  /**
   * Atualiza perfil do usuário
   */
  static async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ error: Error | null, data: any }> {
    try {
      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) {
        return { error, data: null };
      }

      // Invalidar cache
      profileCache.delete(userId);
      
      return { data: updatedData, error: null };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }
  
  /**
   * Torna usuário admin
   */
  static async makeAdmin(adminUserId: string, targetUserId: string): Promise<{ error: Error | null, data: any }> {
    try {
      // Verificar se usuário é admin usando nova função segura
      const { data: isAdmin, error: roleCheckError } = await supabase.rpc('is_admin', {
        user_id: adminUserId
      });
      
      if (roleCheckError || !isAdmin) {
        return { error: new Error('Unauthorized - Not an admin'), data: null };
      }

      // Atualizar role do usuário usando RPC
      const { error, data: updatedData } = await supabase.rpc('update_user_role', {
        user_id: targetUserId,
        new_role: 'admin'
      });

      if (error) {
        return { error, data: null };
      }
      
      // Invalidar cache
      profileCache.delete(targetUserId);
      
      return { error: null, data: updatedData };
    } catch (error) {
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
}

export default ProfileService;
