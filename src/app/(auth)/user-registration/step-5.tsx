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
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AuthStepHeader />

        {/* Progress */}
        <RegistrationProgress
          currentStep={3}
          totalSteps={7}
          name="Socials"
          nameVariant="2xl"
          icon={<SVGIcons.Heart width={20} height={20} />}
        />

        {/* Inputs */}
        <View style={{ paddingHorizontal: s(24), gap: mvs(24) }}>
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Inserisci il link al tuo account Instagram (facoltativo)
            </ScaledText>
            <View className="flex-row items-center rounded-xl border border-gray bg-tat-foreground">
              <View
                style={{ paddingLeft: s(16), }}
                className="bg-tat-foreground"
              >
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratSemibold bg-tat-foreground"
                >
                  @
                </ScaledText>
              </View>
              <ScaledTextInput
                containerClassName="flex-1 rounded-xl"
                className="text-foreground rounded-xl"
                style={{ fontSize: s(12), paddingHorizontal: s(4) }}
                placeholder="tattooking_85"
                  
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
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Inserisci il link al tuo account TikTok (facoltativo)
            </ScaledText>
            <View className="flex-row items-center rounded-xl border border-gray bg-tat-foreground">
              <View
                style={{ paddingLeft: s(16), }}
                className="bg-tat-foreground"
              >
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratSemibold bg-tat-foreground"
                >
                  @
                </ScaledText>
              </View>
              <ScaledTextInput
                containerClassName="flex-1 rounded-xl "
                className="text-foreground rounded-xl"
                style={{ fontSize: s(12), paddingHorizontal: s(4) }}
                placeholder="tattooking_857"
                  
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
        nextLabel="Next"
        backLabel="Back"
        onBack={handleBack}
      />
    </View>
  );
}
