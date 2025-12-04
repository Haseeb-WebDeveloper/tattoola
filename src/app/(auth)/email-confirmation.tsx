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
  const { resendVerificationEmail, user } = useAuth();
  const { status, pendingVerificationEmail, formData, errorMessage } =
    useSignupStore();

  const [imageError, setImageError] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const cooldownEndTimeRef = useRef<number | null>(null);

  const isLoading = status === "in_progress";

  // --- COOLDOWN HELPERS ---
  const calculateRemainingCooldown = useCallback((): number => {
    if (!cooldownEndTimeRef.current) return 0;
    const now = Date.now();
    const remaining = Math.ceil((cooldownEndTimeRef.current - now) / 1000);
    return Math.max(0, remaining);
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    const now = Date.now();
    cooldownEndTimeRef.current = now + seconds * 1000;
    setCooldown(seconds);
  }, []);

  // Start initial cooldown
  useEffect(() => {
    startCooldown(60);
  }, [startCooldown]);

  // Recalculate cooldown when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && cooldownEndTimeRef.current) {
        const remaining = calculateRemainingCooldown();
        setCooldown(remaining);
      }
    });

    return () => subscription.remove();
  }, [calculateRemainingCooldown]);

  // Cooldown countdown
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

  // AUTO-REDIRECT if user has already verified email
  useEffect(() => {
    if (!user?.isVerified) return;

    const role = formData?.role ?? user.role;

    router.replace(
      role === UserRole.ARTIST
        ? "/(auth)/artist-registration/step-3"
        : "/(auth)/user-registration/step-3"
    );
  }, [user?.isVerified]);

  // HANDLE BACKEND ERROR → EMAIL ALREADY VERIFIED
  useEffect(() => {
    if (status !== "error" || !errorMessage) return;

    if (errorMessage === "EMAIL_ALREADY_VERIFIED") {
      toast.custom(
        <CustomToast
          message="Questa email è già registrata e verificata. Accedi per continuare."
          iconType="error"
        />,
        { duration: 4000 }
      );

      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1500);
    }
  }, [status, errorMessage]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <AuthStepHeader />

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
            onError={() => setImageError(true)}
          />
        )}
      </View>

      {/* RESEND BUTTON */}
      {!user?.isVerified && (
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

                startCooldown(60);

                toast.custom(
                  <CustomToast
                    message="Email di verifica inviata!"
                    iconType="success"
                  />,
                  { duration: 4000 }
                );
              } catch (error: any) {
                const code = error?.code ?? error?.message;

                if (code === "EMAIL_ALREADY_VERIFIED") {
                  toast.custom(
                    <CustomToast
                      message="La tua email risulta già verificata. Accedi per continuare."
                      iconType="error"
                    />,
                    { duration: 4000 }
                  );
                  router.replace("/(auth)/login");
                  return;
                }

                if (
                  typeof error.message === "string" &&
                  error.message.includes("request another verification email")
                ) {
                  toast.custom(
                    <CustomToast
                      message="Hai appena richiesto una nuova email. Puoi riprovare tra 60 secondi."
                      iconType="error"
                    />,
                    { duration: 4000 }
                  );
                  return;
                }

                toast.custom(
                  <CustomToast
                    message="Impossibile inviare l’email di verifica."
                    iconType="error"
                  />,
                  { duration: 4000 }
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
      )}

      {/* EDIT EMAIL */}
      <View className="max-w-sm px-12 mb-12">
        <ScaledText
          variant="body2"
          className="text-center text-foreground font-montserratLight"
        >
          Se hai inserito un indirizzo email errato,{" "}
          <ScaledText
            variant="body2"
            className="text-foreground font-neueSemibold underline"
            onPress={() => {
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
