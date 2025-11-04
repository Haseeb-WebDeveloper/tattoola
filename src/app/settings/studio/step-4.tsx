import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import StudioStepHeader from "@/components/ui/StudioStepHeader";
import { SVGIcons } from "@/constants/svg";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function StudioStep4() {
  const { step4, updateStep4, setCurrentStep, totalSteps } =
    useStudioSetupStore();

  const [formData, setFormData] = useState({
    website: step4.website || "",
    instagram: step4.instagram || "",
    tiktok: step4.tiktok || "",
  });

  useEffect(() => {
    setCurrentStep(4);
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Save to store
    updateStep4({
      website: formData.website.trim() || undefined,
      instagram: formData.instagram.trim() || undefined,
      tiktok: formData.tiktok.trim() || undefined,
    });

    // Navigate to next step
    router.push("/settings/studio/step-5" as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: mvs(120),
        }}
      >
        {/* Header */}
        <StudioStepHeader
          currentStep={4}
          totalSteps={8}
          stepName="Social Links"
          icon={<SVGIcons.Magic width={s(19)} height={s(19)} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24), gap: mvs(24) }}>
          {/* Website */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat font-montserratSemibold"
              style={{ marginBottom: mvs(4) }}
            >
              Inserisci il link al tuo studio website (facoltativo)
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              style={{ fontSize: s(12) }}
              placeholder="https://yourwebsite.com"
                
              value={formData.website}
              onChangeText={(value) => handleInputChange("website", value)}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Instagram */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat font-montserratSemibold"
              style={{ marginBottom: mvs(4) }}
            >
              Inserisci il link al tuo account Instagram
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              style={{ fontSize: s(12) }}
              placeholder="@username"
                
              value={formData.instagram}
              onChangeText={(value) => handleInputChange("instagram", value)}
              autoCapitalize="none"
            />
          </View>

          {/* TikTok */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat font-montserratSemibold"
              style={{ marginBottom: mvs(4) }}
            >
              Inserisci il link al tuo account Tiktok
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              style={{ fontSize: s(12) }}
              placeholder="@username"
                
              value={formData.tiktok}
              onChangeText={(value) => handleInputChange("tiktok", value)}
              autoCapitalize="none"
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer - Fixed at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#000",
        }}
      >
        <NextBackFooter
          onNext={handleNext}
          nextDisabled={false} // All fields are optional
          onBack={handleBack}
        />
      </View>
    </View>
  );
}
