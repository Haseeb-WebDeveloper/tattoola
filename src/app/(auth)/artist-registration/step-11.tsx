import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step11Schema } from "@/utils/artistRegistrationValidation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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
    <View className="px-6 mb-6">
      <Text className="mb-2 label">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl bg-black/40 ${focused === field ? "border-2 border-foreground" : "border border-gray"}`}
      >
        <View className="pl-4 pr-2 py-3">
          <Text className="text-foreground font-neueBold">€</Text>
        </View>
        <TextInput
          className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
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
        <View className="pr-4 py-3">
          <Text className="text-foreground/80">EUR</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background pb-40 relative">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <View className="items-center  mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < 11 ? (idx === 10 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-8 flex-row gap-2 items-center justify-center">
        <SVGIcons.Pricing width={22} height={22} />
        <Text className="text-foreground section-title font-neueBold">
          Pricing
        </Text>
      </View>

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
      <View className="flex-row justify-between px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
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
    </View>
  );
}
