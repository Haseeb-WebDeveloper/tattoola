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
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AuthProvider } from "../providers/AuthProvider";
import { initDatabase } from "../utils/database";
import { initializeDeepLinking } from "../utils/deepLinking";
import { logger } from "../utils/logger";


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

    // Neue Haas Grotesk Display (local TTFs)
    // Base family mapped to Roman by default
    NeueHaasDisplay: require("../assets/fonts/NeueHaasDisplayRoman.ttf"),
    "NeueHaasDisplay-Light": require("../assets/fonts/NeueHaasDisplayLight.ttf"),
    "NeueHaasDisplay-Medium": require("../assets/fonts/NeueHaasDisplayMediu.ttf"),
    "NeueHaasDisplay-Bold": require("../assets/fonts/NeueHaasDisplayBold.ttf"),
    "NeueHaasDisplay-Black": require("../assets/fonts/NeueHaasDisplayBlack.ttf"),
    "NeueHaasDisplay-Thin": require("../assets/fonts/NeueHaasDisplayThin.ttf"),
  });

  useEffect(() => {
    logger.log("RootLayout: Starting initialization");
    
    // Initialize SQLite database first
    initDatabase().catch((error) => {
      logger.error("Failed to initialize database:", error);
    });

    // Initialize deep linking
    logger.log("RootLayout: Initializing deep linking...");
    const subscription = initializeDeepLinking();
    logger.log("RootLayout: Deep linking initialized");

    // Monitor app state changes
    logger.log("RootLayout: Setting up app state listener");
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        logger.log("RootLayout: App has come to the foreground!");
      } else if (nextAppState.match(/inactive|background/)) {
        logger.log("RootLayout: App has gone to the background");
      }
      appState.current = nextAppState;
    });

    logger.log("RootLayout: All initialization complete");

    return () => {
      logger.log("RootLayout: Cleaning up subscriptions");
      subscription?.remove();
      appStateSubscription?.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
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
              success: <SVGIcons.Success width={s(18)} height={s(18)} />,
              error: <SVGIcons.Error width={s(18)} height={s(18)} />,
              loading: <SVGIcons.Loading width={s(18)} height={s(18)} />,
            }}
          />
        </SafeAreaView>
      </AuthProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
