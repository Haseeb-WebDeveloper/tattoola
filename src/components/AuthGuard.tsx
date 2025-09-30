import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import type { UserRole } from '../types/auth';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRoles?: UserRole[];
  requireVerified?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireRoles = [],
  requireVerified = false,
  redirectTo = '/(auth)/login',
}: AuthGuardProps) {
  const { user, loading, initialized } = useAuth();

  useEffect(() => {
    if (!initialized || loading) {
      return; // Still loading, don't redirect yet
    }

    // Check authentication requirement
    if (requireAuth && !user) {
      router.replace(redirectTo);
      return;
    }

    // Check if user shouldn't be here (already authenticated)
    if (!requireAuth && user) {
      router.replace('/(tabs)');
      return;
    }

    // Check role requirements
    if (requireAuth && user && requireRoles.length > 0) {
      if (!requireRoles.includes(user.role)) {
        router.replace('/(tabs)'); // Redirect to default authenticated route
        return;
      }
    }

    // Check verification requirement
    if (requireAuth && user && requireVerified && !user.isVerified) {
      router.replace('/(auth)/email-confirmation');
      return;
    }
  }, [user, loading, initialized, requireAuth, requireRoles, requireVerified, redirectTo]);

  // Show loading while checking authentication
  if (!initialized || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <LoadingSpinner message="Loading..." overlay />
      </View>
    );
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  if (requireAuth && user && requireRoles.length > 0 && !requireRoles.includes(user.role)) {
    return null;
  }

  if (requireAuth && user && requireVerified && !user.isVerified) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components
export function RequireAuth({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={true} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireGuest({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={false} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireRole({ 
  children, 
  roles, 
  ...props 
}: Omit<AuthGuardProps, 'requireRoles'> & { roles: UserRole[] }) {
  return (
    <AuthGuard requireRoles={roles} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireVerified({ children, ...props }: Omit<AuthGuardProps, 'requireVerified'>) {
  return (
    <AuthGuard requireVerified={true} {...props}>
      {children}
    </AuthGuard>
  );
}
