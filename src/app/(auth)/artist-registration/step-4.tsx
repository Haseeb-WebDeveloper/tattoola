import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { WorkArrangement } from "@/types/auth";
import { isValid, step4Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
      <RegistrationProgress
        currentStep={activeStep}
        totalSteps={totalStepsDisplay}
        name="Come lavori come artista?"
        icon={<SVGIcons.Pen2 width={18} height={18} />}
        nameVariant="2xl"
      />

      {/* Options */}
      <View style={{ paddingHorizontal: s(24), rowGap: mvs(8) }}>
        {OPTIONS.map((opt) => {
          const active = selected === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setWorkArrangement(opt.key)}
              className={`rounded-xl border ${active ? "border-foreground" : "border-gray"} bg-tat-foreground`}
              style={{
                paddingVertical: mvs(18),
                paddingHorizontal: s(12),
              }}
            > 
              <View className="flex-row items-center gap-2">
                {active ? (
                  <SVGIcons.CircleCheckedCheckbox width={s(17)} height={s(17)} />
                ) : (
                  <SVGIcons.CircleUncheckedCheckbox width={s(17)} height={s(17)} />
                )}
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-foreground font-montserratSemibold flex-1"
                  style={{ flexShrink: 1, flexWrap: "wrap" }}
                >
                  {opt.label}
                </ScaledText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer actions */}
      <NextBackFooter
        onNext={onNext}
        nextDisabled={!canProceed}
        onBack={() => router.back()}
      />
    </KeyboardAwareScrollView>
  );
}
