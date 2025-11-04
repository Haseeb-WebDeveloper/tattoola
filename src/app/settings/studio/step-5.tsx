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

export default function StudioStep5() {
  const { step5, updateStep5, setCurrentStep, totalSteps } =
    useStudioSetupStore();

  const [description, setDescription] = useState(step5.description || "");

  useEffect(() => {
    setCurrentStep(5);
  }, []);

  const handleNext = () => {
    // Save to store
    updateStep5({
      description: description.trim() || undefined,
    });

    // Navigate to next step
    router.push("/settings/studio/step-6" as any);
  };

  const handleBack = () => {
    router.back();
  };

  const characterCount = description.length;
  const maxCharacters = 500;

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
          currentStep={5}
          totalSteps={8}
          stepName="Description"
          icon={<SVGIcons.SafeAlert width={s(19)} height={s(19)} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24) }}>
          {/* Description */}
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-tat font-montserratSemibold"
            style={{ marginBottom: mvs(6) }}
          >
            Descrivi il tuo studio
          </ScaledText>

          {/* Description Input */}
          <View>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              placeholder="Write a description for your studio..."
              placeholderTextColor="#A49A99"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={8}
              maxLength={maxCharacters}
              style={{ minHeight: mvs(200), textAlignVertical: "top", fontSize: s(12) }}
            />

            {/* Character Count */}
            {/* <View
              className="flex-row justify-end"
              style={{ marginTop: mvs(8) }}
            >
              <ScaledText
                allowScaling={false}
                variant="11"
                className={
                  characterCount > maxCharacters ? "text-error" : "text-gray"
                }
              >
                {characterCount}/{maxCharacters}
              </ScaledText>
            </View> */}
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
          nextDisabled={false} // Description is optional
          onBack={handleBack}
        />
      </View>
    </View>
  );
}
