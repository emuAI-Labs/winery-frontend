import { useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import RequireAuth from '@/components/auth/RequireAuth';
import LoginPage from '@/pages/LoginPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import './globals.css';

function TillHome() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Welcome, {user?.fullName}</h1>
      <p className="text-muted-foreground">Role: {user?.role}</p>
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
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            status === 'signedOut' ? <LoginPage /> : <Navigate to="/" replace />
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
      </Routes>
    </Router>
  );
}
