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
  
  // Garantir que role seja tratada como string e normalizada
  const roleString = String(role).toLowerCase().trim();
  
  // Log adicional para debug
  console.log('Normalized role string:', roleString);
  
  switch(roleString) {
    case 'provider':
      console.log('Role matched: PROVIDER');
      return UserRole.PROVIDER;
    case 'admin':
      console.log('Role matched: ADMIN');
      return UserRole.ADMIN;
    default:
      console.log('Role defaulted to: CLIENT');
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
  
  console.log('Role mapping result:', { 
    originalRole: profileData.role, 
    originalRoleType: typeof profileData.role,
    mappedRole: userRole,
    roleType: typeof userRole
  });
  
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
  
  console.log('Checking role:', {
    userRole: user.role,
    userRoleType: typeof user.role,
    userRoleString: userRoleStr,
    checkRole: role,
    checkRoleType: typeof role,
    checkRoleString: checkRoleStr,
    result: userRoleStr === checkRoleStr,
    expectedProvider: String(UserRole.PROVIDER).toLowerCase().trim(),
    expectedAdmin: String(UserRole.ADMIN).toLowerCase().trim()
  });
  
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
    console.log('Getting user profile for ID:', userId, 'Force refresh:', forceRefresh);
    
    if (!userId) {
      console.error('No user ID provided for getUserProfile');
      return null;
    }
    
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = profileCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        console.log('Using cached profile for user:', userId);
        return cached.profile;
      }
    }
    
    // Try multiple approaches to get the profile
    try {
      console.log('Fetching profile from database for user:', userId);
      
      // Approach 1: Use the RPC function to avoid RLS recursion issues (preferred method)
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role_safely', { user_id: userId });
      
      if (roleError) {
        console.error('Error fetching user role using RPC:', roleError);
        // Continue to next approach
      } else {
        console.log('Role data from RPC:', roleData);
      }
      
      // Approach 2: Get the full profile through direct query
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile directly:', error);
        
        // Approach 3: Try to use service role if available (server-side only)
        // This part would require a Supabase Edge Function in production
        
        // For now, create a minimal profile if other approaches fail
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
          
          console.log('Created minimal profile as fallback:', minimalProfile);
          
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
        console.log('No profile found for user:', userId);
        return null;
      }
      
      // If we got role data from RPC and it doesn't match, use that one
      // This helps avoid any RLS issues
      if (roleData && profileData.role !== roleData) {
        console.log('Using role from RPC function:', roleData);
        profileData.role = roleData;
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
      const roleString = String(role).toLowerCase();
      
      console.log('Creating profile with role:', roleString);
      
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

      // Use our new RPC function to check if user is admin
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
      console.log(`Cleared cached profile for user ${userId}`);
    } else {
      profileCache.clear();
      console.log('Cleared all cached profiles');
    }
  }
}

// Export a singleton instance
export default ProfileService;
