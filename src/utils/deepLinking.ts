import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from './supabase';

export function initializeDeepLinking() {
  // Handle deep links when app is already running
  const handleDeepLink = async (url: string) => {
    console.log('🔗 ========================================');
    console.log('🔗 handleDeepLink CALLED with URL:', url);
    console.log('🔗 ========================================');

    try {

      const urlObj = new URL(url);
      console.log('🔗 Parsed URL details:', {
        href: urlObj.href,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        search: urlObj.search,
        searchParams: Object.fromEntries(urlObj.searchParams.entries())
      });

      // Case 1: Supabase direct verify URL (web → app)
      if (url.includes('supabase.co/auth/v1/verify')) {
        console.log('📧 ========== EMAIL VERIFICATION DETECTED ==========');
        console.log('📧 Setting verification processing state...');
        
        const token = urlObj.searchParams.get('token');
        const type = urlObj.searchParams.get('type');
        const redirectTo = urlObj.searchParams.get('redirect_to');

        console.log('📧 Verification details:', { 
          hasToken: !!token, 
          type, 
          redirectTo,
          tokenPrefix: token?.substring(0, 20) + '...'
        });

        if (token && type === 'signup') {
          console.log('📧 Navigating to verify-email screen with token');
          router.push(`/(auth)/verify-email?token=${token}&type=${type}`);
          return;
        } else {
          console.warn('⚠️ Invalid verification parameters');
        }
      }

      // Case 2: App receives a code (PKCE) to exchange for a session
      const code = urlObj.searchParams.get('code');
      if (code) {
        console.log('🔐 Email verification code detected, exchanging for session...');
        
        try {
          // Simply exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ Code exchange failed:', exchangeError.message);
            router.replace('/(auth)/welcome');
            return;
          }
          
          console.log('✅ Code exchanged successfully');
          console.log('🔄 Auth state change will trigger, letting AuthProvider + screens handle routing...');
          
          // That's it! AuthProvider will detect the auth state change,
          // set the user, and then index.tsx or welcome screen will handle routing
          
        } catch (error) {
          console.error('❌ Exception during code exchange:', error);
          router.replace('/(auth)/welcome');
        }
        
        return;
      }

      // Case 3: Just opened via deep link (no code/token) - check if user has session
      console.log('🔗 ========== DEEP LINK WITHOUT PARAMETERS ==========');
      console.log('🔗 Checking current session...');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        const authUser: any = sessionData.session.user;
        const role = authUser.user_metadata?.displayName === 'AR' ? 'ARTIST' : 'TATTOO_LOVER';
        const userId = authUser.id;

        console.log('✅ Found existing session:', { userId, role });

        // Check if profile exists
        console.log('📊 Checking profile completion...');
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, firstName')
          .eq('id', userId)
          .maybeSingle();

        const hasCompletedProfile = !!(existingUser && existingUser.firstName);
        console.log('📊 Profile check result:', { hasCompletedProfile, hasUser: !!existingUser });

        if (hasCompletedProfile) {
          console.log('🏠 Redirecting to tabs (profile complete)');
          router.replace('/(tabs)');
        } else {
          // Route to registration
          console.log('📝 Redirecting to registration (profile incomplete)');
          if (role === 'ARTIST') {
            console.log('🎨 → Artist registration step 3');
            router.replace('/(auth)/artist-registration/step-3');
          } else {
            console.log('💙 → User registration step 3');
            router.replace('/(auth)/user-registration/step-3');
          }
        }
        return;
      } else {
        console.log('ℹ️ No session found, index.tsx will handle routing');
      }
    } catch (e) {
      console.error('❌ Error handling deep link:', e);
      console.error('❌ Error details:', e instanceof Error ? e.message : 'Unknown error');
      
    } finally {
      console.log('🔗 handleDeepLink completed');
    }
  };

  // Listen for deep links
  console.log('🔗 Setting up deep link event listener...');
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('🔗 ========== DEEP LINK EVENT FIRED ==========');
    console.log('🔗 Received URL from event listener:', url);
    // Fire and forget; no need to block
    handleDeepLink(url);
  });
  console.log('✅ Deep link event listener attached');

  // Handle deep link if app was opened via deep link
  console.log('🔗 Checking for initial URL...');
  Linking.getInitialURL().then((url) => {
    console.log('🔗 Initial URL:', url || 'none');
    if (url) {
      console.log('🔗 Processing initial URL...');
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
