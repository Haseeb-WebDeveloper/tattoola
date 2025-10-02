import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export function initializeDeepLinking() {
  // Handle deep links when app is already running
  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url);
    
    // Check if this is a Supabase auth callback
    if (url.includes('supabase.co/auth/v1/verify')) {
      // Extract the token from the URL
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      const type = urlObj.searchParams.get('type');
      
      if (token && type === 'signup') {
        // Navigate to verify-email screen with the token
        router.push(`/(auth)/verify-email?token=${token}&type=${type}`);
      }
    }
  };

  // Listen for deep links
  const subscription = Linking.addEventListener('url', ({ url }) => {
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
