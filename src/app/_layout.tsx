import { SVGIcons } from "@/constants/svg";
import "@/global.css";
import { mvs, s } from "@/utils/scale";
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
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values"; // Import polyfill for crypto functions
import { SafeAreaView } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { AuthProvider } from "../providers/AuthProvider";
import { initDatabase } from "../utils/database";
import { initializeDeepLinking } from "../utils/deepLinking";


export default function RootLayout() {
  const appState = useRef(AppState.currentState);
  
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
    NeueHaasDisplayPro: require("../assets/fonts/fonnts.com-Neue_Haas_Grotesk_Display_Pro_55_Roman.otf"),
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
    console.log("🏁 RootLayout: Starting initialization");
    
    // Initialize SQLite database first
    initDatabase().catch((error) => {
      console.error("❌ Failed to initialize database:", error);
    });

    // Initialize deep linking
    console.log("🔗 RootLayout: Initializing deep linking...");
    const subscription = initializeDeepLinking();
    console.log("✅ RootLayout: Deep linking initialized");

    // Monitor app state changes
    console.log("📱 RootLayout: Setting up app state listener");
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log("🔄 RootLayout: App has come to the foreground!");
        console.log("📱 RootLayout: Current app state:", nextAppState);
        console.log("🔄 RootLayout: Checking for session changes...");
      } else if (nextAppState.match(/inactive|background/)) {
        console.log("⏸️ RootLayout: App has gone to the background");
        console.log("📱 RootLayout: Current app state:", nextAppState);
      }
      appState.current = nextAppState;
      console.log("📱 RootLayout: App state changed to:", appState.current);
    });

    console.log("✅ RootLayout: All initialization complete");

    return () => {
      console.log("🧹 RootLayout: Cleaning up subscriptions");
      subscription?.remove();
      appStateSubscription?.remove();
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
            <Stack.Screen name="modal" />
          </Stack>
          <Toaster
            position="top-center"
            offset={60}
            swipeToDismissDirection="up"
            duration={6000}
            closeButton
            toastOptions={{
              style: {
                backgroundColor: "#100C0C",
                borderWidth: 1,
                borderColor: "#A49A99",
                borderRadius: mvs(16),
                paddingVertical: mvs(14),
                paddingHorizontal: mvs(16),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: mvs(12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
              titleStyle: {
                color: "#ffffff",
                fontSize: mvs(11),
                fontWeight: "500",
                lineHeight: 16,
              },
              descriptionStyle: {
                color: "#a1a1aa",
                fontSize: mvs(12),
                fontWeight: "400",
                backgroundColor: "#A49A99",
              },
              actionButtonStyle: {
                backgroundColor: "#A49A99",
                borderRadius: mvs(8),
              },
              actionButtonTextStyle: {
                color: "#100C0C",
                fontSize: mvs(14),
                fontWeight: "600",
                paddingVertical: mvs(10),
                paddingHorizontal: mvs(16),
              },
              closeButtonStyle: {
                position: "absolute",
                right: 12,
                top: "50%",
                transform: [{ translateY: -9 }],
              },
            }}
            icons={{
              success: <SVGIcons.CheckedCheckbox width={s(18)} height={s(18)} />,
              error: <SVGIcons.Error width={s(18)} height={s(18)} />,
              loading: <SVGIcons.Loading width={s(18)} height={s(18)} />,
            }}
          />
        </SafeAreaView>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
