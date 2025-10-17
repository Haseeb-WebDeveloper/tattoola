import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step11Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import NextBackFooter from "@/components/ui/NextBackFooter";

export default function ArtistStep11V2() {
  const { step11, updateStep11, totalStepsDisplay, setCurrentStepDisplay } =
    useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    minimumPrice?: string;
    hourlyRate?: string;
  }>({});

  useEffect(() => {
    setCurrentStepDisplay(11);
  }, []);

  const canProceed = isValid(step11Schema, {
    minimumPrice: step11.minimumPrice ?? 0,
    hourlyRate: step11.hourlyRate ?? 0,
  });

  const validateAll = () => {
    const result = step11Schema.safeParse({
      minimumPrice: step11.minimumPrice ?? 0,
      hourlyRate: step11.hourlyRate ?? 0,
    });
    if (!result.success) {
      const errs: any = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        errs[key] = issue.message;
      }
      setErrors(errs);
    } else {
      setErrors({});
    }
  };

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-12");
  };

  const renderCurrencyInput = (
    label: string,
    value: number | undefined,
    onChange: (n?: number) => void,
    field: string
  ) => (
    <View style={{ paddingHorizontal: s(24), marginBottom: mvs(12) }}>
      <ScaledText
        allowScaling={false}
        variant="sm"
        className="text-tat font-montserratSemibold"
        style={{ marginBottom: mvs(4) }}
      >
        {label}
      </ScaledText>
      <View
        className={`flex-row items-center rounded-xl bg-black/40 ${focused === field ? "border-2 border-foreground" : "border border-gray"}`}
      >
        <View
          style={{
            paddingLeft: s(16),
            paddingRight: s(8),
            paddingVertical: mvs(12),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-neueBold"
          >
            €
          </ScaledText>
        </View>
        <ScaledTextInput
          containerClassName="flex-1"
          className="text-foreground rounded-xl"
          placeholder="0"
          placeholderTextColor="#A49A99"
          keyboardType="numeric"
          value={value !== undefined ? String(value) : ""}
          onChangeText={(v) => {
            const digits = v.replace(/[^0-9]/g, "");
            onChange(digits ? Number(digits) : undefined);
          }}
          onFocus={() => setFocused(field)}
          onBlur={() => setFocused(null)}
          maxLength={6}
        />
        <View style={{ paddingRight: s(16), paddingVertical: mvs(12) }}>
          <ScaledText
            allowScaling={false}
            variant="body2"
            className="text-foreground/80"
          >
            EUR
          </ScaledText>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background pb-40 relative">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <RegistrationProgress
        currentStep={11}
        totalSteps={totalStepsDisplay}
        name=" Set your pricing"
        description="Enter your minimum price and hourly rate to guide clients."
        icon={<SVGIcons.Pricing width={19} height={19} />}
      />

      {renderCurrencyInput(
        "Minimum rate",
        step11.minimumPrice,
        (n) => updateStep11({ minimumPrice: n }),
        "min"
      )}
      {renderCurrencyInput(
        "Hourly rate",
        step11.hourlyRate,
        (n) => updateStep11({ hourlyRate: n }),
        "hourly"
      )}

      {/* Footer */}
      <NextBackFooter
        onNext={onNext}
        nextDisabled={!canProceed}
        backLabel="Back"
        onBack={() => router.back()}
      />
    </View>
  );
}
