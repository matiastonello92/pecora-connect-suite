import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { Inventory } from './pages/Inventory';
import { KitchenInventory } from './pages/KitchenInventory';
import { Checklists } from './pages/Checklists';
import { Suppliers } from './pages/Suppliers';
import { Equipment } from './pages/Equipment';
import { Financial } from './pages/Financial';
import { CashRegister } from './pages/CashRegister';
import { Reports } from './pages/Reports';
import { Tasks } from './pages/Tasks';
import { Communication } from './pages/Communication';
import { Settings } from './pages/Settings';
import { Maintenance } from './pages/Maintenance';
import { Profile } from './pages/Profile';
import NotFound from './pages/NotFound';
import { AppLayout } from './components/layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/app',
    element: <AppLayout><Outlet /></AppLayout>,
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'inventory',
        element: <Inventory />,
      },
      {
        path: 'kitchen-inventory',
        element: <KitchenInventory />,
      },
      {
        path: 'checklists',
        element: <Checklists />,
      },
      {
        path: 'suppliers',
        element: <Suppliers />,
      },
      {
        path: 'equipment',
        element: <Equipment />,
      },
      {
        path: 'financial',
        element: <Financial />,
      },
      {
        path: 'cash-register',
        element: <CashRegister />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'tasks',
        element: <Tasks />,
      },
      {
        path: 'communication',
        element: <Communication />,
      },
      {
        path: 'maintenance',
        element: <Maintenance />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);