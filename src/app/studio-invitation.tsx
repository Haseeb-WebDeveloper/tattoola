import { logger } from "@/utils/logger";
import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

const STORAGE_KEY = "pending_studio_invitation_token";

export default function StudioInvitationEntry() {
  const params = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        const token = params.token as string | undefined;

        if (!token) {
          router.replace("/(tabs)" as any);
          return;
        }

        // Check current session
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (!isMounted) return;

        if (userId) {
          router.replace(`/(studio-invitation)/accept?token=${token}` as any);
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, token);
          router.replace("/(auth)/login");
        }
      } catch (e) {
        logger.error("[studio-invitation entry] error:", e);
        router.replace("/(tabs)");
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [params.token]);

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#CA2323" />
    </View>
  );
}


