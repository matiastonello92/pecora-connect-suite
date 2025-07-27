import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { UserProfile, Shift, TimeEntry, UserRole, UserStatus, LocationType, EmploymentType } from '@/types/users';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  location: string;
  status: string;
  created_at: string;
  expires_at: string;
  invitation_token: string;
}

interface UserManagementState {
  users: UserProfile[];
  pendingInvitations: PendingInvitation[];
  shifts: Shift[];
  timeEntries: TimeEntry[];
  loading: boolean;
}

type UserManagementAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_USERS'; payload: UserProfile[] }
  | { type: 'LOAD_PENDING_INVITATIONS'; payload: PendingInvitation[] }
  | { type: 'LOAD_SHIFTS'; payload: Shift[] }
  | { type: 'LOAD_TIME_ENTRIES'; payload: TimeEntry[] }
  | { type: 'ADD_USER'; payload: UserProfile }
  | { type: 'UPDATE_USER'; payload: UserProfile }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_PENDING_INVITATION'; payload: PendingInvitation }
  | { type: 'UPDATE_PENDING_INVITATION'; payload: PendingInvitation }
  | { type: 'REMOVE_PENDING_INVITATION'; payload: string }
  | { type: 'ADD_SHIFT'; payload: Shift }
  | { type: 'UPDATE_SHIFT'; payload: Shift }
  | { type: 'ADD_TIME_ENTRY'; payload: TimeEntry }
  | { type: 'UPDATE_TIME_ENTRY'; payload: TimeEntry };

const userManagementReducer = (state: UserManagementState, action: UserManagementAction): UserManagementState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_USERS':
      return { ...state, users: action.payload };
    case 'LOAD_PENDING_INVITATIONS':
      return { ...state, pendingInvitations: action.payload };
    case 'LOAD_SHIFTS':
      return { ...state, shifts: action.payload };
    case 'LOAD_TIME_ENTRIES':
      return { ...state, timeEntries: action.payload };
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
    case 'ADD_SHIFT':
      return { ...state, shifts: [...state.shifts, action.payload] };
    case 'UPDATE_SHIFT':
      return {
        ...state,
        shifts: state.shifts.map(shift =>
          shift.id === action.payload.id ? action.payload : shift
        )
      };
    case 'ADD_TIME_ENTRY':
      return { ...state, timeEntries: [...state.timeEntries, action.payload] };
    case 'UPDATE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        )
      };
    default:
      return state;
  }
};

interface UserManagementContextType extends UserManagementState {
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (user: UserProfile) => void;
  deleteUser: (userId: string) => void;
  deletePendingInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitation: PendingInvitation) => Promise<void>;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shift: Shift) => void;
  clockIn: (userId: string, shiftId?: string) => void;
  clockOut: (userId: string) => void;
  getUsersByDepartment: (department: string) => UserProfile[];
  getUsersByRole: (role: UserRole) => UserProfile[];
  getActiveShifts: () => Shift[];
  getTodayTimeEntries: () => TimeEntry[];
  refreshData: () => void;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export const UserManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userManagementReducer, {
    users: [],
    pendingInvitations: [],
    shifts: [],
    timeEntries: [],
    loading: false
  });
  const { toast } = useToast();

  // Load real data from Supabase
  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userProfiles: UserProfile[] = profiles?.map(profile => ({
        id: profile.id || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: `${profile.first_name?.toLowerCase()}.${profile.last_name?.toLowerCase()}@company.com`, // Placeholder
        role: profile.role as UserRole,
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
        lastLogin: null // Will be updated when we have auth logs
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
        location: invitation.location,
        status: invitation.status,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        invitation_token: invitation.invitation_token
      })) || [];

      dispatch({ type: 'LOAD_PENDING_INVITATIONS', payload: pendingInvitations });
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  // Initialize and set up real-time subscriptions
  useEffect(() => {
    loadUsers();
    loadPendingInvitations();

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
      }, () => {
        console.log('Invitation deleted - refreshing data');
        loadPendingInvitations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(invitationsChannel);
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

  const deleteUser = async (userId: string) => {
    try {
      // Delete from profiles table - this will cascade to related data
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      // The real-time subscription will automatically refresh the data
      // But also manually refresh as a fallback
      setTimeout(() => refreshData(), 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const addShift = (shiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shiftData,
      id: Date.now().toString()
    };
    dispatch({ type: 'ADD_SHIFT', payload: newShift });
  };

  const updateShift = (shift: Shift) => {
    dispatch({ type: 'UPDATE_SHIFT', payload: shift });
  };

  const clockIn = (userId: string, shiftId?: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    const timeEntry: TimeEntry = {
      id: Date.now().toString(),
      userId,
      shiftId,
      clockIn: new Date(),
      breakMinutes: 0,
      department: user.department
    };
    dispatch({ type: 'ADD_TIME_ENTRY', payload: timeEntry });
  };

  const clockOut = (userId: string) => {
    const activeEntry = state.timeEntries.find(
      entry => entry.userId === userId && !entry.clockOut
    );
    
    if (activeEntry) {
      const clockOutTime = new Date();
      const totalMilliseconds = clockOutTime.getTime() - activeEntry.clockIn.getTime();
      const totalHours = (totalMilliseconds / (1000 * 60 * 60)) - (activeEntry.breakMinutes / 60);
      
      const updatedEntry: TimeEntry = {
        ...activeEntry,
        clockOut: clockOutTime,
        totalHours: Math.round(totalHours * 100) / 100
      };
      
      dispatch({ type: 'UPDATE_TIME_ENTRY', payload: updatedEntry });
    }
  };

  const getUsersByDepartment = (department: string) => {
    return state.users.filter(user => user.department === department);
  };

  const getUsersByRole = (role: UserRole) => {
    return state.users.filter(user => user.role === role);
  };

  const getActiveShifts = () => {
    return state.shifts.filter(shift => shift.status === 'active');
  };

  const getTodayTimeEntries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return state.timeEntries.filter(entry => entry.clockIn >= today);
  };

  const deletePendingInvitation = async (invitationId: string) => {
    try {
      // Delete the invitation from the database - this will make the email link invalid
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation deleted successfully",
      });

      // The real-time subscription will automatically refresh the data
      // But also manually refresh as a fallback
      setTimeout(() => refreshData(), 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete invitation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (invitation: PendingInvitation) => {
    try {
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: invitation.email,
          firstName: invitation.first_name,
          lastName: invitation.last_name,
          role: invitation.role,
          location: invitation.location,
          invitationToken: invitation.invitation_token,
          invitedByName: 'Admin' // TODO: Get actual user name
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation resent to ${invitation.email}`,
      });
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
  };

  return (
    <UserManagementContext.Provider value={{
      ...state,
      addUser,
      updateUser,
      deleteUser,
      deletePendingInvitation,
      resendInvitation,
      addShift,
      updateShift,
      clockIn,
      clockOut,
      getUsersByDepartment,
      getUsersByRole,
      getActiveShifts,
      getTodayTimeEntries,
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