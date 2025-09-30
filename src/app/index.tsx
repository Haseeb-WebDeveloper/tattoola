import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../providers/AuthProvider';

export default function IndexScreen() {
  const { user, initialized, loading } = useAuth();

  useEffect(() => {
    if (!initialized || loading) {
      return; // Still initializing
    }

    if (user) {
      // User is authenticated, redirect to main app
      router.replace('/(tabs)');
    } else {
      // User is not authenticated, redirect to login
      router.replace('/(auth)/login');
    }
  }, [user, initialized, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LoadingSpinner message="Loading Tattoola..." overlay />
    </View>
  );
}
