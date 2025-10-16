import "@/global.css";
import "react-native-get-random-values"; // Import polyfill for crypto functions

import {
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_900Black,
} from "@expo-google-fonts/montserrat";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../providers/AuthProvider";
// import "../utils/debugLogger"; // Import debug logger
import { initializeDeepLinking } from "../utils/deepLinking";

// Enable debug logging
if (__DEV__) {
  console.log("🔧 Debug mode enabled - Console logs should be visible");
  // Ensure all console methods are available
  global.console = console;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Register commonly used Montserrat weights under clear names
    "Montserrat-Light": Montserrat_300Light,
    "Montserrat-Regular": Montserrat_400Regular,
    "Montserrat-Medium": Montserrat_500Medium,
    "Montserrat-SemiBold": Montserrat_600SemiBold,
    "Montserrat-Bold": Montserrat_700Bold,
    "Montserrat-Black": Montserrat_900Black,

    // Neue Haas Grotesk Display Pro (local OTFs)
    // Map a base family name to Roman by default
    "NeueHaasDisplayPro": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_55_Roman.otf"),
    "NeueHaasDisplayPro-UltraThin": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_15_Ultra_Thin.otf"),
    "NeueHaasDisplayPro-Thin": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_25_Thin.otf"),
    "NeueHaasDisplayPro-ExtraLight": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_35_Extra_Light.otf"),
    "NeueHaasDisplayPro-Light": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_45_Light.otf"),
    "NeueHaasDisplayPro-Medium": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_65_Medium.otf"),
    "NeueHaasDisplayPro-SemiBold": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_65_Medium.otf"),
    "NeueHaasDisplayPro-Bold": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_75_Bold.otf"),
    "NeueHaasDisplayPro-Black": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_95_Black.otf"),
  });

  useEffect(() => {
    // Initialize deep linking
    console.log('🔗 RootLayout: Initializing deep linking...');
    const subscription = initializeDeepLinking();
    console.log('🔗 RootLayout: Deep linking initialized');
    
    return () => {
      console.log('🔗 RootLayout: Cleaning up deep linking subscription');
      subscription?.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SafeAreaView className="flex-1 text-foreground bg-background">
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="collection" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="modal" />
          </Stack>
        </SafeAreaView>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
