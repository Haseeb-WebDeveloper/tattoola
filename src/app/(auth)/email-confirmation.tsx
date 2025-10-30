import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import { logger } from "@/utils/logger";
import { mvs } from "@/utils/scale";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";

export default function EmailConfirmationScreen() {
  const { resendVerificationEmail } = useAuth();
  const { status, reset } = useSignupStore();
  const [imageError, setImageError] = useState(false);

  const isLoading = status === "in_progress";

  const handleClose = () => {
    try {
      reset(); // Clear signup state
      router.replace("/(auth)/welcome");
    } catch (error) {
      logger.error("Error navigating to welcome:", error);
    }
  };

  logger.log("Email confirmation screen - status:", status);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with back and logo */}
      <View className="px-4 my-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleClose}
            className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.Close className="w-8 h-8" />
          </TouchableOpacity>
          <SVGIcons.LogoLight className="h-10" />
          <View className="w-10" />
        </View>
        <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
      </View>
      {/* Steps indicator */}
      <RegistrationProgress
        currentStep={2}
        totalSteps={13}
        name="Verification email sent"
        icon={<SVGIcons.MailSent className="w-7 h-7" />}
        description="Check your inbox → Tap Confirm email → You’re all set! ✅"
        nameVariant="2xl"
        descriptionVariant="md"
        NameFont="font-neueBold"
        DescriptionFont="font-montserratLight"
      />

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
        <ScaledText
          variant="body2"
          className="text-foreground font-montserratLight"
        >
          Haven’t received the email?
        </ScaledText>
        <TouchableOpacity
          className="px-6 py-3 rounded-full border border-foreground/60 flex-row gap-2 items-center"
          style={{ marginTop: mvs(8) }}
          onPress={() => {
            try {
              resendVerificationEmail();
            } catch (error) {
              logger.error("Error resending verification email:", error);
            }
          }}
        >
          <SVGIcons.Reload className="w-5 h-5" />
          <ScaledText
            variant="body2"
            className="text-foreground font-montserratLight"
            allowScaling={false}
          >
            Resend email
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
            className="text-foreground font-bold underline underline-offset-auto decoration-solid font-montserratRegular text-[14px] leading-[23px]"
            style={{
              textDecorationLine: "underline",
            }}
            onPress={() => {
              reset(); // Clear signup state
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
