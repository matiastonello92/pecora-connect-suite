import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Equipment, MaintenanceRecord, MaintenanceSchedule, EquipmentStatus, MaintenanceType } from '@/types/equipment';
import { useAuth } from '@/context/AuthContext';

interface EquipmentState {
  equipment: Equipment[];
  maintenanceRecords: MaintenanceRecord[];
  maintenanceSchedule: MaintenanceSchedule[];
  loading: boolean;
}

type EquipmentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_EQUIPMENT'; payload: Equipment[] }
  | { type: 'LOAD_MAINTENANCE_RECORDS'; payload: MaintenanceRecord[] }
  | { type: 'LOAD_MAINTENANCE_SCHEDULE'; payload: MaintenanceSchedule[] }
  | { type: 'ADD_EQUIPMENT'; payload: Equipment }
  | { type: 'UPDATE_EQUIPMENT'; payload: Equipment }
  | { type: 'DELETE_EQUIPMENT'; payload: string }
  | { type: 'ADD_MAINTENANCE_RECORD'; payload: MaintenanceRecord }
  | { type: 'UPDATE_EQUIPMENT_STATUS'; payload: { equipmentId: string; status: EquipmentStatus } };

const equipmentReducer = (state: EquipmentState, action: EquipmentAction): EquipmentState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_EQUIPMENT':
      return { ...state, equipment: action.payload };
    case 'LOAD_MAINTENANCE_RECORDS':
      return { ...state, maintenanceRecords: action.payload };
    case 'LOAD_MAINTENANCE_SCHEDULE':
      return { ...state, maintenanceSchedule: action.payload };
    case 'ADD_EQUIPMENT':
      return { ...state, equipment: [...state.equipment, action.payload] };
    case 'UPDATE_EQUIPMENT':
      return {
        ...state,
        equipment: state.equipment.map(eq => 
          eq.id === action.payload.id ? action.payload : eq
        )
      };
    case 'DELETE_EQUIPMENT':
      return {
        ...state,
        equipment: state.equipment.filter(eq => eq.id !== action.payload)
      };
    case 'ADD_MAINTENANCE_RECORD':
      return {
        ...state,
        maintenanceRecords: [action.payload, ...state.maintenanceRecords]
      };
    case 'UPDATE_EQUIPMENT_STATUS':
      return {
        ...state,
        equipment: state.equipment.map(eq =>
          eq.id === action.payload.equipmentId
            ? { ...eq, status: action.payload.status }
            : eq
        )
      };
    default:
      return state;
  }
};

interface EquipmentContextType extends EquipmentState {
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  updateEquipment: (equipment: Equipment) => void;
  deleteEquipment: (equipmentId: string) => void;
  updateEquipmentStatus: (equipmentId: string, status: EquipmentStatus) => void;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
  getEquipmentByStatus: (status: EquipmentStatus) => Equipment[];
  getOverdueMaintenance: () => MaintenanceSchedule[];
  getUpcomingMaintenance: (days: number) => MaintenanceSchedule[];
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(equipmentReducer, {
    equipment: [],
    maintenanceRecords: [],
    maintenanceSchedule: [],
    loading: false
  });

  // Initialize with empty data - ready for real use
  useEffect(() => {
    dispatch({ type: 'LOAD_EQUIPMENT', payload: [] });
    dispatch({ type: 'LOAD_MAINTENANCE_RECORDS', payload: [] });
    dispatch({ type: 'LOAD_MAINTENANCE_SCHEDULE', payload: [] });
  }, []);

  const addEquipment = (equipmentData: Omit<Equipment, 'id'>) => {
    const newEquipment: Equipment = {
      ...equipmentData,
      id: Date.now().toString()
    };
    dispatch({ type: 'ADD_EQUIPMENT', payload: newEquipment });
  };

  const updateEquipment = (equipment: Equipment) => {
    dispatch({ type: 'UPDATE_EQUIPMENT', payload: equipment });
  };

  const deleteEquipment = (equipmentId: string) => {
    dispatch({ type: 'DELETE_EQUIPMENT', payload: equipmentId });
  };

  const updateEquipmentStatus = (equipmentId: string, status: EquipmentStatus) => {
    dispatch({ type: 'UPDATE_EQUIPMENT_STATUS', payload: { equipmentId, status } });
  };

  const addMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: Date.now().toString()
    };
    dispatch({ type: 'ADD_MAINTENANCE_RECORD', payload: newRecord });
  };

  const getEquipmentByStatus = (status: EquipmentStatus) => {
    const userLocations = user?.locations || [user?.location].filter(Boolean) || [];
    return state.equipment.filter(eq => 
      eq.status === status && 
      userLocations.includes(eq.location)
    );
  };

  const getOverdueMaintenance = () => {
    const userLocations = user?.locations || [user?.location].filter(Boolean) || [];
    return state.maintenanceSchedule.filter(schedule => 
      schedule.isOverdue &&
      state.equipment.some(eq => eq.id === schedule.equipmentId && userLocations.includes(eq.location))
    );
  };

  const getUpcomingMaintenance = (days: number) => {
    const userLocations = user?.locations || [user?.location].filter(Boolean) || [];
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return state.maintenanceSchedule.filter(schedule => 
      !schedule.isOverdue && schedule.nextDue <= targetDate &&
      state.equipment.some(eq => eq.id === schedule.equipmentId && userLocations.includes(eq.location))
    );
  };

  return (
    <EquipmentContext.Provider value={{
      ...state,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      updateEquipmentStatus,
      addMaintenanceRecord,
      getEquipmentByStatus,
      getOverdueMaintenance,
      getUpcomingMaintenance
    }}>
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
};