/**
 * Permission Utilities
 * Consolidated permission logic
 */

import type { AppModule, AccessLevel } from '@/types/users';

export interface PermissionMatrix {
  [key: string]: {
    can_read: boolean;
    can_write: boolean;
    can_validate: boolean;
    can_delete: boolean;
  };
}

export class PermissionManager {
  static getDefaultPermissions(level: AccessLevel): PermissionMatrix {
    switch (level) {
      case 'base':
        return {
          chat: { can_read: true, can_write: true, can_validate: false, can_delete: false },
          equipment: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          inventory_sala: { can_read: true, can_write: true, can_validate: false, can_delete: false },
          inventory_kitchen: { can_read: true, can_write: true, can_validate: false, can_delete: false },
          checklists: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          suppliers: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          communication: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          tasks: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          financial: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          cash_closure: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          reports: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          announcements: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          user_management: { can_read: false, can_write: false, can_validate: false, can_delete: false }
        };
        
      case 'general_manager':
        const fullAccess = { can_read: true, can_write: true, can_validate: true, can_delete: true };
        return {
          chat: fullAccess,
          inventory_sala: fullAccess,
          inventory_kitchen: fullAccess,
          checklists: fullAccess,
          suppliers: fullAccess,
          equipment: fullAccess,
          financial: fullAccess,
          cash_closure: fullAccess,
          reports: fullAccess,
          tasks: fullAccess,
          communication: fullAccess,
          announcements: fullAccess,
          user_management: fullAccess
        };
        
      case 'observer':
        const readOnly = { can_read: true, can_write: false, can_validate: false, can_delete: false };
        return {
          chat: readOnly,
          inventory_sala: readOnly,
          inventory_kitchen: readOnly,
          checklists: readOnly,
          suppliers: readOnly,
          equipment: readOnly,
          financial: readOnly,
          cash_closure: readOnly,
          reports: readOnly,
          tasks: readOnly,
          communication: readOnly,
          announcements: readOnly,
          user_management: readOnly
        };
        
      default:
        return {} as PermissionMatrix;
    }
  }

  static hasPermission(
    userLevel: AccessLevel,
    module: AppModule,
    permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete',
    customPermissions?: any[]
  ): boolean {
    // Check custom permissions first
    const customPerm = customPermissions?.find(p => p.module === module);
    if (customPerm) {
      return customPerm[permission];
    }
    
    // Fall back to default permissions
    const defaults = this.getDefaultPermissions(userLevel);
    return defaults[module]?.[permission] || false;
  }
}