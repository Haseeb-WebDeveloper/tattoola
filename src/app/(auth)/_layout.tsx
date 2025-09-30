import { RequireGuest } from '@/components/AuthGuard';
import { RegistrationProvider } from '@/providers/RegistrationProvider';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <RequireGuest>
      <RegistrationProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="email-confirmation" />
          <Stack.Screen name="artist-register" />
          <Stack.Screen name="user-registration" />
          <Stack.Screen name="artist-registration" />
        </Stack>
      </RegistrationProvider>
    </RequireGuest>
  );
}
