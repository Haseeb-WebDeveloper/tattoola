import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

export default function AuthLayout() {
  const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { height: SCREEN_HEIGHT, width: SCREEN_WIDTH, zIndex: 0 }]}
        pointerEvents="none"
      />
      <Stack
        initialRouteName="welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="email-confirmation" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="artist-register" />
        <Stack.Screen name="user-registration" />
        <Stack.Screen name="artist-registration" />
      </Stack>
    </View>
  );
}
