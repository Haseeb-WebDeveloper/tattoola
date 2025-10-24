import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from './supabase';

export function initializeDeepLinking() {
  // Handle deep links when app is already running
  const handleDeepLink = async (url: string) => {
    console.log('');
    console.log('🔗 ==========================================');
    console.log('🔗 DEEP LINK HANDLER CALLED');
    console.log('🔗 URL:', url);
    console.log('🔗 ==========================================');
    console.log('');

    try {
      const urlObj = new URL(url);
      console.log('🔗 Parsed URL details:', {
        href: urlObj.href,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        search: urlObj.search,
        searchParams: Object.fromEntries(urlObj.searchParams.entries())
      });

      // Check for PKCE code first (most common case) 
      const code = urlObj.searchParams.get('code');
      if (code) {
        console.log('🔐 Email verification code detected, exchanging for session...');
        console.log('🔐 Code value:', code);
        
        try {
          // Exchange the code for a session
          console.log('🔐 Calling exchangeCodeForSession...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          console.log('🔐 Exchange completed. Error:', !!exchangeError, 'Data:', !!data, 'User:', !!data?.user);
          
          if (exchangeError) {
            console.error('❌ Code exchange failed:', exchangeError.message);
            router.replace('/(auth)/welcome');
            return;
          }
          
          if (!data || !data.user) {
            console.error('❌ Code exchange returned no user data');
            router.replace('/(auth)/welcome');
            return;
          }
          
          console.log('✅ Code exchanged successfully');
          
          // Get user role from metadata
          const authUser: any = data.user;
          const role = authUser?.user_metadata?.displayName === "AR" ? "ARTIST" : "TATTOO_LOVER";
          const userId = authUser?.id;
          
          console.log('👤 User authenticated via code exchange:', { userId, role });

          // Check if profile exists in users table
          console.log('📊 Checking if profile exists in users table...');
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, firstName')
            .eq('id', userId)
            .maybeSingle();

          const hasCompletedProfile = !!(existingUser && existingUser.firstName);
          console.log('📊 Profile check result:', { hasCompletedProfile, hasUser: !!existingUser });

          // Small delay to allow auth state to settle before navigation
          console.log('⏱️ Setting timeout for navigation...');
          setTimeout(() => {
            console.log('⏱️ Timeout fired, navigating now...');
            // Route based on profile completion and role
            if (hasCompletedProfile) {
              console.log('🏠 Redirecting to tabs (profile complete)');
              router.replace('/(tabs)');
            } else {
              // Route to registration based on role
              console.log('📝 Redirecting to registration (profile incomplete)');
              if (role === "ARTIST") {
                console.log('🎨 → Artist registration step 3');
                router.replace('/(auth)/artist-registration/step-3');
              } else {
                console.log('💙 → User registration step 3');
                router.replace('/(auth)/user-registration/step-3');
              }
            }
          }, 300);
          
          console.log('✅ Deep link handler completed successfully (waiting for timeout)');
          
        } catch (error) {
          console.error('❌ Exception during code exchange:', error);
          router.replace('/(auth)/welcome');
        }
        
        return;
      }

      // Case 2: Token-based verification (legacy, for email change)
      if (url.includes('supabase.co/auth/v1/verify') || url.includes('verify')) {
        console.log('📧 ========== TOKEN-BASED VERIFICATION DETECTED ==========');
        
        const token = urlObj.searchParams.get('token');
        const type = urlObj.searchParams.get('type');
        const redirectTo = urlObj.searchParams.get('redirect_to');
        const message = urlObj.searchParams.get('message');

        console.log('📧 Verification details:', { 
          hasToken: !!token, 
          type, 
          redirectTo,
          message,
          tokenPrefix: token?.substring(0, 20) + '...'
        });

        // Check for intermediate confirmation message (old email confirmation)
        if (message && message.toLowerCase().includes('proceed to confirm link sent to the other email')) {
          console.log('📧 Email change intermediate step detected - showing confirmation screen');
          router.replace('/settings/email-confirmation' as any);
          return;
        }

        console.warn('⚠️ Token-based verification detected but no valid token/type - PKCE should be used instead');
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
      console.log('🔗 handleDeepLink caught error, will complete now');
    } finally {
      console.log('🔗 ========================================');
      console.log('🔗 handleDeepLink COMPLETED');
      console.log('🔗 ========================================');
    }
  };

  // Listen for deep links
  console.log('🔗 Setting up deep link event listener...');
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('');
    console.log('🔗 ========================================');
    console.log('🔗 EVENT LISTENER FIRED!');
    console.log('🔗 Received URL:', url);
    console.log('🔗 ========================================');
    console.log('');
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
