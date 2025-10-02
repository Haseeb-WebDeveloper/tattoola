import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import type {
  AuthContextType,
  AuthSession,
  CompleteArtistRegistration,
  CompleteUserRegistration,
  ForgotPasswordData,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordData,
  User,
} from '../types/auth';
import { supabase } from '../utils/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (session?.user) {
          try {
            const authUser: any = session.user;
            const isVerified = !!authUser.email_confirmed_at;
            const role = authUser.user_metadata?.displayName === 'AR' ? 'ARTIST' : 'TATTOO_LOVER';
            const minimalUser: any = {
              id: authUser.id,
              email: authUser.email,
              username: authUser.user_metadata?.username || '',
              isActive: true,
              isVerified,
              isPublic: role === 'TATTOO_LOVER',
              role,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            setUser(minimalUser);
            setSession({
              user: minimalUser,
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              expiresAt: session.expires_at || 0,
            });

            // Do NOT run checkProfileCompletion here, only after login
            // Only redirect to registration step if verified and just signed up (handled in signIn)
          } catch (error) {
            console.error('Error initializing minimal auth user:', error);
            setUser(null);
            setSession(null);
          }
        } else {
          setUser(null);
          setSession(null);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileCompletion = async (userId: string, role: string): Promise<boolean> => {
    try {
      // Simple check: if user exists in our custom users table, profile is complete
      console.log('Checking if user exists in users table for userId:', userId);
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      console.log('User existence check result:', { data: userProfile, error });

      // If user exists in users table, profile is complete
      // If user doesn't exist or there's an error, profile is not complete
      const exists = !error && !!userProfile;
      console.log('User exists in users table:', exists);
      return exists;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const authUser: any = session.user;
        const isVerified = !!authUser.email_confirmed_at;
        const role = authUser.user_metadata?.displayName === 'AR' ? 'ARTIST' : 'TATTOO_LOVER';
        const minimalUser: any = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata?.username || '',
          isActive: true,
          isVerified,
          isPublic: role === 'TATTOO_LOVER',
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setUser(minimalUser);
        setSession({
          user: minimalUser,
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at || 0,
        });

        // Do NOT run checkProfileCompletion here, only after login
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(credentials);


      setUser(result.user);
      setSession(result.session);
      // After login, check profile completion and redirect accordingly
      if (result.user && result.user.id && result.user.role) {
        console.log('Sign in result user role:', result.user.role);
        const isVerified = result.user.isVerified;
        console.log('Sign in result user is verified:', isVerified);
        
        if (isVerified) {
          const hasCompletedProfile = await checkProfileCompletion(result.user.id, result.user.role);
          console.log('Sign in result user has completed profile:', hasCompletedProfile);
          
          // If user does NOT exist in users table, redirect to registration steps
          if (!hasCompletedProfile) {
            if (result.user.role === 'ARTIST') {
              console.log('Sign in result user role is artist, redirecting to artist management/registration steps');
              // Redirect to artist management/registration steps
              setTimeout(() => {
                router.replace('/(auth)/artist-registration/step-0');
              }, 100);
            } else if (result.user.role === 'TATTOO_LOVER') {
              console.log('Sign in result user role is tattoo lover, redirecting to user management/registration steps');
              // Redirect to user management/registration steps
              setTimeout(() => {
                router.replace('/(auth)/user-registration/step-1');
              }, 100);
            } else {
              // fallback: go to home
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 100);
            }
            // Return here to prevent further navigation
            return result;
          } else {
            // Profile is complete, redirect to home
            console.log('Profile is complete, redirecting to home');
            router.replace('/(tabs)');
          }
        } else {
          // User is not verified, redirect to email verification
          console.log('User is not verified, redirecting to email verification');
          router.replace('/(auth)/verify-email');
        }
      }

      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: RegisterCredentials) => {
    setLoading(true);
    try {
      const result = await AuthService.signUp(credentials);

      // Don't set user/session here if email verification is required
      if (!result.needsVerification) {
        setUser(result.user);
      }

      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if sign out fails, we should clear the local state
    } finally {
      // Always clear local state regardless of sign out success
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    setLoading(true);
    try {
      await AuthService.forgotPassword(data);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    setLoading(true);
    try {
      await AuthService.resetPassword(data);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeUserRegistration = async (data: CompleteUserRegistration) => {
    setLoading(true);
    try {
      const updatedUser = await AuthService.completeUserRegistration(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Complete user registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeArtistRegistration = async (data: CompleteArtistRegistration) => {
    setLoading(true);
    try {
      const updatedUser = await AuthService.completeArtistRegistration(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Complete artist registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    setLoading(true);
    try {
      const updatedUser = await AuthService.updateProfile(user.id, updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return null;

    try {
      const refreshedUser = await AuthService.getUserProfile(user.id);
      setUser(refreshedUser);
      return refreshedUser;
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  };

  const resendVerificationEmail = async () => {
    setLoading(true);
    try {
      await AuthService.resendVerificationEmail();
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setLoading(true);
    try {
      await AuthService.verifyEmail(token);

      // Refresh user to get updated verification status
      if (user) {
        const refreshedUser = await AuthService.getUserProfile(user.id);
        setUser(refreshedUser);
      }
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    completeUserRegistration,
    completeArtistRegistration,
    updateProfile,
    refreshUser,
    resendVerificationEmail,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hooks
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useSession() {
  const { session } = useAuth();
  return session;
}

export function useAuthLoading() {
  const { loading } = useAuth();
  return loading;
}
