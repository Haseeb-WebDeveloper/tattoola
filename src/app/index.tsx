import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "../providers/AuthProvider";

export default function IndexScreen() {
  const { user, initialized, loading } = useAuth();

  useEffect(() => {
    console.log('IndexScreen useEffect - user:', user, 'initialized:', initialized, 'loading:', loading);

    if (!initialized || loading) {
      console.log("Still initializing or loading, not redirecting yet");
      return;
    }

    if (user) {
      const hasCompletedProfile = !!(user?.firstName);
      console.log("User exists, hasCompletedProfile:", hasCompletedProfile, "role:", user.role);
      
      if (hasCompletedProfile) {
        console.log("User has completed profile, redirecting to main app");
        router.replace("/(tabs)");
      } else {
        if (user.role === 'ARTIST') {
          console.log("Artist profile incomplete, redirecting to artist registration step 3");
          router.replace('/(auth)/artist-registration/step-3');
        } else {
          console.log("User profile incomplete, redirecting to user registration step 3");
          router.replace('/(auth)/user-registration/step-3');
        }
      }
    } else {
      console.log("User is not authenticated, redirecting to welcome");
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
