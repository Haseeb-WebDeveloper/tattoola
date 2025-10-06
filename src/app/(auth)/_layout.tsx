import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        // animation: 'slide_from_right',
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
  );
}
