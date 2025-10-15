import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../providers/AuthProvider';

export default function IndexScreen() {
  const { user, initialized, loading } = useAuth();

  useEffect(() => {
    // console.log('IndexScreen useEffect - user:', user, 'initialized:', initialized, 'loading:', loading);
    
    if (!initialized || loading) {
      console.log('Still initializing or loading, not redirecting yet');
      return; // Still initializing
    }

    if (user) {
      console.log('User is authenticated, redirecting to main app');
      // User is authenticated, redirect to main app
      router.replace('/(tabs)');
    } else {
      console.log('User is not authenticated, redirecting to welcome');
      // User is not authenticated, redirect to welcome
      router.replace('/(auth)/welcome');
    }
  }, [user, initialized, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LoadingSpinner message="Loading Tattoola..." overlay />
    </View>
  );
}
