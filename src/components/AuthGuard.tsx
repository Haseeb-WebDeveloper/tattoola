import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { useSignupStore } from '../stores/signupStore';
import type { UserRole } from '../types/auth';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRoles?: UserRole[];
  requireVerified?: boolean;
  redirectTo?: any;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireRoles = [],
  requireVerified = false,
  redirectTo = '/(auth)/welcome',
}: AuthGuardProps) {
  const { user, loading, initialized } = useAuth();
  const { pendingVerificationEmail } = useSignupStore();

  useEffect(() => {
    if (!initialized || loading) {
      // console.log('AuthGuard: waiting - initialized:', initialized, 'loading:', loading);
      return; // Still loading, don't redirect yet
    }

    // Don't redirect if we're waiting for email verification
    if (pendingVerificationEmail) {
      // console.log('AuthGuard: pending email verification, staying on current screen');
      return;
    }

    // Check authentication requirement
    if (requireAuth && !user) {
      // console.log('AuthGuard: requireAuth & no user → redirect', redirectTo);
      router.replace(redirectTo);
      return;
    }

    // Check if user shouldn't be here (already authenticated)
    if (!requireAuth && user) {
      // console.log('AuthGuard: guest route but user exists → /(tabs)');
      router.replace('/(tabs)');
      return;
    }

    // Check role requirements
    if (requireAuth && user && requireRoles.length > 0) {
      if (!requireRoles.includes(user.role)) {
        // console.log('AuthGuard: role mismatch → /(tabs)');
        router.replace('/(tabs)'); // Redirect to default authenticated route
        return;
      }
    }

    // Check verification requirement
    if (requireAuth && user && requireVerified && !user.isVerified) {
      // console.log('AuthGuard: unverified → email-confirmation');
      router.replace('/(auth)/email-confirmation');
      return;
    }
  }, [user, loading, initialized, requireAuth, requireRoles, requireVerified, redirectTo, pendingVerificationEmail]);

  // Show loading while checking authentication
  if (!initialized || loading) {
    return (
      <View className='bg-background w-full h-full'>
        <LoadingSpinner message="Loading..." overlay />
      </View>
    );
  }

  // Allow rendering if we're waiting for email verification (even without user)
  if (pendingVerificationEmail) {
    return <>{children}</>;
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
