import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { InventoryProvider } from '@/context/InventoryContext';
import { KitchenInventoryProvider } from '@/context/KitchenInventoryContext';
import { ChecklistProvider } from '@/context/ChecklistContext';
import { CommunicationProvider } from '@/context/CommunicationContext';
import { ChatProvider } from '@/context/ChatContext';
import { CashRegisterProvider } from '@/context/CashRegisterContext';
import { ReportsProvider } from '@/context/ReportsContext';
import { EquipmentProvider } from '@/context/EquipmentContext';
import { UserManagementProvider } from '@/context/UserManagementContext';
import { FinancialProvider } from '@/context/FinancialContext';
import { LocationProvider } from '@/context/LocationContext';
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
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

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Placeholder routes for future implementation */}
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/kitchen" element={<KitchenInventory />} />
        <Route path="/checklists" element={<Checklists />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/cash-register" element={<CashRegister />} />
        <Route path="/financial" element={<Financial />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/settings" element={<Settings />} />
        {/* Supplier routes */}
        <Route path="/suppliers/orders" element={<Suppliers />} />
        <Route path="/suppliers/list" element={<Suppliers />} />
        <Route path="/suppliers/status" element={<Suppliers />} />
        <Route path="/suppliers/archived" element={<Suppliers />} />
        {/* Task routes */}
        <Route path="/tasks/assigned" element={<Tasks />} />
        <Route path="/tasks/create" element={<Tasks />} />
        <Route path="/tasks/history" element={<Tasks />} />
        {/* Maintenance routes */}
        <Route path="/maintenance/report" element={<Maintenance />} />
        <Route path="/maintenance/history" element={<Maintenance />} />
        <Route path="/maintenance/scheduled" element={<Maintenance />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <InventoryProvider>
            <KitchenInventoryProvider>
              <ChecklistProvider>
                <CommunicationProvider>
                  <ChatProvider>
                     <CashRegisterProvider>
                      <ReportsProvider>
                        <EquipmentProvider>
                          <UserManagementProvider>
                            <FinancialProvider>
                              <LocationProvider>
                                <TooltipProvider>
                                  <AppContent />
                                  <Toaster />
                                  <Sonner />
                                </TooltipProvider>
                              </LocationProvider>
                            </FinancialProvider>
                          </UserManagementProvider>
                        </EquipmentProvider>
                      </ReportsProvider>
                    </CashRegisterProvider>
                  </ChatProvider>
                </CommunicationProvider>
              </ChecklistProvider>
            </KitchenInventoryProvider>
          </InventoryProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
