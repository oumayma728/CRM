/**
 * AuthContext.tsx - Authentication Context for CRM AI
 * Manages user state and authentication across the app.
 *
 * Roles come from the backend Utilisateur table (ADMIN, AGENT, QUALITE, SuperAdmin,
 * CONFIRMATRICE + type CONF1/CONF2/CONFCLIENT, COMMERCIAL, TECH) and are exposed
 * lowercased on `user.role`; `homePathFor` gives each role its landing page.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { getToken, setToken, removeToken, API_BASE, getAuthHeaders } from '../services/api';

export type UserRole =
  | 'superadmin' | 'admin' | 'agent' | 'qualite'
  | 'confirmatrice' | 'commercial' | 'tech';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  nom: string;
  prenom: string;
  role: UserRole | string;
  /** CONF1 | CONF2 | CONFCLIENT for role "confirmatrice" */
  typeConfirmatrice?: string;
  permissions: string[];
}

export type LoginResult = 'success' | 'pending_first_login' | 'must_change_password';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** alias of isLoading (pages from feature/zied1) */
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  /** Stores a session obtained outside `login` (first-login activation). */
  setSession: (token: string, data: SessionPayload) => void;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getUserPermissions: () => string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface SessionPayload {
  id?: number; userId?: number; email: string; nom?: string; prenom?: string;
  role: string; typeConfirmatrice?: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Reads the "permission" claims of the JWT (no signature check — display only). */
function permissionsFromToken(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const p = payload.permission;
    return Array.isArray(p) ? p : p ? [p] : [];
  } catch {
    return [];
  }
}

function toUser(d: SessionPayload, token: string | null): User {
  const prenom = d.prenom ?? '';
  const nom = d.nom ?? '';
  return {
    id: Number(d.userId ?? d.id ?? 0),
    username: d.email,
    email: d.email,
    nom,
    prenom,
    name: `${prenom} ${nom}`.trim() || d.email,
    role: (d.role || 'agent').toLowerCase(),
    typeConfirmatrice: d.typeConfirmatrice?.toUpperCase() || undefined,
    permissions: permissionsFromToken(token),
  };
}

/** Landing page for each role. */
export function homePathFor(user: Pick<User, 'role' | 'typeConfirmatrice'> | null): string {
  if (!user) return '/login';
  switch (user.role) {
    case 'superadmin': return '/superadmin/dashboard';
    case 'admin': return '/admin/realtime';
    case 'qualite': return '/qualite/dashboard';
    case 'commercial': return '/commercial/dashboard';
    case 'tech': return '/technique/dashboard';
    case 'confirmatrice': {
      const t = user.typeConfirmatrice?.toUpperCase();
      if (t === 'CONF2') return '/confirmation2/dashboard';
      if (t === 'CONFCLIENT') return '/confirmation-client/dashboard';
      return '/confirmation1/dashboard';
    }
    default: return '/agent/dashboard';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loginInProgress = useRef(false);

  // Restore the session from the stored token
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const me = await api.getMe();
          setUser(toUser(me, token));
        } catch {
          removeToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    if (loginInProgress.current) throw new Error('Connexion déjà en cours.');
    loginInProgress.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.login(email, password);
      setToken(response.token);
      setUser(toUser(response, response.token));
      return 'success';
    } catch (err: any) {
      const message: string = err?.message || 'Login failed';
      if (message.includes('COMPTE_EN_ATTENTE')) return 'pending_first_login';
      if (message.includes('MUST_CHANGE_PASSWORD')) return 'must_change_password';
      setError(message);
      throw err;
    } finally {
      loginInProgress.current = false;
      setIsLoading(false);
    }
  }, []);

  const setSession = useCallback((token: string, data: SessionPayload) => {
    setToken(token);
    setUser(toUser(data, token));
  }, []);

  const logout = useCallback(() => {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() }).catch(() => {});
    removeToken();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await api.resetPassword(token, newPassword);
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!response.ok) {
      let detail = 'Échec du changement de mot de passe';
      try { const e = await response.json(); detail = e.message || e.error || detail; } catch { }
      throw new Error(detail);
    }
  }, []);

  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.role === 'superadmin';

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loading: isLoading,
    error,
    login,
    setSession,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    hasPermission: (p) => isSuperAdmin || permissions.includes(p),
    hasAnyPermission: (ps) => isSuperAdmin || ps.some((p) => permissions.includes(p)),
    hasAllPermissions: (ps) => isSuperAdmin || ps.every((p) => permissions.includes(p)),
    getUserPermissions: () => permissions,
    isAdmin: user?.role === 'admin' || isSuperAdmin,
    isSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
