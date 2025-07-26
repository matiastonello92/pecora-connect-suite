import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { UserProfile, Shift, TimeEntry, UserRole, UserStatus } from '@/types/users';

interface UserManagementState {
  users: UserProfile[];
  shifts: Shift[];
  timeEntries: TimeEntry[];
  loading: boolean;
}

type UserManagementAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_USERS'; payload: UserProfile[] }
  | { type: 'LOAD_SHIFTS'; payload: Shift[] }
  | { type: 'LOAD_TIME_ENTRIES'; payload: TimeEntry[] }
  | { type: 'ADD_USER'; payload: UserProfile }
  | { type: 'UPDATE_USER'; payload: UserProfile }
  | { type: 'DELETE_USER'; payload: string }
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
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shift: Shift) => void;
  clockIn: (userId: string, shiftId?: string) => void;
  clockOut: (userId: string) => void;
  getUsersByDepartment: (department: string) => UserProfile[];
  getUsersByRole: (role: UserRole) => UserProfile[];
  getActiveShifts: () => Shift[];
  getTodayTimeEntries: () => TimeEntry[];
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export const UserManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userManagementReducer, {
    users: [],
    shifts: [],
    timeEntries: [],
    loading: false
  });

  // Initialize with empty data - ready for real use
  useEffect(() => {
    dispatch({ type: 'LOAD_USERS', payload: [] });
    dispatch({ type: 'LOAD_SHIFTS', payload: [] });
    dispatch({ type: 'LOAD_TIME_ENTRIES', payload: [] });
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

  const deleteUser = (userId: string) => {
    dispatch({ type: 'DELETE_USER', payload: userId });
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

  return (
    <UserManagementContext.Provider value={{
      ...state,
      addUser,
      updateUser,
      deleteUser,
      addShift,
      updateShift,
      clockIn,
      clockOut,
      getUsersByDepartment,
      getUsersByRole,
      getActiveShifts,
      getTodayTimeEntries
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