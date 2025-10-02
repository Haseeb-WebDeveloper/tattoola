import "@/global.css";

import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../providers/AuthProvider";
import { initializeDeepLinking } from "../utils/deepLinking";

export default function RootLayout() {
  useEffect(() => {
    // Initialize deep linking
    const subscription = initializeDeepLinking();
    
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <SafeAreaView className="flex-1 text-foreground bg-background">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" />
        </Stack>
      </SafeAreaView>
    </AuthProvider>
  );
}
