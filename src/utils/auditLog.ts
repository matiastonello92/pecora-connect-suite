import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  location?: string;
}

export const auditActions = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_CHANGED: 'password_changed',
  
  // User Management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_INVITED: 'user_invited',
  USER_ROLE_CHANGED: 'user_role_changed',
  
  // Chat/Communication
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELETED: 'message_deleted',
  FILE_UPLOADED: 'file_uploaded',
  CHAT_CREATED: 'chat_created',
  
  // System
  PERMISSION_DENIED: 'permission_denied',
  SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
  BULK_OPERATION: 'bulk_operation'
} as const;

export type AuditAction = typeof auditActions[keyof typeof auditActions];

class AuditLogger {
  private getClientInfo() {
    return {
      ip_address: 'client', // In a real app, you'd get this from the server
      user_agent: navigator.userAgent,
    };
  }

  async log(entry: Omit<AuditLogEntry, 'ip_address' | 'user_agent'>) {
    try {
      const clientInfo = this.getClientInfo();
      const auditEntry = {
        ...entry,
        ...clientInfo,
        timestamp: new Date().toISOString(),
      };

      // In a production app, you would send this to a dedicated audit log table
      // For now, we'll just log to console and could extend to send to an audit service
      console.log('[AUDIT]', auditEntry);
      
      // Optional: Store in a dedicated audit log table if you create one
      // await supabase.from('audit_logs').insert(auditEntry);
      
    } catch (error) {
      // Audit logging should never fail the main operation
      console.error('Failed to log audit entry:', error);
    }
  }

  // Convenience methods for common audit events
  async logAuthentication(userId: string, action: AuditAction, success: boolean, details?: Record<string, any>) {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'authentication',
      details: { success, ...details }
    });
  }

  async logUserAction(userId: string, action: AuditAction, targetUserId?: string, details?: Record<string, any>) {
    await this.log({
      user_id: userId,
      action,
      resource_type: 'user',
      resource_id: targetUserId,
      details
    });
  }

  async logPermissionDenied(userId: string, attemptedAction: string, resource: string, details?: Record<string, any>) {
    await this.log({
      user_id: userId,
      action: auditActions.PERMISSION_DENIED,
      resource_type: resource,
      details: { attempted_action: attemptedAction, ...details }
    });
  }

  async logFileUpload(userId: string, fileName: string, fileSize: number, fileType: string) {
    await this.log({
      user_id: userId,
      action: auditActions.FILE_UPLOADED,
      resource_type: 'file',
      details: {
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType
      }
    });
  }
}

export const auditLogger = new AuditLogger();