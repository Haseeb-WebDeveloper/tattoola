import { SVGIcons } from "@/constants/svg";
import "@/global.css";
import { mvs, s } from "@/utils/scale";
import {
  Montserrat_300Light,
  Montserrat_300Light_Italic,
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_500Medium_Italic,
  Montserrat_600SemiBold,
  Montserrat_600SemiBold_Italic,
  Montserrat_700Bold,
  Montserrat_700Bold_Italic,
  Montserrat_900Black,
  Montserrat_900Black_Italic,
} from "@expo-google-fonts/montserrat";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values"; // Import polyfill for crypto functions
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AuthRequiredModal } from "../components/modals/AuthRequiredModal";
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
    // Italic faces
    "Montserrat-Italic": Montserrat_400Regular_Italic,
    "Montserrat-LightItalic": Montserrat_300Light_Italic,
    "Montserrat-MediumItalic": Montserrat_500Medium_Italic,
    "Montserrat-SemiBoldItalic": Montserrat_600SemiBold_Italic,
    "Montserrat-BoldItalic": Montserrat_700Bold_Italic,
    "Montserrat-BlackItalic": Montserrat_900Black_Italic,

    // Neue Haas Grotesk Display (local TTFs)
    // Base family mapped to Roman by default
    NeueHaasDisplay: require("../assets/fonts/NeueHaasDisplayRoman.ttf"),
    "NeueHaasDisplay-Light": require("../assets/fonts/NeueHaasDisplayLight.ttf"),
    "NeueHaasDisplay-Medium": require("../assets/fonts/NeueHaasDisplayMediu.ttf"),
    "NeueHaasDisplay-Bold": require("../assets/fonts/NeueHaasDisplayBold.ttf"),
    "NeueHaasDisplay-Black": require("../assets/fonts/NeueHaasDisplayBlack.ttf"),
    "NeueHaasDisplay-Thin": require("../assets/fonts/NeueHaasDisplayThin.ttf"),
    "NeueHaasDisplay-LightItalic": require("../assets/fonts/NeueHaasDisplayLightItalic.ttf"),
    "NeueHaasDisplay-MediumItalic": require("../assets/fonts/NeueHaasDisplayMediumItalic.ttf"),
    "NeueHaasDisplay-BoldItalic": require("../assets/fonts/NeueHaasDisplayBoldItalic.ttf"),
    "NeueHaasDisplay-BlackItalic": require("../assets/fonts/NeueHaasDisplayBlackItalic.ttf"),
    "NeueHaasDisplay-ThinItalic": require("../assets/fonts/NeueHaasDisplayThinItalic.ttf"),

    // Product Sans (local TTFs)
    ProductSans: require("../assets/fonts/ProductSans-Regular.ttf"),
    // Add other weights as needed (Bold, Medium, Light, etc.)
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
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          logger.log("RootLayout: App has come to the foreground!");
        } else if (nextAppState.match(/inactive|background/)) {
          logger.log("RootLayout: App has gone to the background");
        }
        appState.current = nextAppState;
      }
    );

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
        <BottomSheetModalProvider>
          <KeyboardProvider>
            <AuthProvider>
              <SafeAreaView className="flex-1 text-foreground bg-background font-neue">
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(studio-invitation)" />
                  <Stack.Screen
                    name="post/[id]"
                    options={{
                      gestureEnabled: false,
                      animation: "fade",
                      animationDuration: 300,
                    }}
                  />
                  <Stack.Screen name="user/[id]" />
                  <Stack.Screen name="collection/[id]" />
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
                      zIndex: 9999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    titleStyle: {
                      color: "#ffffff",
                      fontSize: mvs(11),
                      fontWeight: "500",
                      lineHeight: 16,
                      fontFamily: "NeueHaasDisplay-Medium",
                    },
                    descriptionStyle: {
                      color: "#a1a1aa",
                      fontSize: mvs(12),
                      fontWeight: "400",
                      fontFamily: "NeueHaasDisplay-Light",
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
                      fontFamily: "NeueHaasDisplay-Medium",
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
                <AuthRequiredModal />
              </SafeAreaView>
            </AuthProvider>
          </KeyboardProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
