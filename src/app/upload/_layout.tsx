import UploadHeader from "@/components/ui/upload-header";
import { Stack } from "expo-router";
import { View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function UploadLayout() {
  return (
    <KeyboardProvider>
      <View className="flex-1">
        <UploadHeader />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="media" />
          <Stack.Screen name="description" />
          <Stack.Screen name="style" />
          <Stack.Screen name="collection" />
          <Stack.Screen name="preview" />
        </Stack>
      </View>
    </KeyboardProvider>
  );
}
