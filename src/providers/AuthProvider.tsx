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
            const userProfile = await AuthService.getUserProfile(session.user.id);
            setUser(userProfile);
            setSession({
              user: userProfile,
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              expiresAt: session.expires_at || 0,
            });
          } catch (error) {
            console.error('Error fetching user profile:', error);
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

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userProfile = await AuthService.getUserProfile(session.user.id);
        setUser(userProfile);
        setSession({
          user: userProfile,
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at || 0,
        });
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
      
      // Update last login
      await supabase
        .from('users')
        .update({ lastLoginAt: new Date().toISOString() })
        .eq('id', result.user.id);
      
      setUser(result.user);
      setSession(result.session);
      
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
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
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
