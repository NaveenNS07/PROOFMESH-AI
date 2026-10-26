import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserRecord, UserRole } from '../types/domain';
import { signOutFirebase } from '../lib/firebase';
import { executeLocalApiFallback } from '../lib/localApiFallback';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'info' | 'success' | 'warning' | 'critical';
}

interface AppContextValue {
  currentUser: UserRecord;
  demoAccounts: UserRecord[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  switchUserByEmailOrRole: (email?: string, role?: UserRole) => Promise<UserRecord | null>;
  logout: () => Promise<void>;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  unreadNotificationsCount: number;
  refreshNotificationsCount: () => Promise<void>;
}

const DEFAULT_OFFICER: UserRecord = {
  id: 'USR-OFF-01',
  email: 'officer@proofmesh-demo.gov.in',
  fullName: 'Dr. Arvind Raghavan',
  role: UserRole.REGULATORY_OFFICER,
  institutionId: null,
  institutionName: null,
  department: 'Regulation Bureau — South-West Scrutiny Desk',
  active: true,
  reviewScope: ['South-West Region', 'EoA & Intake Expansion Scrutiny'],
  lastLoginAt: '2026-10-26T05:00:00Z',
  createdAt: '2026-01-12T08:00:00Z',
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRecord>(() => {
    try {
      const saved = sessionStorage.getItem('pm_active_user');
      return saved ? (JSON.parse(saved) as UserRecord) : DEFAULT_OFFICER;
    } catch {
      return DEFAULT_OFFICER;
    }
  });
  const [demoAccounts, setDemoAccounts] = useState<UserRecord[]>([DEFAULT_OFFICER]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(4);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const setTheme = useCallback((_next: 'light' | 'dark') => {
    setThemeState('light');
    document.documentElement.classList.remove('dark');
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `tst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const apiFetch = useCallback(
    async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }
      headers.set('x-user-id', currentUser.id);
      try {
        const res = await fetch(url, { ...options, headers });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return (await res.json()) as T;
        }
        if (!contentType.includes('application/json') || res.status === 404 || res.status >= 500) {
          return await executeLocalApiFallback<T>(url, options, currentUser.id);
        }
        let errMessage = `Request failed (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson.error || errJson.message) {
            errMessage = errJson.error || errJson.message;
          }
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      } catch (err: any) {
        if (err?.message?.includes('Request failed') || err?.message?.includes('not authorized')) {
          throw err;
        }
        return await executeLocalApiFallback<T>(url, options, currentUser.id);
      }
    },
    [currentUser.id]
  );

  const refreshNotificationsCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ notifications: { isRead: boolean }[] }>('/api/v1/notifications');
      setUnreadNotificationsCount(data.notifications.filter((n) => !n.isRead).length);
    } catch {
      // ignore
    }
  }, [apiFetch]);

  useEffect(() => {
    apiFetch<{ user: UserRecord; demoAccounts: UserRecord[] }>('/api/v1/auth/me')
      .then((data) => {
        if (data.demoAccounts?.length) {
          setDemoAccounts(data.demoAccounts);
        }
      })
      .catch(() => {});
    refreshNotificationsCount();
  }, [apiFetch, refreshNotificationsCount]);

  const switchUserByEmailOrRole = useCallback(
    async (email?: string, role?: UserRole): Promise<UserRecord | null> => {
      try {
        let user: UserRecord | null = null;
        try {
          const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, roleOverride: role }),
          });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            user = data.user;
          } else {
            const fallback = await executeLocalApiFallback<{ user: UserRecord }>(
              '/api/v1/auth/login',
              {
                method: 'POST',
                body: JSON.stringify({ email, roleOverride: role }),
              },
              currentUser.id
            );
            user = fallback.user;
          }
        } catch {
          const fallback = await executeLocalApiFallback<{ user: UserRecord }>(
            '/api/v1/auth/login',
            {
              method: 'POST',
              body: JSON.stringify({ email, roleOverride: role }),
            },
            currentUser.id
          );
          user = fallback.user;
        }
        if (!user) return null;
        setCurrentUser(user);
        sessionStorage.setItem('pm_active_user', JSON.stringify(user));
        addToast({
          title: `Workspace Active: ${user.fullName}`,
          description: `Role: ${user.role.replace(/_/g, ' ')}`,
          variant: 'success',
        });
        return user;
      } catch (e: any) {
        addToast({
          title: 'Login Failed',
          description: e.message || 'Unable to sign in with selected credentials.',
          variant: 'critical',
        });
        return null;
      }
    },
    [addToast, currentUser.id]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    await signOutFirebase();
    sessionStorage.removeItem('pm_active_user');
    addToast({
      title: 'Session Terminated',
      description: 'You have been securely logged out of the regulatory workspace.',
      variant: 'info',
    });
  }, [apiFetch, addToast]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        demoAccounts,
        theme,
        setTheme,
        switchUserByEmailOrRole,
        logout,
        apiFetch,
        toasts,
        addToast,
        dismissToast,
        unreadNotificationsCount,
        refreshNotificationsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
