import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";

export default function EmailConfirmationScreen() {
  const { resendVerificationEmail } = useAuth();
  const { status } = useSignupStore();

  const isLoading = status === "in_progress";

  const handleClose = () => {
    router.replace("/(auth)/welcome");
  };

  console.log("status", status);

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

      {/* Steps indicator (step 2 of 13 visually) */}
      <View className="items-center mb-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: 13 }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < 2 ? "bg-success" : "bg-gray"} ${idx === 1 ? "w-3 h-3" : "w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title and instructions */}
      <View className="px-6">
        <View className="px-6 mb-2 flex-row gap-2 items-center justify-center">
          <SVGIcons.MailSent className="w-7 h-7" />
          <ScaledText
            variant="sectionTitle"
            className="text-foreground font-neueBold"
          >
            Verification email sent
          </ScaledText>
        </View>
        <ScaledText
          variant="body2"
          className="text-foreground font-montserratLight"
        >
          Check your inbox → Tap Confirm email → You’re all set!
        </ScaledText>
      </View>

      {/* Loading ring or image preview */}
      <View className="items-center my-8">
        {isLoading ? (
          <View className="w-20 h-20 rounded-full border-8 border-warning border-r-gray animate-spin-slow" />
        ) : (
          <Image
            source={require("@/assets/auth/email-sent.png")}
            className="w-[320px] h-[220px] rounded-xl"
            resizeMode="contain"
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
          onPress={resendVerificationEmail}
        >
          <SVGIcons.Reload className="w-5 h-5" />
          <ScaledText
            variant="body2"
            className="text-foreground font-montserratLight"
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
            onPress={() => router.replace("/(auth)/artist-register")}
          >
            edit email.
          </ScaledText>
        </ScaledText>
      </View>
    </ScrollView>
  );
}
