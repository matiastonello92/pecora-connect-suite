import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { UserProfile, UserRole, UserStatus, LocationType, EmploymentType, ArchivedUser } from '@/types/users';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  restaurant_role?: string | null;
  access_level: string;
  location: string;
  status: string;
  created_at: string;
  expires_at: string;
  invitation_token: string;
  metadata?: any;
}

interface UserManagementState {
  users: UserProfile[];
  pendingInvitations: PendingInvitation[];
  archivedUsers: ArchivedUser[];
  loading: boolean;
}

type UserManagementAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_USERS'; payload: UserProfile[] }
  | { type: 'LOAD_PENDING_INVITATIONS'; payload: PendingInvitation[] }
  | { type: 'LOAD_ARCHIVED_USERS'; payload: ArchivedUser[] }
  | { type: 'ADD_USER'; payload: UserProfile }
  | { type: 'UPDATE_USER'; payload: UserProfile }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'ADD_PENDING_INVITATION'; payload: PendingInvitation }
  | { type: 'UPDATE_PENDING_INVITATION'; payload: PendingInvitation }
  | { type: 'REMOVE_PENDING_INVITATION'; payload: string }
  | { type: 'ADD_ARCHIVED_USER'; payload: ArchivedUser };

const userManagementReducer = (state: UserManagementState, action: UserManagementAction): UserManagementState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_USERS':
      return { ...state, users: action.payload };
    case 'LOAD_PENDING_INVITATIONS':
      return { ...state, pendingInvitations: action.payload };
    case 'LOAD_ARCHIVED_USERS':
      return { ...state, archivedUsers: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.payload.id ? action.payload : user
        )
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload)
      };
    case 'REMOVE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload)
      };
    case 'ADD_PENDING_INVITATION':
      return { ...state, pendingInvitations: [...state.pendingInvitations, action.payload] };
    case 'UPDATE_PENDING_INVITATION':
      return {
        ...state,
        pendingInvitations: state.pendingInvitations.map(invitation =>
          invitation.id === action.payload.id ? action.payload : invitation
        )
      };
    case 'REMOVE_PENDING_INVITATION':
      return {
        ...state,
        pendingInvitations: state.pendingInvitations.filter(invitation => invitation.id !== action.payload)
      };
    case 'ADD_ARCHIVED_USER':
      return { ...state, archivedUsers: [...state.archivedUsers, action.payload] };
    default:
      return state;
  }
};

interface UserManagementContextType extends UserManagementState {
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (user: UserProfile) => void;
  deleteUser: (user: UserProfile) => Promise<void>;
  deletePendingInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitation: PendingInvitation) => Promise<void>;
  reactivateUser: (archivedUserId: string) => Promise<void>;
  getUsersByDepartment: (department: string) => UserProfile[];
  getUsersByRole: (role: UserRole) => UserProfile[];
  refreshData: () => void;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export const UserManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userManagementReducer, {
    users: [],
    pendingInvitations: [],
    archivedUsers: [],
    loading: false
  });
  const { toast } = useToast();

  // Load real data from Supabase with correct email fetching
  const loadUsers = async () => {
    try {
      // Fetch profiles with auth.users email
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_id
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create user profiles without fetching auth emails (use current user's email for context)
      const { data: currentUser } = await supabase.auth.getUser();
      const currentUserEmail = currentUser.user?.email || '';
      
      const userProfiles: UserProfile[] = profiles?.map(profile => ({
        id: profile.user_id || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.user_id === currentUser.user?.id ? currentUserEmail : profile.email || `${profile.first_name?.toLowerCase()}.${profile.last_name?.toLowerCase()}@managementpn.services`,
        role: profile.role as UserRole,
        restaurantRole: profile.restaurant_role,
        accessLevel: profile.access_level || 'base',
        hasCustomPermissions: profile.has_custom_permissions || false,
        department: profile.department || '',
        location: profile.location as LocationType || 'menton',
        position: profile.position || '',
        status: profile.status as UserStatus,
        employmentType: 'full-time' as EmploymentType,
        startDate: new Date(profile.created_at || ''),
        language: 'en' as 'en' | 'fr' | 'it',
        permissions: [], // Default empty permissions
        createdAt: new Date(profile.created_at || ''),
        updatedAt: new Date(profile.updated_at || ''),
        lastLogin: profile.last_login_at ? new Date(profile.last_login_at) : null
      })) || [];

      dispatch({ type: 'LOAD_USERS', payload: userProfiles });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pendingInvitations: PendingInvitation[] = invitations?.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        role: invitation.role,
        restaurant_role: invitation.restaurant_role,
        access_level: invitation.access_level || 'base',
        location: invitation.location,
        status: invitation.status,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        invitation_token: invitation.invitation_token,
        metadata: invitation.metadata
      })) || [];

      dispatch({ type: 'LOAD_PENDING_INVITATIONS', payload: pendingInvitations });
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  const loadArchivedUsers = async () => {
    try {
      const { data: archived, error } = await supabase
        .from('archived_users')
        .select('*')
        .order('archived_at', { ascending: false });

      if (error) throw error;

      // Only show users who were active and had logged in at least once
      const archivedUsers: ArchivedUser[] = archived?.filter(user => 
        user.previous_status === 'active' && 
        user.metadata && 
        typeof user.metadata === 'object' && 
        (user.metadata as any)?.lastLogin
      ).map(user => ({
        id: user.id,
        originalUserId: user.original_user_id,
        originalInvitationId: user.original_invitation_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role as UserRole,
        location: user.location as LocationType,
        department: user.department,
        position: user.position,
        previousStatus: user.previous_status as 'active' | 'pending',
        archivedBy: user.archived_by,
        archivedAt: new Date(user.archived_at),
        reason: user.reason,
        metadata: user.metadata,
        canReactivate: user.can_reactivate
      })) || [];

      dispatch({ type: 'LOAD_ARCHIVED_USERS', payload: archivedUsers });
    } catch (error) {
      console.error('Error loading archived users:', error);
    }
  };

  // Initialize and set up real-time subscriptions
  useEffect(() => {
    loadUsers();
    loadPendingInvitations();
    loadArchivedUsers();

    // Set up real-time subscriptions with more specific event handling
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        console.log('Profile inserted - refreshing data');
        loadUsers();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        console.log('Profile updated - refreshing data');
        loadUsers();
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        console.log('Profile deleted - refreshing data');
        loadUsers();
      })
      .subscribe();

    const invitationsChannel = supabase
      .channel('invitations-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_invitations' 
      }, () => {
        console.log('Invitation created - refreshing data');
        loadPendingInvitations();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'user_invitations' 
      }, () => {
        console.log('Invitation updated - refreshing data');
        loadPendingInvitations();
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'user_invitations' 
      }, (payload) => {
        console.log('Invitation deleted via real-time:', payload.old?.id);
        // Always refresh to ensure consistency after deletion
        // The optimistic UI update handles immediate removal
        setTimeout(() => loadPendingInvitations(), 50);
      })
      .subscribe();

    const archivedChannel = supabase
      .channel('archived-users-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'archived_users' 
      }, () => {
        console.log('Archived user created - refreshing data');
        loadArchivedUsers();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'archived_users' 
      }, () => {
        console.log('Archived user updated - refreshing data');
        loadArchivedUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(invitationsChannel);
      supabase.removeChannel(archivedChannel);
    };
  }, []);

  const addUser = (userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser: UserProfile = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    dispatch({ type: 'ADD_USER', payload: newUser });
  };

  const updateUser = (user: UserProfile) => {
    const updatedUser = { ...user, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
  };

  const deleteUser = async (user: UserProfile) => {
    try {
      console.log('Starting deletion process for user:', user.email, user.id);
      
      // Immediately remove user from UI for better UX
      dispatch({ type: 'REMOVE_USER', payload: user.id });

      // Get current user for audit trail
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      // For hard deletion (permanent removal)
      // Archive the user with permanent deletion flag
      const { error: archiveError } = await supabase
        .from('archived_users')
        .insert({
          original_user_id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email || `${user.firstName}.${user.lastName}@deleted.local`,
          role: user.role,
          restaurant_role: user.restaurantRole,
          access_level: user.accessLevel,
          location: user.location,
          department: user.department,
          position: user.position,
          previous_status: user.status || 'active',
          archived_by: currentUser?.id,
          reason: 'permanent_deletion',
          can_reactivate: false, // Cannot be reactivated
          metadata: { 
            lastLogin: user.lastLogin?.toISOString() || null,
            permanently_deleted: 'true',
            deleted_at: new Date().toISOString()
          }
        });

      if (archiveError) {
        console.error('Archive error:', archiveError);
        // Rollback UI change if archive fails
        dispatch({ type: 'ADD_USER', payload: user });
        throw archiveError;
      }

      // Hard delete from profiles table
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Profile deletion error:', deleteError);
        // Rollback UI change if deletion fails
        dispatch({ type: 'ADD_USER', payload: user });
        throw deleteError;
      }

      // Delete any pending invitations for this email
      if (user.email) {
        const { error: inviteDeleteError } = await supabase
          .from('user_invitations')
          .delete()
          .eq('email', user.email);
        
        if (inviteDeleteError) {
          console.warn('Failed to delete invitation:', inviteDeleteError);
          // Don't fail the whole operation for this
        }
      }

      // Delete from auth.users if possible (this might fail if user doesn't exist in auth)
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (authDeleteError) {
          console.warn('Failed to delete from auth (user may not exist in auth):', authDeleteError);
          // Don't fail the whole operation for this
        }
      } catch (authError) {
        console.warn('Auth deletion not available or failed:', authError);
      }

      console.log('User deletion completed successfully for:', user.email);

      toast({
        title: "Success",
        description: "User permanently deleted and cannot be recreated",
      });

      // Load archived users to show the newly archived user immediately
      setTimeout(() => {
        loadArchivedUsers();
        // Also refresh users to ensure they're gone from active list
        loadUsers();
      }, 100);
      
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  };


  const getUsersByDepartment = (department: string) => {
    return state.users.filter(user => user.department === department);
  };

  const getUsersByRole = (role: UserRole) => {
    return state.users.filter(user => user.role === role);
  };


  const deletePendingInvitation = async (invitationId: string) => {
    try {
      // Find the invitation
      const invitation = state.pendingInvitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        console.log('Invitation not found in state:', invitationId);
        return; // Already deleted, don't show error
      }

      console.log('Deleting invitation:', invitationId, invitation.email);

      // Immediately update local state to reflect the deletion BEFORE database call
      dispatch({
        type: 'REMOVE_PENDING_INVITATION',
        payload: invitationId
      });

      // Archive the invitation for audit trail before permanent deletion
      const { error: archiveError } = await supabase
        .from('archived_users')
        .insert({
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          email: invitation.email,
          role: invitation.role,
          restaurant_role: invitation.restaurant_role as any,
          access_level: invitation.access_level as any,
          location: invitation.location,
          previous_status: 'pending',
          archived_by: (await supabase.auth.getUser()).data.user?.id,
          reason: 'invitation_deletion',
          can_reactivate: false, // Cannot recreate deleted invitations
          metadata: { 
            permanently_deleted: 'true',
            deleted_at: new Date().toISOString(),
            original_invitation_id: invitationId,
            original_invitation_data: invitation
          }
        } as any);

      if (archiveError) {
        console.warn('Failed to archive invitation (continuing with deletion):', archiveError);
        // Don't fail the deletion for archiving issues
      }

      // Permanently delete the invitation from the database
      // This will immediately invalidate any invitation tokens and remove all traces
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        // If database deletion fails, restore the invitation to the local state
        console.error('Database deletion failed:', error);
        dispatch({
          type: 'ADD_PENDING_INVITATION',
          payload: invitation
        });
        throw error;
      }

      console.log('Invitation successfully deleted from database:', invitationId);

      toast({
        title: "Success",
        description: "Invitation permanently deleted and email blocked from future invitations.",
      });

      // Refresh archived users to show the deletion record
      setTimeout(() => loadArchivedUsers(), 100);
      
    } catch (error: any) {
      console.error('Failed to delete invitation:', error);
      toast({
        title: "Error",
        description: `Failed to delete invitation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const reactivateUser = async (archivedUserId: string) => {
    try {
      const archivedUser = state.archivedUsers.find(user => user.id === archivedUserId);
      if (!archivedUser || !archivedUser.canReactivate) {
        throw new Error('User cannot be reactivated');
      }

      if (archivedUser.previousStatus === 'pending') {
        // Recreate invitation for pending users
        const { error } = await supabase
          .from('user_invitations')
          .insert({
            email: archivedUser.email,
            first_name: archivedUser.firstName,
            last_name: archivedUser.lastName,
            role: archivedUser.role,
            location: archivedUser.location,
            status: 'pending'
          });

        if (error) throw error;
      } else {
        // Recreate profile for active users
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: archivedUser.originalUserId,
            first_name: archivedUser.firstName,
            last_name: archivedUser.lastName,
            role: archivedUser.role,
            location: archivedUser.location,
            department: archivedUser.department,
            position: archivedUser.position,
            status: 'active'
          });

        if (error) throw error;
      }

      // Mark as reactivated in archived_users table
      const { error: updateError } = await supabase
        .from('archived_users')
        .update({ can_reactivate: false, metadata: { reactivated_at: new Date().toISOString() } })
        .eq('id', archivedUserId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "User reactivated successfully",
      });

      setTimeout(() => refreshData(), 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to reactivate user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (invitation: PendingInvitation) => {
    try {
      // Generate a new invitation token for security
      const newToken = crypto.randomUUID();
      
      // Update the invitation with new token and extended expiry
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({
          invitation_token: newToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          created_at: new Date().toISOString() // Update timestamp to track resend
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Get current user name for personalization
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const invitedByName = currentUserProfile 
        ? `${currentUserProfile.first_name} ${currentUserProfile.last_name}`
        : 'Admin';

      // Send email with new token and resend indicator
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: invitation.email,
          firstName: invitation.first_name,
          lastName: invitation.last_name,
          role: invitation.role,
          location: invitation.location,
          invitationToken: newToken, // Use new token
          invitedByName,
          isResend: true // Flag to indicate this is a resend
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `New invitation sent to ${invitation.email}`,
      });

      // Refresh data to show updated invitation
      setTimeout(() => loadPendingInvitations(), 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to resend invitation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    loadUsers();
    loadPendingInvitations();
    loadArchivedUsers();
  };

  return (
    <UserManagementContext.Provider value={{
      ...state,
      addUser,
      updateUser,
      deleteUser,
      deletePendingInvitation,
      resendInvitation,
      reactivateUser,
      getUsersByDepartment,
      getUsersByRole,
      refreshData
    }}>
      {children}
    </UserManagementContext.Provider>
  );
};

export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
};