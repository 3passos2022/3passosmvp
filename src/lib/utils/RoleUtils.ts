
import { UserProfile, UserRole } from '@/lib/types';

/**
 * Classe utilitária para simplificar operações com roles de usuário
 */
export class RoleUtils {
  /**
   * Verifica se um usuário tem um papel específico
   */
  static hasRole(user: UserProfile | null, role: UserRole | string): boolean {
    if (!user) return false;
    
    const userRoleStr = String(user.role).toLowerCase().trim();
    const checkRoleStr = String(role).toLowerCase().trim();
    
    return userRoleStr === checkRoleStr;
  }
  
  /**
   * Verifica se um usuário é admin
   */
  static isAdmin(user: UserProfile | null): boolean {
    return this.hasRole(user, UserRole.ADMIN);
  }
  
  /**
   * Verifica se um usuário é prestador
   */
  static isProvider(user: UserProfile | null): boolean {
    return this.hasRole(user, UserRole.PROVIDER);
  }
  
  /**
   * Verifica se um usuário é cliente
   */
  static isClient(user: UserProfile | null): boolean {
    return this.hasRole(user, UserRole.CLIENT);
  }
  
  /**
   * Retorna uma descrição legível do tipo de conta
   */
  static getAccountTypeLabel(user: UserProfile | null): string {
    if (!user) return 'Visitante';
    
    if (this.isAdmin(user)) {
      return 'Administrador';
    } else if (this.isProvider(user)) {
      return 'Prestador de Serviços';
    } else {
      return 'Cliente';
    }
  }
}
