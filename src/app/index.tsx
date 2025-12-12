import { SVGIcons } from "@/constants/svg";
import { mvs } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import { useSignupStore } from "../stores/signupStore";

export default function IndexScreen() {
  const { user, initialized, loading } = useAuth();
  const { pendingVerificationEmail } = useSignupStore();

  useEffect(() => {
    // console.log('IndexScreen useEffect - user:', user, 'initialized:', initialized, 'loading:', loading);

    if (!initialized || loading) {
      // console.log("Still initializing or loading, not redirecting yet");
      return; // Still initializing
    }

    // Don't redirect if we're waiting for email verification
    if (pendingVerificationEmail) {
      // console.log("Pending email verification, staying on current screen");
      return;
    }

    if (user) {
      // console.log("User is authenticated, redirecting to main app");
      // User is authenticated, redirect to main app
      router.replace("/(tabs)");
    } else {
      // console.log("User is not authenticated, redirecting to welcome");
      // User is not authenticated, redirect to welcome
      router.replace("/(auth)/welcome");
    }
  }, [user, initialized, loading, pendingVerificationEmail]);

  return (
    <View
      style={{ flex: 1, gap: mvs(12) }}
      className="flex-col items-center justify-center bg-background"
    >
      <View className="items-center justify-center">
        <SVGIcons.LogoLight />
      </View>
    </View>
  );
}
