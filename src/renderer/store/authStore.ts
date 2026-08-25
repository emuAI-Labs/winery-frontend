import { create } from 'zustand';
import { AuthError, AuthUser } from '../../shared/authTypes';

export type AuthStatus =
  | 'booting'
  | 'signedOut'
  | 'needsPasswordChange'
  | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  offline: boolean;
  lastError: AuthError | null;
  bootstrap: () => Promise<void>;
  login: (
    username: string,
    password: string,
    deviceLabel?: string,
  ) => Promise<boolean>;
  logout: (allDevices?: boolean) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  clearError: () => void;
}

function statusForUser(user: AuthUser | null): AuthStatus {
  if (!user) return 'signedOut';
  return user.mustChangePassword ? 'needsPasswordChange' : 'signedIn';
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  user: null,
  offline: false,
  lastError: null,

  bootstrap: async () => {
    const result = await window.auth.bootstrap();
    set({
      user: result.user,
      offline: result.offline,
      status: statusForUser(result.user),
    });
  },

  login: async (username, password, deviceLabel) => {
    set({ lastError: null });
    const res = await window.auth.login(username, password, deviceLabel);
    if (res.ok && res.data) {
      const { user } = res.data;
      set({ user, offline: false, status: statusForUser(user) });
      return true;
    }
    set({ lastError: res.error });
    return false;
  },

  logout: async (allDevices = false) => {
    await window.auth.logout(allDevices);
    set({ user: null, status: 'signedOut', lastError: null });
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ lastError: null });
    const res = await window.auth.changePassword(currentPassword, newPassword);
    if (res.ok) {
      // The backend's response here is just a confirmation message, not an
      // updated user — mirror what authService already does on the main
      // side and flip the flag on the user we already have, rather than
      // trusting a `user` key that was never in the response body.
      set((state) => {
        const user = state.user ? { ...state.user, mustChangePassword: false } : null;
        return { user, status: statusForUser(user) };
      });
      return true;
    }
    set({ lastError: res.error });
    return false;
  },

  clearError: () => set({ lastError: null }),
}));

export function selectUser(state: AuthState) {
  return state.user;
}

export function useCurrentUser(): AuthUser | null {
  return useAuthStore((s) => s.user);
}
