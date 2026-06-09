// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { permissionService } from '../services/permissionService';
import type { Permission } from '../types/permissions';
import type { User } from '../services/authService';
import api from '../services/api';
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  // Permission checking methods
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  getUserPermissions: () => Permission[];
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const token = localStorage.getItem('accessToken');
    
    if (storedUser && token) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ Email: email, Password: password });
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };
  
  const refreshPermissions = async ():Promise<void> => {
    try {
      const response = await api.get<string[]>('/auth/me/permissions');
      const permissions = response.data as Permission[];

      const updatedUser = { ...user!, permissions };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  };

  const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('accessToken') && user !== null;
  };
  
  const getUserPermissions = (): Permission[] => {
    return user?.permissions || [];
  };
  
  const hasPermission = (permission: Permission): boolean => {
    return permissionService.hasPermission(user?.permissions, permission);
  };
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissionService.hasAnyPermission(user?.permissions, permissions);
  };
  
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissionService.hasAllPermissions(user?.permissions, permissions);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      getUserPermissions,
      refreshPermissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};