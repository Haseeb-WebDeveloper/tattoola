import { CustomToast } from "@/components/ui/CustomToast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/providers/AuthProvider";
import { logger } from "@/utils/logger";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    try {
      logger.log("Verify screen mounted with params:", params);

      // Handle expired/invalid verification links coming from Supabase
      const rawErrorCode = (params as any)?.error_code;
      const rawErrorDescription = (params as any)?.error_description;

      const errorCode = Array.isArray(rawErrorCode)
        ? rawErrorCode[0]
        : rawErrorCode;
      const errorDescription = Array.isArray(rawErrorDescription)
        ? rawErrorDescription[0]
        : rawErrorDescription;

      const isExpiredLink =
        errorCode === "otp_expired" ||
        (typeof errorDescription === "string" &&
          errorDescription.toLowerCase().includes("invalid or has expired"));

      if (!isExpiredLink) {
        return;
      }

      // If we already have a verified user/session, the link being "expired"
      // is not a real problem for the user – they're already verified.
      const isAlreadyVerified = !!user?.isVerified;

      let toastId: any;
      toastId = toast.custom(
        <CustomToast
          message={
            isAlreadyVerified
              ? "Il tuo account è già verificato. Puoi continuare nell’app."
              : "Il link di verifica è scaduto. Torna alla schermata precedente e richiedi una nuova email di verifica."
          }
          iconType={isAlreadyVerified ? "success" : "error"}
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 6000 }
      );
    } catch (error) {
      // Silently fail if logging or toast doesn't work
      logger.error("Verify screen error while handling params:", error);
    }
  }, [params, user?.isVerified]);

  const handleGoBack = () => {
    try {
      router.replace("/(auth)/welcome");
    } catch (error) {
      logger.error("Error navigating to welcome:", error);
    }
  };

  // Show loading while deepLinking.ts (or Supabase) handles verification
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
