import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";
import { useUserRegistrationStore } from "@/stores";
import type { FormErrors, UserV2Step5 } from "@/types/auth";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserRegistrationStep5() {
  const { step5, updateStep, setErrors, clearErrors, setCurrentStep } =
    useUserRegistrationStore();
  const [formData, setFormData] = useState<UserV2Step5>({
    instagram: undefined,
    tiktok: undefined,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [focused, setFocused] = useState<"instagram" | "tiktok" | null>(null);

  // Load existing data if available
  useEffect(() => {
    if (step5 && Object.keys(step5).length > 0) {
      setFormData(step5 as UserV2Step5);
    }
  }, [step5]);

  const handleSkip = () => {
    updateStep("step5", formData);
    setCurrentStep(6);
    router.push("/(auth)/user-registration/step-6");
  };

  const handleNext = () => {
    updateStep("step5", formData);
    setCurrentStep(6);
    router.push("/(auth)/user-registration/step-6");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background relative">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <View className="items-center mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < 5 ? (idx === 4 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      <View className="flex-1">
        {/* Title */}
        <View className="px-6 mb-8 flex-row gap-2 items-center justify-center">
          <SVGIcons.Heart width={22} height={22} />
          <Text className="text-foreground section-title font-neueBold">
            Social Media
          </Text>
        </View>

        {/* Inputs (artist step-7 style) */}
        <View className="px-6 gap-6">
          <View>
            <Text className="mb-2 label">Instagram (optional)</Text>
            <View
              className={`flex-row items-center rounded-xl bg-black/40 ${focused === "instagram" ? "border-2 border-foreground" : "border border-gray"}`}
            >
              <View className="pl-4 pr-2 py-3">
                <Text className="text-foreground font-neueBold">@</Text>
              </View>
              <TextInput
                className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                placeholder="username"
                placeholderTextColor="#A49A99"
                autoCapitalize="none"
                value={(formData.instagram || "").replace(/^@/, "")}
                onChangeText={(value) => {
                  setFormData((p) => ({
                    ...p,
                    instagram: value.replace(/^@/, "").trim() || undefined,
                  }));
                  if (errors.instagram)
                    setLocalErrors((e) => ({ ...e, instagram: "" }));
                  clearErrors();
                }}
                onFocus={() => setFocused("instagram")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          <View>
            <Text className="mb-2 label">TikTok (optional)</Text>
            <View
              className={`flex-row items-center rounded-xl bg-black/40 ${focused === "tiktok" ? "border-2 border-foreground" : "border border-gray"}`}
            >
              <View className="pl-4 pr-2 py-3">
                <Text className="text-foreground font-neueBold">@</Text>
              </View>
              <TextInput
                className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                placeholder="username"
                placeholderTextColor="#A49A99"
                autoCapitalize="none"
                value={(formData.tiktok || "").replace(/^@/, "")}
                onChangeText={(value) => {
                  setFormData((p) => ({
                    ...p,
                    tiktok: value.replace(/^@/, "").trim() || undefined,
                  }));
                  if (errors.tiktok)
                    setLocalErrors((e) => ({ ...e, tiktok: "" }));
                  clearErrors();
                }}
                onFocus={() => setFocused("tiktok")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-between w-full  px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
          <TouchableOpacity
            onPress={handleSkip}
            className="rounded-full border border-foreground px-6 py-4"
          >
            <Text className="text-foreground">Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            className="rounded-full bg-primary px-8 py-4"
          >
            <Text className="text-foreground">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
