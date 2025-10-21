import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useUserRegistrationV2Store } from "@/stores/userRegistrationV2Store";
import type { FormErrors, UserV2Step5 } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function UserRegistrationStep5() {
  const { step5, updateStep5, setErrors, clearErrors, setCurrentStepDisplay } =
    useUserRegistrationV2Store();
  const [formData, setFormData] = useState<UserV2Step5>({
    instagram: undefined,
    tiktok: undefined,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step5 && Object.keys(step5).length > 0) {
      setFormData(step5 as UserV2Step5);
    }
  }, [step5]);

  const handleSkip = () => {
    updateStep5(formData);
    setCurrentStepDisplay(5);
    router.push("/(auth)/user-registration/step-6");
  };

  const handleNext = () => {
    updateStep5(formData);
    setCurrentStepDisplay(5);
    router.push("/(auth)/user-registration/step-6");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <AuthStepHeader />

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: mvs(20),
        }}
      >
        {/* Progress */}
        <RegistrationProgress
          currentStep={5}
          totalSteps={5}
          name="Social Media"
          icon={<SVGIcons.Heart width={22} height={22} />}
        />

        {/* Inputs */}
        <View style={{ paddingHorizontal: s(24), gap: mvs(24) }}>
          <View>
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-foreground mb-2"
            >
              Instagram (optional)
            </ScaledText>
            <View className="flex-row items-center rounded-xl border border-gray">
              <View style={{ paddingLeft: s(16), paddingRight: s(8) }}>
                <ScaledText
                  allowScaling={false}
                  variant="body1"
                  className="text-foreground font-neueBold"
                >
                  @
                </ScaledText>
              </View>
              <ScaledTextInput
                containerClassName="flex-1"
                className="text-foreground rounded-xl"
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
              />
            </View>
          </View>

          <View>
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-foreground mb-2"
            >
              TikTok (optional)
            </ScaledText>
            <View className="flex-row items-center rounded-xl border border-gray">
              <View style={{ paddingLeft: s(16), paddingRight: s(8) }}>
                <ScaledText
                  allowScaling={false}
                  variant="body1"
                  className="text-foreground font-neueBold"
                >
                  @
                </ScaledText>
              </View>
              <ScaledTextInput
                containerClassName="flex-1"
                className="text-foreground rounded-xl"
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
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <NextBackFooter
        onNext={handleNext}
        nextLabel="Continue"
        backLabel="Skip for now"
        onBack={handleSkip}
      />
    </View>
  );
}
