import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken } from '../services/api';

interface PermissionContextType {
  permissions: string[];
  role: string;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const BASE_URL = (import.meta as any).env.VITE_API_URL || '';

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const refreshPermissions = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setPermissions([]);
        setRole('');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/auth/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
        setRole(data.role || '');
      } else {
        setPermissions([]);
        setRole('');
      }
    } catch {
      setPermissions([]);
      setRole('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: string[]) => perms.some(p => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: string[]) => perms.every(p => permissions.includes(p)),
    [permissions]
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        role,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isLoading,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionContext;
