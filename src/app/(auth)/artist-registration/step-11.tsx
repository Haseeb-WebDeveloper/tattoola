import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step11Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

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

  // Only minimumPrice is required, hourlyRate is optional
  const canProceed = isValid(step11Schema, {
    minimumPrice: step11.minimumPrice ?? 0,
    // Don't provide default for hourlyRate, allow undefined to be valid
    hourlyRate: step11.hourlyRate, 
  });

  const validateAll = () => {
    const result = step11Schema.safeParse({
      minimumPrice: step11.minimumPrice ?? 0,
      hourlyRate: step11.hourlyRate,
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
    field: string,
    required?: boolean
  ) => (
    <View style={{ paddingHorizontal: s(24), marginBottom: mvs(12) }}>
      <View
        className="flex-row items-center"
        style={{ marginBottom: mvs(4), gap: s(4) }}
      >
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-tat font-montserratSemibold"
        >
          {label}
        </ScaledText>
        {required ? (
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-error font-montserratSemibold"
          >
            *
          </ScaledText>
        ) : null}
      </View>
      <View
        className={`flex-row items-center rounded-xl bg-tat-foreground ${focused === field ? "border-2 border-foreground" : "border border-gray"}`}
      >
        <View style={{ paddingLeft: s(16) }} className="bg-tat-foreground">
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-gray font-montserratSemibold bg-tat-foreground"
          >
            €
          </ScaledText>
        </View>
        <ScaledTextInput
          containerClassName="flex-1 bg-tat-foreground rounded-xl"
          className="text-foreground rounded-xl font-montserratSemibold bg-tat-foreground"
          style={{ fontSize: s(12), paddingHorizontal: s(4) }}
          placeholder="0"
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
        name=" Imposta i tuoi prezzi"
        description="Inserisci il tuo prezzo minimo e, facoltativamente, la tua tariffa oraria per orientare i clienti."
        icon={<SVGIcons.Pricing width={19} height={19} />}
        nameVariant="2xl"
      />

      {renderCurrencyInput(
        "Tasso minimo",
        step11.minimumPrice,
        (n) => updateStep11({ minimumPrice: n }),
        "min",
        true // Required
      )}
      {renderCurrencyInput(
        "Tariffa oraria (facoltativa)",
        step11.hourlyRate,
        (n) => updateStep11({ hourlyRate: n }),
        "hourly",
        false // Not required
      )}

      {/* Footer */}
      <NextBackFooter
        onNext={onNext}
        nextDisabled={!canProceed}
        backLabel="Indietro"
        onBack={() => router.back()}
      />
    </View>
  );
}
