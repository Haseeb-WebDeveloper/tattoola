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
      console.log('AuthProvider: Starting initializeAuth');
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthProvider: Got session:', session?.user?.id || 'no session');

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
        console.log('AuthProvider: Set user from session');
      } else {
        // No session, ensure user is null
        console.log('AuthProvider: No session, setting user to null');
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // On error, ensure user is null
      console.log('AuthProvider: Error occurred, setting user to null');
      setUser(null);
      setSession(null);
    } finally {
      console.log('AuthProvider: Setting loading to false and initialized to true');
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
                router.replace('/(auth)/artist-registration/step-3');
              }, 100);
            } else if (result.user.role === 'TATTOO_LOVER') {
              console.log('Sign in result user role is tattoo lover, redirecting to user management/registration steps starting at step-3');
              // Redirect to user management/registration steps (V2 starts at step-3)
              setTimeout(() => {
                router.replace('/(auth)/user-registration/step-3');
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
    console.log("🚀 AuthProvider.signUp: Starting signup process", { 
      email: credentials.email, 
      role: credentials.role 
    });
    setLoading(true);
    try {
      console.log("📞 AuthProvider.signUp: Calling AuthService.signUp");
      const result = await AuthService.signUp(credentials);
      console.log("📞 AuthProvider.signUp: AuthService.signUp completed", { 
        needsVerification: result.needsVerification,
        hasUser: !!result.user 
      });

      // Don't set user/session here if email verification is required
      if (!result.needsVerification) {
        console.log("👤 AuthProvider.signUp: Setting user (no verification needed)");
        setUser(result.user);
      } else {
        console.log("📧 AuthProvider.signUp: Email verification required, not setting user");
      }

      console.log("✅ AuthProvider.signUp: Signup completed successfully");
      return result;
    } catch (error) {
      console.error('❌ AuthProvider.signUp: Signup failed', error);
      throw error;
    } finally {
      console.log("🏁 AuthProvider.signUp: Setting loading to false");
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
    console.log("🔐 AuthProvider.verifyEmail: Starting email verification", { 
      tokenLength: token?.length,
      hasUser: !!user 
    });
    setLoading(true);
    try {
      console.log("📞 AuthProvider.verifyEmail: Calling AuthService.verifyEmail");
      await AuthService.verifyEmail(token);
      console.log("✅ AuthProvider.verifyEmail: Email verification successful");

      // Refresh user to get updated verification status
      if (user) {
        console.log("👤 AuthProvider.verifyEmail: Refreshing user profile", { userId: user.id });
        const refreshedUser = await AuthService.getUserProfile(user.id);
        setUser(refreshedUser);
        console.log("✅ AuthProvider.verifyEmail: User profile refreshed");
      } else {
        console.warn("⚠️ AuthProvider.verifyEmail: No user to refresh");
      }
    } catch (error) {
      console.error('❌ AuthProvider.verifyEmail: Email verification failed', error);
      throw error;
    } finally {
      console.log("🏁 AuthProvider.verifyEmail: Setting loading to false");
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    logout,
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
