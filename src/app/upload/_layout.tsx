import AuthStepHeader from '@/components/ui/auth-step-header';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function UploadLayout() {
  return (
    <View className="flex-1 bg-black">
      <AuthStepHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="media" />
        <Stack.Screen name="description" />
        <Stack.Screen name="style" />
        <Stack.Screen name="collection" />
        <Stack.Screen name="preview" />
      </Stack>
    </View>
  );
}


