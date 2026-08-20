import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import RequireAuth from '@/components/auth/RequireAuth';
import RequirePermission from '@/components/auth/RequirePermission';
import LoginPage from '@/pages/LoginPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import { queryClient } from '@/lib/queryClient';
import { BranchProvider } from '@/context/BranchContext';
import AppShell from '@/components/layout/AppShell';
import StockOverviewPage from '@/features/inventory/pages/StockOverviewPage';
import CataloguePage from '@/features/inventory/pages/CataloguePage';
import ReceivingPage from '@/features/inventory/pages/ReceivingPage';
import LossesPage from '@/features/inventory/pages/LossesPage';
import TransfersPage from '@/features/inventory/pages/TransfersPage';
import RequisitionsPage from '@/features/inventory/pages/RequisitionsPage';
import StockCountsListPage from '@/features/inventory/pages/StockCountsListPage';
import StockCountDetailPage from '@/features/inventory/pages/StockCountDetailPage';
import InventoryReportsPage from '@/features/inventory/pages/ReportsPage';
import TillOrdersPage from '@/features/sales/pages/TillOrdersPage';
import OrderDetailPage from '@/features/sales/pages/OrderDetailPage';
import MenuManagementPage from '@/features/sales/pages/MenuManagementPage';
import MpesaReconciliationPage from '@/features/sales/pages/MpesaReconciliationPage';
import ShiftsOversightPage from '@/features/shifts/pages/ShiftsOversightPage';
import ExpensesPage from '@/features/expenses/pages/ExpensesPage';
import FinancialReportsPage from '@/features/reports/pages/FinancialReportsPage';
import './globals.css';

function TillHome() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Welcome, {user?.fullName}</h1>
      <p className="text-muted-foreground">Role: {user?.role}</p>
      <Button asChild>
        <Link to="/till">Go to till</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/inventory">Inventory & stock</Link>
      </Button>
      <Button variant="outline" onClick={() => logout()}>
        Sign out
      </Button>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading…
    </div>
  );
}

export default function App() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'booting') return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <Toaster richColors position="top-right" />
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                status === 'signedOut' ? (
                  <LoginPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/change-password"
              element={
                status === 'needsPasswordChange' ? (
                  <ChangePasswordPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <TillHome />
                </RequireAuth>
              }
            />

            {/* Till: order/tab management */}
            <Route
              path="/till"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<TillOrdersPage />} />
              <Route path=":id" element={<OrderDetailPage />} />
            </Route>

            {/* Sales: menu, M-PESA reconciliation, shifts, expenses, financial reports */}
            <Route
              path="/sales"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route
                path="menu"
                element={
                  <RequirePermission permission="inventory:manage">
                    <MenuManagementPage />
                  </RequirePermission>
                }
              />
              <Route
                path="mpesa"
                element={
                  <RequirePermission permission="payments:confirm-mpesa">
                    <MpesaReconciliationPage />
                  </RequirePermission>
                }
              />
              <Route
                path="shifts"
                element={
                  <RequirePermission permission="shifts:read">
                    <ShiftsOversightPage />
                  </RequirePermission>
                }
              />
              <Route
                path="expenses"
                element={
                  <RequirePermission permission="expenses:read">
                    <ExpensesPage />
                  </RequirePermission>
                }
              />
              <Route
                path="reports"
                element={
                  <RequirePermission permission="reports:read">
                    <FinancialReportsPage />
                  </RequirePermission>
                }
              />
            </Route>

            {/* Inventory & stock */}
            <Route
              path="/inventory"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<StockOverviewPage />} />
              <Route
                path="catalogue"
                element={
                  <RequirePermission permission="inventory:manage">
                    <CataloguePage />
                  </RequirePermission>
                }
              />
              <Route
                path="receiving"
                element={
                  <RequirePermission permission="inventory:receive">
                    <ReceivingPage />
                  </RequirePermission>
                }
              />
              <Route
                path="losses"
                element={
                  <RequirePermission permission="inventory:loss">
                    <LossesPage />
                  </RequirePermission>
                }
              />
              <Route
                path="transfers"
                element={
                  <RequirePermission permission="inventory:transfer">
                    <TransfersPage />
                  </RequirePermission>
                }
              />
              <Route
                path="requisitions"
                element={
                  <RequirePermission permission="inventory:requisition">
                    <RequisitionsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="stock-counts"
                element={
                  <RequirePermission permission="inventory:count">
                    <StockCountsListPage />
                  </RequirePermission>
                }
              />
              <Route
                path="stock-counts/:id"
                element={
                  <RequirePermission permission="inventory:count">
                    <StockCountDetailPage />
                  </RequirePermission>
                }
              />
              <Route path="reports" element={<InventoryReportsPage />} />
            </Route>
          </Routes>
        </Router>
      </BranchProvider>
    </QueryClientProvider>
  );
}
