import React from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { Navigate } from 'react-router-dom';

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RequirePermission({
  permission,
  children,
  fallback,
  redirectTo,
}: RequirePermissionProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
}

export function RequireAnyPermission({
  permissions,
  children,
  fallback,
}: {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) return null;

  if (hasAnyPermission(permissions)) {
    return <>{children}</>;
  }

  return <>{fallback}</> || null;
}
