
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/lib/types';
import { toast } from 'sonner';

// Local cache for profiles to reduce database calls
const profileCache = new Map<string, {
  profile: UserProfile,
  timestamp: number
}>();

// Cache expiration time (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Maps string role from database to UserRole enum
 */
export const mapDatabaseRoleToEnum = (role: string): UserRole => {
  // Garantir que role seja tratada como string e normalizada
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
 * Transforms database profile to UserProfile
 */
export const transformDatabaseProfile = (
  profileData: any, 
  email: string | null = null
): UserProfile => {
  // Map database role to UserRole enum
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
 * Checks if user has specific role - safe string comparison
 */
export const hasRole = (user: UserProfile | null, role: UserRole | string): boolean => {
  if (!user) return false;
  
  // Garantir que ambos os valores sejam tratados como string e normalizados
  const userRoleStr = String(user.role).toLowerCase().trim();
  const checkRoleStr = String(role).toLowerCase().trim();
  
  return userRoleStr === checkRoleStr;
};

/**
 * Service for Profile operations
 */
export class ProfileService {
  /**
   * Get user profile by ID with fallback mechanisms
   */
  static async getUserProfile(userId: string, email: string | null = null, forceRefresh = false): Promise<UserProfile | null> {
    if (!userId) {
      console.error('No user ID provided for getUserProfile');
      return null;
    }
    
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = profileCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.profile;
      }
    }
    
    try {
      // Use the get_role_safely RPC function to avoid RLS issues
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_role_safely', { user_id: userId });
      
      if (roleError) {
        console.error('Error fetching user role using get_role_safely:', roleError);
      }
      
      // Get the profile through direct query
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile directly:', error);
        
        // Create a minimal profile if other approaches fail
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
          
          // Cache this minimal profile
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
      
      // If we got role data from RPC and it doesn't match, use that one
      // This helps avoid any RLS issues
      if (roleData && profileData.role !== roleData) {
        profileData.role = roleData;
      }
      
      // Transform and cache the profile
      const profile = transformDatabaseProfile(profileData, email);
      profileCache.set(userId, {
        profile,
        timestamp: Date.now()
      });
      
      return profile;
    } catch (error) {
      console.error('Exception in getUserProfile:', error);
      return null;
    }
  }
  
  /**
   * Create default profile for user
   */
  static async createDefaultProfile(userId: string, email: string, role: UserRole = UserRole.CLIENT): Promise<UserProfile | null> {
    try {
      const defaultName = email?.split('@')[0] || 'User';
      const roleString = String(role).toLowerCase();
      
      // Create profile in database
      const { error } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId,
          name: defaultName,
          role: roleString,
          phone: ''
        }]);
        
      if (error) {
        console.error('Error creating profile:', error);
        
        // Try updating instead if insert failed (might be a duplicate)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            name: defaultName,
            role: roleString,
            phone: ''
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating profile:', updateError);
          return null;
        }
      }
      
      // Get the newly created profile
      return await this.getUserProfile(userId, email, true);
    } catch (error) {
      console.error('Exception in createDefaultProfile:', error);
      return null;
    }
  }
  
  /**
   * Update user profile
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

      // Invalidate cache
      profileCache.delete(userId);
      
      return { data: updatedData, error: null };
    } catch (error) {
      console.error('Exception in updateProfile:', error);
      return { error: error as Error, data: null };
    }
  }
  
  /**
   * Make user an admin
   */
  static async makeAdmin(adminUserId: string, targetUserId: string): Promise<{ error: Error | null, data: any }> {
    try {
      if (!adminUserId) {
        return { error: new Error('No admin user provided'), data: null };
      }

      // Use our RPC function to check if user is admin
      const { data: isAdmin, error: roleCheckError } = await supabase.rpc('is_admin', {
        user_id: adminUserId
      });
      
      if (roleCheckError || !isAdmin) {
        return { error: new Error('Unauthorized - Not an admin'), data: null };
      }

      // Update user role using RPC
      const { error, data: updatedData } = await supabase.rpc('update_user_role', {
        user_id: targetUserId,
        new_role: 'admin'
      });

      if (error) {
        return { error, data: null };
      }
      
      // Invalidate cache
      profileCache.delete(targetUserId);
      
      return { error: null, data: updatedData };
    } catch (error) {
      console.error('Exception in makeAdmin:', error);
      return { error: error as Error, data: null };
    }
  }
  
  /**
   * Clear profile cache
   */
  static clearCache(userId?: string) {
    if (userId) {
      profileCache.delete(userId);
    } else {
      profileCache.clear();
    }
  }
}

// Export a singleton instance
export default ProfileService;
