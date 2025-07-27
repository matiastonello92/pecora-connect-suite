/**
 * User Deletion Audit and Validation System
 * 
 * This utility helps prevent and detect issues with user deletion,
 * ensuring that deleted users don't reappear and providing audit trails.
 */

import { supabase } from '@/integrations/supabase/client';

interface DeletionAuditResult {
  isValid: boolean;
  issues: string[];
  auditTrail: Array<{
    email: string;
    action: string;
    timestamp: string;
    status: string;
  }>;
}

/**
 * Audit the user deletion system for consistency
 */
export async function auditUserDeletions(): Promise<DeletionAuditResult> {
  const result: DeletionAuditResult = {
    isValid: true,
    issues: [],
    auditTrail: []
  };

  try {
    // Check for users that appear in both active profiles and archived_users
    const { data: activeProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email');

    const { data: archivedUsers, error: archivedError } = await supabase
      .from('archived_users')
      .select('email, metadata');

    if (profilesError) {
      result.issues.push(`Error fetching active profiles: ${profilesError.message}`);
      result.isValid = false;
    } else if (archivedError) {
      result.issues.push(`Error fetching archived users: ${archivedError.message}`);
      result.isValid = false;
    } else if (activeProfiles && archivedUsers) {
      // Check for duplicates
      const archivedEmails = new Set(archivedUsers.map((u: any) => u.email));
      const duplicates = activeProfiles.filter((p: any) => p.email && archivedEmails.has(p.email));
      
      if (duplicates.length > 0) {
        result.issues.push(`Found ${duplicates.length} users that exist in both active profiles and archived users`);
        result.isValid = false;
        
        duplicates.forEach((user: any) => {
          result.auditTrail.push({
            email: user.email || 'unknown',
            action: 'DUPLICATE_DETECTED',
            timestamp: new Date().toISOString(),
            status: 'ERROR'
          });
        });
      }
    }

    // Check for permanently deleted users that still have active profiles
    const { data: permanentlyDeleted, error: permDeleteError } = await supabase
      .from('archived_users')
      .select('email, first_name, last_name, metadata')
      .contains('metadata', { permanently_deleted: 'true' });

    if (permDeleteError) {
      result.issues.push(`Error checking permanently deleted users: ${permDeleteError.message}`);
      result.isValid = false;
    } else if (permanentlyDeleted && permanentlyDeleted.length > 0 && activeProfiles) {
      const permanentlyDeletedEmails = new Set(permanentlyDeleted.map((u: any) => u.email));
      const stillActive = activeProfiles.filter((p: any) => p.email && permanentlyDeletedEmails.has(p.email));
      
      if (stillActive.length > 0) {
        result.issues.push(`Found ${stillActive.length} permanently deleted users with active profiles`);
        result.isValid = false;
      }
    }

    // Check for placeholder emails in the system
    const { data: placeholderUsers, error: placeholderError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email')
      .like('email', '%@managementpn.services%');

    if (placeholderError) {
      result.issues.push(`Error checking placeholder emails: ${placeholderError.message}`);
      result.isValid = false;
    } else if (placeholderUsers && placeholderUsers.length > 0) {
      result.issues.push(`Found ${placeholderUsers.length} users with placeholder @managementpn.services emails`);
      result.isValid = false;
      
        placeholderUsers.forEach((user: any) => {
          result.auditTrail.push({
            email: user.email || 'unknown',
            action: 'PLACEHOLDER_EMAIL_DETECTED',
            timestamp: new Date().toISOString(),
            status: 'WARNING'
          });
        });
    }

    console.log('User deletion audit completed:', result);
    return result;

  } catch (error: any) {
    result.issues.push(`Audit failed: ${error.message}`);
    result.isValid = false;
    return result;
  }
}

/**
 * Check if a specific email has been permanently deleted
 */
export async function isEmailPermanentlyDeleted(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('archived_users')
      .select('metadata')
      .eq('email', email)
      .contains('metadata', { permanently_deleted: 'true' })
      .limit(1);

    if (error) {
      console.error('Error checking permanently deleted status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in isEmailPermanentlyDeleted:', error);
    return false;
  }
}

/**
 * Validate that user management operations are working correctly
 */
export async function validateUserManagementIntegrity(): Promise<{
  passed: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Test 1: Check for any @managementpn.services emails in active profiles
    const { data: companyEmails, error: companyError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .like('email', '%@managementpn.services%');

    if (companyError) {
      errors.push(`Failed to check for company emails: ${companyError.message}`);
    } else if (companyEmails && companyEmails.length > 0) {
      warnings.push(`Found ${companyEmails.length} users with @managementpn.services placeholder emails`);
    }

    // Test 2: Check for users without real emails
    const { data: noEmailUsers, error: emailError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email')
      .or('email.is.null,email.eq.');

    if (emailError) {
      errors.push(`Failed to check for users without emails: ${emailError.message}`);
    } else if (noEmailUsers && noEmailUsers.length > 0) {
      warnings.push(`Found ${noEmailUsers.length} users without email addresses`);
    }

    // Test 3: Check deletion function is working
    const { data: permanentlyDeleted } = await supabase
      .from('archived_users')
      .select('email, metadata')
      .contains('metadata', { permanently_deleted: 'true' });

    if (permanentlyDeleted && permanentlyDeleted.length > 0) {
      console.log(`Found ${permanentlyDeleted.length} properly deleted users`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings
    };

  } catch (error: any) {
    return {
      passed: false,
      errors: [`Validation failed: ${error.message}`],
      warnings
    };
  }
}

/**
 * Clean up any remaining inconsistencies in the user system
 */
export async function cleanupUserInconsistencies(): Promise<{
  cleaned: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let cleaned = 0;

  try {
    // Get permanently deleted emails
    const { data: permanentlyDeleted, error: deletedError } = await supabase
      .from('archived_users')
      .select('email')
      .contains('metadata', { permanently_deleted: 'true' });

    if (deletedError) {
      errors.push(`Failed to fetch permanently deleted users: ${deletedError.message}`);
      return { cleaned, errors };
    }

    const deletedEmails = new Set((permanentlyDeleted || []).map((u: any) => u.email));

    // Find profiles that should be cleaned up
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, first_name, last_name');

    if (profilesError) {
      errors.push(`Failed to fetch profiles: ${profilesError.message}`);
      return { cleaned, errors };
    }

    const toClean = (profiles || []).filter((p: any) => p.email && deletedEmails.has(p.email));

    for (const profile of toClean) {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', profile.user_id);

      if (deleteError) {
        errors.push(`Failed to clean profile ${profile.email}: ${deleteError.message}`);
      } else {
        cleaned++;
        console.log(`Cleaned up inconsistent profile: ${profile.email}`);
      }
    }

    return { cleaned, errors };

  } catch (error: any) {
    return {
      cleaned,
      errors: [`Cleanup failed: ${error.message}`]
    };
  }
}