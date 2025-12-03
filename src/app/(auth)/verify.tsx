import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { logger } from "@/utils/logger";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    try {
      logger.log('Verify screen mounted with params:', params);
    } catch (error) {
      // Silently fail if logging doesn't work
    }
  }, [params]);
  
  const handleGoBack = () => {
    try {
      router.replace("/(auth)/welcome");
    } catch (error) {
      logger.error("Error navigating to welcome:", error);
    }
  };
  
  // No logic - just show loading while deepLinking.ts handles verification
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <LoadingSpinner message="Verifica della tua email..." overlay />
      
      {/* Fallback button in case verification takes too long */}
      <View className="absolute bottom-10 px-6 w-full">
        <TouchableOpacity
          onPress={handleGoBack}
          className="bg-foreground/10 py-3 rounded-full items-center"
        >
          <Text className="text-foreground text-sm">
            Sta impiegando troppo tempo? Torna indietro
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
