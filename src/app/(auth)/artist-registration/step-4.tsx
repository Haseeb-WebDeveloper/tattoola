import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { WorkArrangement } from "@/types/auth";
import { isValid, step4Schema } from "@/utils/artistRegistrationValidation";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";

const OPTIONS: { key: WorkArrangement; label: string }[] = [
  {
    key: "FREELANCE" as WorkArrangement,
    label: "Sono un Tattoo Artist che lavora freelance",
  },
  {
    key: "STUDIO_EMPLOYEE" as WorkArrangement,
    label: "Sono un Tattoo Artist che lavora in uno studio",
  },
  {
    key: "STUDIO_OWNER" as WorkArrangement,
    label: "Sono il titolare del mio studio",
  },
];

export default function ArtistStep4V2() {
  const { step4, setWorkArrangement, totalStepsDisplay } =
    useArtistRegistrationV2Store();
  const activeStep = 4;

  const selected = step4.workArrangement;
  const canProceed = isValid(step4Schema, { workArrangement: selected as any });

  const onNext = () => {
    if (!selected) return;
    router.push("/(auth)/artist-registration/step-5");
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={150}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-black"
    >
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <View className="items-center  mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < activeStep ? (idx === activeStep - 1 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-8 flex-row gap-2 items-center justify-center">
        <SVGIcons.Pen2 width={22} height={22} />
        <Text className="text-foreground section-title font-neueBold">
          How do you work as an artist?
        </Text>
      </View>

      {/* Options */}
      <View className="px-6 gap-4">
        {OPTIONS.map((opt) => {
          const active = selected === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setWorkArrangement(opt.key)}
              className={`rounded-xl px-3 py-4 border ${active ? "border-foreground" : "border-gray"} bg-[#100C0C]`}
            >
              <View className="flex-row items-center gap-2">
                {active ? (
                  <SVGIcons.CircleCheckedCheckbox width={24} height={24} />
                ) : (
                  <SVGIcons.CircleUncheckedCheckbox width={24} height={24} />
                )}
                <Text
                  className="text-foreground text-base flex-1 text-[12px] font-montserratMedium"
                  style={{ flexShrink: 1, flexWrap: "wrap" }}
                >
                  {opt.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer actions */}
      <View className="flex-row justify-between px-6 mt-10 mb-10 absolute top-[80vh] left-0 right-0">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          disabled={!canProceed}
          className={`rounded-full px-8 py-4 ${canProceed ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
