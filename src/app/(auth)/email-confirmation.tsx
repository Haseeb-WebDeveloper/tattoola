import AuthStepHeader from "@/components/ui/auth-step-header";
import { CustomToast } from "@/components/ui/CustomToast";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import { UserRole } from "@/types/auth";
import { logger } from "@/utils/logger";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

export default function EmailConfirmationScreen() {
  const { resendVerificationEmail } = useAuth();
  const { status, reset, pendingVerificationEmail, formData } =
    useSignupStore();
  const [imageError, setImageError] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60); // seconds remaining before user can resend
  const cooldownEndTimeRef = useRef<number | null>(null); // Timestamp when cooldown ends

  const isLoading = status === "in_progress";

  // Calculate remaining cooldown based on timestamp
  const calculateRemainingCooldown = useCallback((): number => {
    if (!cooldownEndTimeRef.current) return 0;
    const now = Date.now();
    const remaining = Math.ceil((cooldownEndTimeRef.current - now) / 1000);
    return Math.max(0, remaining);
  }, []);

  // Start cooldown timer
  const startCooldown = useCallback((seconds: number) => {
    const now = Date.now();
    cooldownEndTimeRef.current = now + seconds * 1000;
    setCooldown(seconds);
  }, []);

  // Initial cooldown when landing on the screen (first 60s)
  useEffect(() => {
    startCooldown(60);
  }, [startCooldown]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && cooldownEndTimeRef.current) {
        // App came to foreground, recalculate cooldown
        const remaining = calculateRemainingCooldown();
        setCooldown(remaining);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [calculateRemainingCooldown]);

  // Countdown effect for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) {
      cooldownEndTimeRef.current = null;
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemainingCooldown();
      if (remaining <= 0) {
        setCooldown(0);
        cooldownEndTimeRef.current = null;
        clearInterval(interval);
      } else {
        setCooldown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, calculateRemainingCooldown]);

  logger.log("Email confirmation screen - status:", status);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with back and logo */}
      <AuthStepHeader />
      {/* Steps indicator */}
      <RegistrationProgress
        currentStep={2}
        totalSteps={13}
        name="Email di verifica inviata"
        icon={<SVGIcons.MailSent className="w-7 h-7" />}
        description="Controlla la tua casella di posta → Tocca Conferma email → Hai finito!"
        nameVariant="2xl"
        descriptionVariant="md"
        NameFont="font-neueBold"
        DescriptionFont="font-montserratLight"
      />

      {/* Email address display */}
      {!isLoading && pendingVerificationEmail && (
        <View className="items-center mb-4">
          <ScaledText
            variant="sm"
            className="text-center text-gray font-montserratLight"
          >
            Email inviata a {pendingVerificationEmail}
          </ScaledText>
        </View>
      )}

      {/* Loading ring or image preview */}
      <View className="items-center mb-8">
        {isLoading ? (
          <View className="w-20 h-20 border-8 rounded-full border-warning border-r-gray animate-spin-slow" />
        ) : imageError ? (
          <View className="w-[320px] h-[220px] rounded-xl bg-foreground/10 items-center justify-center">
            <SVGIcons.MailSent className="w-20 h-20" />
          </View>
        ) : (
          <Image
            source={require("@/assets/auth/email-sent.png")}
            className="w-[320px] h-[220px] rounded-xl"
            resizeMode="contain"
            onError={() => {
              logger.warn("Failed to load email-sent image");
              setImageError(true);
            }}
          />
        )}
      </View>

      {/* Resend */}
      <View className="items-center">
        <ScaledText variant="body2" className="text-gray font-neueLight">
          Non hai ricevuto l'email?
        </ScaledText>
        <TouchableOpacity
          className={`flex-row items-center gap-2 border rounded-full ${
            isResending || cooldown > 0
              ? "border-gray/40 bg-foreground/5"
              : "border-gray bg-transparent"
          }`}
          style={{
            marginTop: mvs(8),
            paddingVertical: mvs(10),
            paddingHorizontal: s(24),
          }}
          disabled={isResending || cooldown > 0}
          onPress={async () => {
            try {
              setIsResending(true);
              await resendVerificationEmail(pendingVerificationEmail);
              // Start a 60 second cooldown after a successful resend
              startCooldown(60);
              let toastId: any;
              toastId = toast.custom(
                <CustomToast
                  message="Verification email sent successfully"
                  iconType="success"
                  onClose={() => toast.dismiss(toastId)}
                />,
                { duration: 4000 }
              );
            } catch (error: any) {
              logger.error("Error resending verification email:", error);
              const rawMessage =
                error?.message || "Failed to resend verification email";

              // Handle backend throttle message more gracefully and in Italian
              let message = rawMessage;
              if (
                typeof rawMessage === "string" &&
                rawMessage.includes(
                  "You can request another verification email in"
                )
              ) {
                const match = rawMessage.match(/in (\d+) seconds?/);
                const seconds = match?.[1];
                message = seconds
                  ? `Hai appena richiesto una nuova email di verifica. Puoi riprovare tra ${seconds} secondi.`
                  : "Hai appena richiesto una nuova email di verifica. Attendi qualche secondo prima di riprovare.";
              }

              let toastId: any;
              toastId = toast.custom(
                <CustomToast
                  message={message}
                  iconType="error"
                  onClose={() => toast.dismiss(toastId)}
                />,
                { duration: 6000 }
              );
            } finally {
              setIsResending(false);
            }
          }}
        >
          {!(isResending || cooldown > 0) && (
            <SVGIcons.Reload className="w-5 h-5" />
          )}
          <ScaledText
            variant="11"
            className={`font-neueSemibold ${
              isResending || cooldown > 0 ? "text-gray" : "text-foreground"
            }`}
            allowScaling={false}
          >
            {isResending
              ? "Invio in corso..."
              : cooldown > 0
                ? `Puoi reinviare tra ${cooldown}s`
                : "Reinvia email"}
          </ScaledText>
        </TouchableOpacity>
        {cooldown > 0 && !isResending && (
          <ScaledText
            variant="sm"
            className="max-w-sm px-12 mt-2 text-xs text-center text-gray font-montserratLight"
          >
            Per evitare abusi, puoi richiedere una nuova email solo ogni 60
            secondi.
          </ScaledText>
        )}
        <View className="h-px bg-[#A49A99] opacity-40 w-4/5 my-8" />
      </View>

      {/* Edit email note */}
      <View className="max-w-sm px-12 mb-12">
        <ScaledText
          variant="body2"
          className="text-center text-foreground font-montserratLight"
        >
          Se hai inserito un indirizzo email errato,{" "}
          <ScaledText
            variant="body2"
            className="text-foreground font-neueSemibold underline underline-offset-auto decoration-solid font-montserratRegular text-[14px] leading-[23px]"
            style={{
              textDecorationLine: "underline",
            }}
            onPress={() => {
              // Don't reset form data - keep it so user can edit email
              // Only reset status, not formData
              const role = formData?.role;
              if (role === UserRole.ARTIST) {
                router.replace("/(auth)/artist-register");
              } else {
                router.replace("/(auth)/register");
              }
            }}
          >
            modifica email.
          </ScaledText>
        </ScaledText>
      </View>
    </ScrollView>
  );
}
