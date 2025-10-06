import "@/global.css";

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
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../providers/AuthProvider";
import { initializeDeepLinking } from "../utils/deepLinking";

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
    "NeueHaasDisplayPro-Bold": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_75_Bold.otf"),
    "NeueHaasDisplayPro-Black": require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_95_Black.otf"),
  });

  useEffect(() => {
    // Initialize deep linking
    const subscription = initializeDeepLinking();
    
    return () => {
      subscription?.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

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
