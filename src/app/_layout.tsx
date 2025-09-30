import "@/global.css";

import { Stack } from "expo-router";
import React from "react";
import { AuthProvider } from "../providers/AuthProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
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
