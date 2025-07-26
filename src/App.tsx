import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { InventoryProvider } from '@/context/InventoryContext';
import { ChecklistProvider } from '@/context/ChecklistContext';
import { CommunicationProvider } from '@/context/CommunicationContext';
import { CashRegisterProvider } from '@/context/CashRegisterContext';
import { ReportsProvider } from '@/context/ReportsContext';
import { EquipmentProvider } from '@/context/EquipmentContext';
import { UserManagementProvider } from '@/context/UserManagementContext';
import { LoginForm } from "@/components/auth/LoginForm";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import { Inventory } from '@/pages/Inventory';
import { Checklists } from '@/pages/Checklists';
import { Communication } from '@/pages/Communication';
import { CashRegister } from '@/pages/CashRegister';
import { Reports } from '@/pages/Reports';
import { Equipment } from '@/pages/Equipment';
import { UserManagement } from '@/pages/UserManagement';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Placeholder routes for future implementation */}
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/checklists" element={<Checklists />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/cash-register" element={<CashRegister />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InventoryProvider>
          <ChecklistProvider>
            <CommunicationProvider>
              <CashRegisterProvider>
                <ReportsProvider>
                  <EquipmentProvider>
                    <UserManagementProvider>
                      <TooltipProvider>
                        <AppContent />
                        <Toaster />
                        <Sonner />
                      </TooltipProvider>
                    </UserManagementProvider>
                  </EquipmentProvider>
                </ReportsProvider>
              </CashRegisterProvider>
            </CommunicationProvider>
          </ChecklistProvider>
        </InventoryProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
