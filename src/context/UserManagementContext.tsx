import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, ArchivedUser, InvitationData } from '@/types/users';

interface UserManagementContextType {
  users: UserProfile[];
  pendingInvitations: any[];
  archivedUsers: ArchivedUser[];
  loading: boolean;
  refreshUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  reactivateUser: (archivedUser: ArchivedUser) => Promise<void>;
  resendInvitation: (invitation: any) => Promise<void>;
  deletePendingInvitation: (invitationId: string) => Promise<void>;
  inviteUser: (data: InvitationData) => Promise<void>;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export const UserManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useEnhancedAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch active users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active');
      
      // Fetch pending invitations
      const { data: invitationsData } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('status', 'pending');
      
      // Fetch archived users
      const { data: archivedData } = await supabase
        .from('archived_users')
        .select('*');
      
      setUsers((usersData || []).map(u => ({
        user_id: u.user_id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        phone: u.phone,
        avatar_url: u.avatar_url,
        status: u.status as 'active' | 'inactive' | 'suspended',
        locations: u.locations,
        lastLogin: u.last_login_at ? new Date(u.last_login_at) : undefined,
        createdAt: new Date(u.created_at),
        updatedAt: new Date(u.updated_at)
      })));
      setPendingInvitations(invitationsData || []);
      setArchivedUsers((archivedData || []).map(a => ({
        id: a.id,
        originalUserId: a.original_user_id,
        originalInvitationId: a.original_invitation_id,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        locations: a.locations,
        previousStatus: a.previous_status as 'active' | 'pending',
        archivedBy: a.archived_by,
        archivedAt: new Date(a.archived_at),
        reason: a.reason,
        metadata: a.metadata,
        canReactivate: a.can_reactivate
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    // Simplified user deletion - just archive the user
    const user = users.find(u => u.user_id === userId);
    if (!user) return;

    await supabase.from('archived_users').insert({
      original_user_id: userId,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      locations: user.locations,
      previous_status: 'active',
      reason: 'manual_deletion',
      can_reactivate: true
    });

    await supabase.from('profiles').delete().eq('user_id', userId);
    await refreshUsers();
  };

  const reactivateUser = async (archivedUser: ArchivedUser) => {
    // Simplified reactivation
    console.log('Reactivating user:', archivedUser);
    await refreshUsers();
  };

  const resendInvitation = async (invitation: any) => {
    // Simplified resend
    console.log('Resending invitation:', invitation);
  };

  const deletePendingInvitation = async (invitationId: string) => {
    await supabase.from('user_invitations').delete().eq('id', invitationId);
    await refreshUsers();
  };

  const inviteUser = async (data: InvitationData) => {
    await supabase.from('user_invitations').insert({
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      locations: data.locations,
      status: 'pending'
    });
    await refreshUsers();
  };

  useEffect(() => {
    if (profile?.user_id) {
      refreshUsers();
    }
  }, [profile?.user_id]);

  return (
    <UserManagementContext.Provider value={{
      users,
      pendingInvitations,
      archivedUsers,
      loading,
      refreshUsers,
      deleteUser,
      reactivateUser,
      resendInvitation,
      deletePendingInvitation,
      inviteUser
    }}>
      {children}
    </UserManagementContext.Provider>
  );
};

export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagement must be used within UserManagementProvider');
  }
  return context;
};