import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { logger } from './logger';
import { supabase } from './supabase';

export function initializeDeepLinking() {
  // Handle deep links when app is already running
  const handleDeepLink = async (url: string) => {
    logger.log('Deep link handler called with URL:', url);

    try {
      // Log raw URL for debugging
      logger.log('URL Analysis:', {
        hasSupabase: url.includes('supabase.co'),
        hasVerify: url.includes('verify'),
        hasToken: url.includes('token'),
        hasCode: url.includes('code'),
      });
      
      const urlObj = new URL(url);
      logger.log('Parsed URL details:', {
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
      });

      // Log all URL parameters
      const allParams: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        allParams[key] = value;
        logger.log(`Param: ${key} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      });

      // Check for PKCE code first (most common case) 
      const code = urlObj.searchParams.get('code');
      if (code) {
        logger.log('Email verification code detected, exchanging for session...');
        
        try {
          // Exchange the code for a session
          logger.log('Calling exchangeCodeForSession...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          logger.log('Exchange completed:', {
            hasError: !!exchangeError,
            hasData: !!data,
            hasUser: !!data?.user
          });
          
          if (exchangeError) {
            logger.error('Code exchange failed:', exchangeError.message);
            router.replace('/(auth)/welcome');
            return;
          }
          
          if (!data || !data.user) {
            logger.error('Code exchange returned no user data');
            router.replace('/(auth)/welcome');
            return;
          }
          
          logger.log('Code exchanged successfully');
          
          // Get user role from metadata
          const authUser: any = data.user;
          const role = authUser?.user_metadata?.displayName === "AR" ? "ARTIST" : "TATTOO_LOVER";
          const userId = authUser?.id;
          
          logger.log('User authenticated via code exchange:', { userId, role });

          // Check if profile exists in users table
          logger.log('Checking if profile exists in users table...');
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, firstName')
            .eq('id', userId)
            .maybeSingle();

          const hasCompletedProfile = !!(existingUser && existingUser.firstName);
          logger.log('Profile check result:', { hasCompletedProfile, hasUser: !!existingUser });

          // Small delay to allow auth state to settle before navigation
          logger.log('Setting timeout for navigation...');
          setTimeout(() => {
            logger.log('Timeout fired, navigating now...');
            // Route based on profile completion and role
            if (hasCompletedProfile) {
              logger.log('Redirecting to tabs (profile complete)');
              router.replace('/(tabs)');
            } else {
              // Route to registration based on role
              logger.log('Redirecting to registration (profile incomplete)');
              if (role === "ARTIST") {
                logger.log('Artist registration step 3');
                router.replace('/(auth)/artist-registration/step-3');
              } else {
                logger.log('User registration step 3');
                router.replace('/(auth)/user-registration/step-3');
              }
            }
          }, 300);
          
          logger.log('Deep link handler completed successfully (waiting for timeout)');
          
        } catch (error) {
          logger.error('Exception during code exchange:', error);
          router.replace('/(auth)/welcome');
        }
        
        return;
      }

      // Case 2: Token-based verification (for email change)
      if (url.includes('supabase.co/auth/v1/verify') || url.includes('verify')) {
        logger.log('Token-based verification detected');
        
        const token = urlObj.searchParams.get('token');
        const type = urlObj.searchParams.get('type');
        const redirectTo = urlObj.searchParams.get('redirect_to');
        const message = urlObj.searchParams.get('message');

        logger.log('Verification details:', { 
          hasToken: !!token, 
          type, 
          redirectTo,
          message,
        });

        // Check for intermediate confirmation message (old email confirmation)
        if (message && message.toLowerCase().includes('proceed to confirm link sent to the other email')) {
          logger.log('Email change intermediate step detected - showing confirmation screen');
          router.replace('/settings/email-confirmation' as any);
          return;
        }

        // Handle token-based verification (email changes)
        if (token && type) {
          logger.log('Processing token-based verification...');
          logger.log('Type:', type);
          
          try {
            // Verify the token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type as any,
            });

            logger.log('Token verification response:', { 
              hasData: !!data, 
              hasError: !!error,
              hasUser: !!data?.user,
              errorMessage: error?.message 
            });

            if (error) {
              logger.error('Token verification failed:', error);
              
              // Check if it's an expired or invalid token
              if (error.message.includes('expired') || error.message.includes('invalid')) {
                router.replace('/settings/email-confirmation' as any);
                setTimeout(() => {
                  // In production, use a proper toast/alert system
                  if (__DEV__) {
                    alert('This link has expired. Please request a new one.');
                  }
                }, 500);
              } else {
                router.replace('/settings' as any);
              }
              return;
            }

            if (data?.user) {
              logger.log('Token verified successfully');
              logger.log('User email:', data.user.email);
              
              // Email change verification completed
              if (type === 'email_change') {
                logger.log('Email change confirmed!');
                
                // Small delay to allow Supabase to process the change
                setTimeout(() => {
                  router.replace('/settings' as any);
                  setTimeout(() => {
                    // In production, use a proper toast system
                    if (__DEV__) {
                      alert('Email successfully updated!');
                    }
                  }, 500);
                }, 300);
                return;
              }
            }

            logger.log('Token verification completed, redirecting...');
            router.replace('/settings' as any);
            
          } catch (error) {
            logger.error('Error during token verification:', error);
            router.replace('/settings' as any);
          }
          
          return;
        }

        logger.warn('Token-based verification URL detected but missing token or type parameters');
      }

      // Case 3: Just opened via deep link (no code/token) - check if user has session
      logger.log('Deep link without parameters - checking session...');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        const authUser: any = sessionData.session.user;
        const role = authUser.user_metadata?.displayName === 'AR' ? 'ARTIST' : 'TATTOO_LOVER';
        const userId = authUser.id;

        logger.log('Found existing session:', { userId, role });

        // Check if profile exists
        logger.log('Checking profile completion...');
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, firstName')
          .eq('id', userId)
          .maybeSingle();

        const hasCompletedProfile = !!(existingUser && existingUser.firstName);
        logger.log('Profile check result:', { hasCompletedProfile, hasUser: !!existingUser });

        if (hasCompletedProfile) {
          logger.log('Redirecting to tabs (profile complete)');
          router.replace('/(tabs)');
        } else {
          // Route to registration
          logger.log('Redirecting to registration (profile incomplete)');
          if (role === 'ARTIST') {
            logger.log('Artist registration step 3');
            router.replace('/(auth)/artist-registration/step-3');
          } else {
            logger.log('User registration step 3');
            router.replace('/(auth)/user-registration/step-3');
          }
        }
        return;
      } else {
        logger.log('No session found, index.tsx will handle routing');
      }
    } catch (e) {
      logger.error('Error handling deep link:', e);
      logger.log('handleDeepLink caught error, will complete now');
    } finally {
      logger.log('handleDeepLink COMPLETED');
    }
  };

  // Listen for deep links
  logger.log('Setting up deep link event listener...');
  const subscription = Linking.addEventListener('url', ({ url }) => {
    logger.log('Event listener fired with URL:', url);
    
    // Ensure URL is valid before processing
    if (!url || typeof url !== 'string') {
      logger.error('Invalid URL received:', url);
      return;
    }
    
    // Fire and forget; no need to block
    handleDeepLink(url).catch((error) => {
      logger.error('Error in handleDeepLink:', error);
    });
  });
  logger.log('Deep link event listener attached');

  // Handle deep link if app was opened via deep link
  logger.log('Checking for initial URL...');
  Linking.getInitialURL().then((url) => {
    logger.log('Initial URL:', url || 'none');
    if (url) {
      logger.log('Processing initial URL...');
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
    logger.error('Error parsing auth callback URL:', error);
    return null;
  }
}
