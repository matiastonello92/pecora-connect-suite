import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Equipment, MaintenanceRecord, MaintenanceSchedule, EquipmentStatus, MaintenanceType } from '@/types/equipment';

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
  const [state, dispatch] = useReducer(equipmentReducer, {
    equipment: [],
    maintenanceRecords: [],
    maintenanceSchedule: [],
    loading: false
  });

  // Mock data
  useEffect(() => {
    const mockEquipment: Equipment[] = [
      {
        id: '1',
        name: 'Pizza Oven #1',
        category: 'kitchen',
        model: 'Pavesi Forni RPM 120',
        serialNumber: 'PF2024001',
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2026-01-15'),
        location: 'Main Kitchen',
        department: 'kitchen',
        status: 'operational',
        lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        notes: 'Regular weekly cleaning performed'
      },
      {
        id: '2',
        name: 'Espresso Machine',
        category: 'bar',
        model: 'La Marzocco Linea PB',
        serialNumber: 'LM2024002',
        purchaseDate: new Date('2023-06-10'),
        warrantyExpiry: new Date('2025-06-10'),
        location: 'Main Bar',
        department: 'service',
        status: 'maintenance',
        lastMaintenance: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        notes: 'Descaling in progress'
      },
      {
        id: '3',
        name: 'Dishwasher',
        category: 'cleaning',
        model: 'Hobart UX25EA',
        serialNumber: 'HB2024003',
        purchaseDate: new Date('2023-03-20'),
        location: 'Dish Pit',
        department: 'kitchen',
        status: 'broken',
        lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Pump failure - repair scheduled'
      }
    ];

    const mockMaintenanceRecords: MaintenanceRecord[] = [
      {
        id: '1',
        equipmentId: '1',
        type: 'routine',
        description: 'Weekly deep cleaning and calibration',
        performedBy: 'kitchen@pecora.com',
        performedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        duration: 120,
        nextMaintenanceDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        notes: 'All systems functioning normally'
      },
      {
        id: '2',
        equipmentId: '2',
        type: 'deep-clean',
        description: 'Descaling and group head cleaning',
        performedBy: 'service@pecora.com',
        performedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        cost: 85.00,
        duration: 180,
        nextMaintenanceDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        partsUsed: [
          { name: 'Descaling solution', quantity: 2, cost: 25.00 },
          { name: 'Group screen', quantity: 1, cost: 15.00 }
        ]
      }
    ];

    const mockMaintenanceSchedule: MaintenanceSchedule[] = [
      {
        id: '1',
        equipmentId: '1',
        equipment: mockEquipment[0],
        type: 'routine',
        frequency: 30,
        lastPerformed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        nextDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isOverdue: false,
        assignedTo: 'kitchen@pecora.com',
        priority: 'medium'
      },
      {
        id: '2',
        equipmentId: '3',
        equipment: mockEquipment[2],
        type: 'repair',
        frequency: 0,
        nextDue: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isOverdue: true,
        assignedTo: 'maintenance@pecora.com',
        priority: 'high'
      }
    ];

    dispatch({ type: 'LOAD_EQUIPMENT', payload: mockEquipment });
    dispatch({ type: 'LOAD_MAINTENANCE_RECORDS', payload: mockMaintenanceRecords });
    dispatch({ type: 'LOAD_MAINTENANCE_SCHEDULE', payload: mockMaintenanceSchedule });
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
    return state.equipment.filter(eq => eq.status === status);
  };

  const getOverdueMaintenance = () => {
    return state.maintenanceSchedule.filter(schedule => schedule.isOverdue);
  };

  const getUpcomingMaintenance = (days: number) => {
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return state.maintenanceSchedule.filter(schedule => 
      !schedule.isOverdue && schedule.nextDue <= targetDate
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