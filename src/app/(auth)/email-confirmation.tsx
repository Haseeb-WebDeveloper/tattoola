import AuthStepHeader from "@/components/ui/auth-step-header";
import { CustomToast } from "@/components/ui/CustomToast";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import { logger } from "@/utils/logger";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

export default function EmailConfirmationScreen() {
  const { resendVerificationEmail } = useAuth();
  const { status, reset, pendingVerificationEmail } = useSignupStore();
  const [imageError, setImageError] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isLoading = status === "in_progress";

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
        name="Verification email sent"
        icon={<SVGIcons.MailSent className="w-7 h-7" />}
        description="Check your inbox → Tap Confirm email → You're all set! ✅"
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
            className="text-gray font-montserratLight text-center"
          >
            Email sent to {pendingVerificationEmail}
          </ScaledText>
        </View>
      )}

      {/* Loading ring or image preview */}
      <View className="items-center mb-8">
        {isLoading ? (
          <View className="w-20 h-20 rounded-full border-8 border-warning border-r-gray animate-spin-slow" />
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
          Haven’t received the email?
        </ScaledText>
        <TouchableOpacity
          className="rounded-full border border-gray flex-row gap-2 items-center"
          style={{
            marginTop: mvs(8),
            paddingVertical: mvs(10),
            paddingHorizontal: s(24),
          }}
          disabled={isResending}
          onPress={async () => {
            try {
              setIsResending(true);
              await resendVerificationEmail(pendingVerificationEmail);
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
              const message =
                error?.message || "Failed to resend verification email";
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
          <SVGIcons.Reload className="w-5 h-5" />
          <ScaledText
            variant="11"
            className="text-foreground font-neueSemibold"
            allowScaling={false}
          >
            {isResending ? "Sending..." : "Resend email"}
          </ScaledText>
        </TouchableOpacity>
        <View className="h-px bg-[#A49A99] opacity-40 w-4/5 my-8" />
      </View>

      {/* Edit email note */}
      <View className="px-12 mb-12 max-w-sm">
        <ScaledText
          variant="body2"
          className="text-foreground font-montserratLight text-center"
        >
          If you entered an incorrect email address,{" "}
          <ScaledText
            variant="body2"
            className="text-foreground font-neueSemibold underline underline-offset-auto decoration-solid font-montserratRegular text-[14px] leading-[23px]"
            style={{
              textDecorationLine: "underline",
            }}
            onPress={() => {
              // Don't reset form data - keep it so user can edit email
              // Only reset status, not formData
              router.replace("/(auth)/artist-register");
            }}
          >
            edit email.
          </ScaledText>
        </ScaledText>
      </View>
    </ScrollView>
  );
}
