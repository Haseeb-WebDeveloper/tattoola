import { router } from 'expo-router';
import { useEffect } from 'react';

export default function AuthIndex() {
  useEffect(() => {
    // Redirect to register by default
    router.replace('/(auth)/register');
  }, []);

  return null;
}
