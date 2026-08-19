/**
 * AuthContext.tsx - Authentication Context for CRM AI
 * Manages user state and authentication across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getToken, setToken, removeToken } from '../services/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'agent' | 'qualite';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await api.getMe();
          setUser({
            ...userData,
            role: userData.role as 'admin' | 'agent' | 'qualite',
          });
        } catch (err) {
          // Token invalid or expired
          removeToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login(username, password);
      setToken(response.token);
      setUser({
        ...response.user,
        role: response.user.role as 'admin' | 'agent' | 'qualite',
      });
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await api.forgotPassword(email);
    } catch (err: any) {
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      await api.resetPassword(token, newPassword);
    } catch (err: any) {
      throw err;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    isAdmin: user?.role === 'admin',
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