
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
  console.log('Mapping role from database:', role);
  
  switch(String(role).toLowerCase()) {
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
  console.log('Transforming database profile:', profileData);
  
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
  
  // Compare both as strings to avoid enum comparison issues
  const userRoleStr = String(user.role).toLowerCase();
  const checkRoleStr = String(role).toLowerCase();
  
  return userRoleStr === checkRoleStr;
};

/**
 * Service for Profile operations
 */
export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string, email: string | null = null, forceRefresh = false): Promise<UserProfile | null> {
    console.log('Getting user profile for ID:', userId, 'Force refresh:', forceRefresh);
    
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = profileCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        console.log('Using cached profile for user:', userId);
        return cached.profile;
      }
    }
    
    try {
      console.log('Fetching profile from database for user:', userId);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      if (!profileData) {
        console.log('No profile found for user:', userId);
        return null;
      }
      
      // Transform and cache the profile
      const profile = transformDatabaseProfile(profileData, email);
      profileCache.set(userId, {
        profile,
        timestamp: Date.now()
      });
      
      console.log('Profile successfully fetched and cached:', profile);
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
      console.log('Creating default profile for user:', userId);
      
      const defaultName = email?.split('@')[0] || 'User';
      
      // Create profile in database
      const { error } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId,
          name: defaultName,
          role: role,
          phone: ''
        }]);
        
      if (error) {
        console.error('Error creating profile:', error);
        return null;
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
      console.log('Updating profile for user:', userId, 'with data:', data);
      
      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) {
        return { error, data: null };
      }

      // Invalidate cache
      profileCache.delete(userId);
      
      console.log('Profile updated successfully');
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

      // Verify admin role using RPC to avoid RLS issues
      const { data: isAdmin, error: roleCheckError } = await supabase.rpc('is_admin', {
        user_id: adminUserId
      });
      
      if (roleCheckError || !isAdmin) {
        return { error: new Error('Unauthorized - Not an admin'), data: null };
      }

      // Update user role using RPC
      const { error, data: updatedData } = await supabase.rpc('update_user_role', {
        user_id: targetUserId,
        new_role: UserRole.ADMIN
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
      console.log(`Cleared cached profile for user ${userId}`);
    } else {
      profileCache.clear();
      console.log('Cleared all cached profiles');
    }
  }
}

// Export a singleton instance
export default ProfileService;
