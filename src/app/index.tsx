import { router } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";

export default function IndexScreen() {
  const { user, initialized, loading } = useAuth();

  useEffect(() => {
    // console.log('IndexScreen useEffect - user:', user, 'initialized:', initialized, 'loading:', loading);

    if (!initialized || loading) {
      // console.log("Still initializing or loading, not redirecting yet");
      return; // Still initializing
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
  }, [user, initialized, loading]);

  return (
    <View
      style={{ flex: 1, gap: mvs(12) }}
      className="bg-background flex-col items-center justify-center"
    >
      <View className="items-center justify-center animate-spin">
        <SVGIcons.Loading
          width={s(32)}
          height={s(32)}
          className="self-center animate-spin"
        />
      </View>
      <ScaledText
        variant="lg"
        className="text-foreground font-montserratMedium"
      >
        Loading Tattoola...
      </ScaledText>
    </View>
  );
}
