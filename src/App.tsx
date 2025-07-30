import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/providers/AppProviders";
import { useEnhancedAuth } from "@/providers/EnhancedAuthProvider";
import { NotificationHandler } from '@/components/notifications/NotificationHandler';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoginForm } from "@/components/auth/LoginForm";
import { CompleteSignup } from "@/components/auth/CompleteSignup";
import { ForgotPassword } from "@/components/auth/ForgotPassword";
import { ResetPassword } from "@/components/auth/ResetPassword";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import { Inventory } from '@/pages/Inventory';
import { KitchenInventory } from '@/pages/KitchenInventory';
import { Checklists } from '@/pages/Checklists';
import { Communication } from '@/pages/Communication';
import { CashRegister } from '@/pages/CashRegister';
import { Reports } from '@/pages/Reports';
import { Equipment } from '@/pages/Equipment';
import { UserManagement } from '@/pages/UserManagement';
import Settings from '@/pages/Settings';
import { Financial } from '@/pages/Financial';
import { Suppliers } from '@/pages/Suppliers';
import { Tasks } from '@/pages/Tasks';
import { Maintenance } from '@/pages/Maintenance';
import { Profile } from '@/pages/Profile';
import TestDashboard from '@/pages/TestDashboard';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, isLoading, user, profile } = useEnhancedAuth();

  console.log('🚀 AppContent render:', { isLoading, isAuthenticated, hasUser: !!user, hasProfile: !!profile });

  if (isLoading) {
    console.log('⏳ AppContent: Showing loading spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔒 AppContent: User not authenticated, showing login...');
    return (
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/auth/complete-signup" element={<CompleteSignup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<LoginForm />} />
      </Routes>
    );
  }

  console.log('✅ AppContent: User authenticated, showing app...');

  return (
    <>
      <NotificationHandler />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/inventory" element={<Inventory />} />
          <Route path="/app/inventory/kitchen" element={<KitchenInventory />} />
          <Route path="/app/checklists" element={<Checklists />} />
          <Route path="/app/communication" element={<Communication />} />
          <Route path="/app/cash-register" element={<CashRegister />} />
          <Route path="/app/financial" element={<Financial />} />
          <Route path="/app/reports" element={<Reports />} />
          <Route path="/app/equipment" element={<Equipment />} />
          <Route path="/app/users" element={<UserManagement />} />
          <Route path="/app/users/invitations" element={<UserManagement />} />
          <Route path="/app/users/roles" element={<UserManagement />} />
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route path="/app/suppliers/orders" element={<Suppliers />} />
          <Route path="/app/suppliers/list" element={<Suppliers />} />
          <Route path="/app/suppliers/status" element={<Suppliers />} />
          <Route path="/app/suppliers/archived" element={<Suppliers />} />
          <Route path="/app/tasks/assigned" element={<Tasks />} />
          <Route path="/app/tasks/create" element={<Tasks />} />
          <Route path="/app/tasks/history" element={<Tasks />} />
          <Route path="/app/maintenance/report" element={<Maintenance />} />
          <Route path="/app/maintenance/history" element={<Maintenance />} />
          <Route path="/app/maintenance/scheduled" element={<Maintenance />} />
          <Route path="/app/test-dashboard" element={<TestDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProviders queryClient={queryClient}>
      <AppContent />
      <Toaster />
      <Sonner />
    </AppProviders>
  );
};

export default App;
