
import { supabase } from './client';
import { UserProfile, UserRole } from '@/lib/types';

// This file contains helper functions for database operations
// These functions call RPC functions defined in the Supabase database

/**
 * Creates a user profile with admin privileges
 * @param userId The user ID to create a profile for
 * @param name The name of the user
 * @returns Promise with the result of the operation
 */
export async function createUserProfile(userId: string, name: string, role: string) {
  const { data, error } = await supabase.rpc('create_user_profile', { 
    user_id: userId,
    user_name: name,
    user_role: role
  });
  
  if (error) throw error;
  
  return data;
}

/**
 * Updates a user's role
 * @param userId The user ID to update
 * @param role The new role for the user
 * @returns Promise with the result of the operation
 */
export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase.rpc('update_user_role', { 
    user_id: userId,
    new_role: role
  });
  
  if (error) throw error;
  
  return data;
}

/**
 * Gets a user's profile by ID
 * @param userId The user ID to get the profile for
 * @returns Promise with the user profile data
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  
  // If we have data, map it to our UserProfile type
  if (data) {
    const userRole = mapDatabaseRoleToEnum(data.role);
    
    // Return a properly typed UserProfile
    return {
      id: data.id,
      role: userRole,
      name: data.name || undefined,
      phone: data.phone || undefined,
      created_at: data.created_at || undefined,
    };
  }
  
  console.log("No profile data found for user:", userId);
  return null;
}

/**
 * Maps a string role from the database to our UserRole enum
 */
function mapDatabaseRoleToEnum(role: string): UserRole {
  switch(role.toLowerCase()) {
    case 'provider':
      return UserRole.PROVIDER;
    case 'admin':
      return UserRole.ADMIN;
    default:
      return UserRole.CLIENT;
  }
}
