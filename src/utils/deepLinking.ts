import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from './supabase';

export function initializeDeepLinking() {
  // Handle deep links when app is already running
  const handleDeepLink = async (url: string) => {
    console.log('Deep link received:', url);

    try {
      const urlObj = new URL(url);

      // Case 1: Supabase direct verify URL (web → app)
      if (url.includes('supabase.co/auth/v1/verify')) {
        const token = urlObj.searchParams.get('token');
        const type = urlObj.searchParams.get('type');

        if (token && type === 'signup') {
          router.push(`/(auth)/verify-email?token=${token}&type=${type}`);
          return;
        }
      }

      // Case 2: App receives a code (PKCE) to exchange for a session
      const code = urlObj.searchParams.get('code');
      if (code) {
        console.log('Deep link has PKCE code, exchanging for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('Exchange result:', { hasSession: !!data?.session, hasError: !!error, error: error?.message });

        if (error) {
          console.error('Error exchanging code for session:', error);
          router.replace('/(auth)/login');
          return;
        }

        const authUser: any = data?.session?.user;
        if (!authUser) {
          console.warn('No user after code exchange; redirecting to login');
          router.replace('/(auth)/login');
          return;
        }

        // Determine role from metadata (AR/TL)
        const role = authUser.user_metadata?.displayName === 'AR' ? 'ARTIST' : 'TATTOO_LOVER';
        const userId = authUser.id as string;

        // Check if profile exists in our users table
        console.log('Checking users table existence for user:', userId);
        const { data: existingUser, error: existErr } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (existErr) {
          console.error('Error checking users table:', existErr);
          // Fallback to home to avoid blocking
          router.replace('/(tabs)');
          return;
        }

        const hasCompletedProfile = !!existingUser;
        console.log('Has completed profile:', hasCompletedProfile, 'role:', role);

        if (hasCompletedProfile) {
          router.replace('/(tabs)');
          return;
        }

        // Route to respective registration step
        if (role === 'ARTIST') {
          router.replace('/(auth)/artist-registration/step-3');
        } else {
          router.replace('/(auth)/user-registration/step-1');
        }
        return;
      }
    } catch (e) {
      console.error('Error handling deep link:', e);
    }
  };

  // Listen for deep links
  const subscription = Linking.addEventListener('url', ({ url }) => {
    // Fire and forget; no need to block
    handleDeepLink(url);
  });

  // Handle deep link if app was opened via deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url);
    }
  });

  return subscription;
}

export function parseAuthCallback(url: string) {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    const type = urlObj.searchParams.get('type');
    const error = urlObj.searchParams.get('error');
    const errorDescription = urlObj.searchParams.get('error_description');
    
    return {
      token,
      type,
      error,
      errorDescription,
    };
  } catch (error) {
    console.error('Error parsing auth callback URL:', error);
    return null;
  }
}
