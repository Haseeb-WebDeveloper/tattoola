import AuthStepHeader from "@/components/ui/auth-step-header";
import { useUserRegistrationStore } from "@/stores";
import type { FormErrors, UserV2Step3 } from "@/types/auth";
import { UserStep3ValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { normalizeItalianPhone } from "@/utils/normalize-italian-phone";

function formatItalianPhoneForInput(phone: string): string {
  // Show only the user part (remove +39 prefix), pad with leading zeros
  return phone.replace(/^\+?39\s?/, "");
}

export default function UserRegistrationStep3() {
  const { step3, updateStep, setErrors, clearErrors, setCurrentStep } =
    useUserRegistrationStore();

  const [formData, setFormData] = useState<UserV2Step3>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [focused, setFocused] = useState<
    "firstName" | "lastName" | "phone" | null
  >(null);

  // Load existing data if available
  useEffect(() => {
    if (step3 && Object.keys(step3).length > 0) {
      setFormData(step3 as UserV2Step3);
    }
  }, [step3]);

  const handleInputChange = (field: keyof UserV2Step3, value: string) => {
    if (field === "phone") {
      // Normalize before storing for validation
      value = normalizeItalianPhone(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setLocalErrors((prev) => ({ ...prev, [field]: "" }));
      clearErrors();
    }
  };

  // Patch validation to use normalized phone
  const validateForm = (): boolean => {
    // Patch a normalized copy for validation
    const dataToValidate = {
      ...formData,
      phone: normalizeItalianPhone(formData.phone),
    };
    const formErrors = ValidationUtils.validateForm(
      dataToValidate,
      UserStep3ValidationSchema
    );
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Save always with normalized phone number
    updateStep("step3", {
      ...formData,
      phone: normalizeItalianPhone(formData.phone),
    });
    setCurrentStep(3);
    router.push("/(auth)/user-registration/step-4");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background relative"
    >
      {/* Header */}
      <AuthStepHeader />

      {/* Progress dots */}
      <View className="items-center mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < 3 ? (idx === 2 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-4 items-center">
        <Text className="text-foreground section-title font-neueBold">
          Informazioni personali
        </Text>
        <Text className="text-tat ta-body-3-button-text mt-2 text-center px-2">
          Queste informazioni servono solo per registrare il tuo account e non
          saranno mai pubblicate.
        </Text>
      </View>

      {/* Inputs */}
      <View className="px-6">
        <Text className="mb-2 label">
          Nome<Text className="text-error">*</Text>
        </Text>
        <View
          className={`rounded-xl bg-black/40 ${focused === "firstName" ? "border-2 border-foreground" : "border border-gray"}`}
        >
          <TextInput
            className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
            placeholder="Mario"
            placeholderTextColor="#A49A99"
            value={formData.firstName}
            onChangeText={(v) => handleInputChange("firstName", v)}
            onFocus={() => setFocused("firstName")}
            onBlur={() => setFocused(null)}
          />
        </View>
        {!!errors.firstName && (
          <Text className="text-xs text-error mt-1">{errors.firstName}</Text>
        )}

        <View className="mt-6">
          <Text className="mb-2 label">
            Cognome<Text className="text-error">*</Text>
          </Text>
          <View
            className={`rounded-xl bg-black/40 ${focused === "lastName" ? "border-2 border-foreground" : "border border-gray"}`}
          >
            <TextInput
              className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
              placeholder="Rossi"
              placeholderTextColor="#A49A99"
              value={formData.lastName}
              onChangeText={(v) => handleInputChange("lastName", v)}
              onFocus={() => setFocused("lastName")}
              onBlur={() => setFocused(null)}
            />
          </View>
          {!!errors.lastName && (
            <Text className="text-xs text-error mt-1">{errors.lastName}</Text>
          )}
        </View>

        <View className="mt-6">
          <Text className="mb-2 label">
            Telefono<Text className="text-error">*</Text>
          </Text>
          <View
            className={`flex-row items-center rounded-xl bg-black/40 ${focused === "phone" ? "border-2 border-foreground" : "border border-gray"}`}
          >
            <View className="pl-4 pr-2 py-3 flex-row items-center">
              <Text className="text-foreground font-neueBold">+39</Text>
            </View>
            <TextInput
              className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
              placeholder="3XXXXXXXXX"
              placeholderTextColor="#A49A99"
              value={formatItalianPhoneForInput(formData.phone)}
              onChangeText={(v) => {
                // Only let user enter digits, max 10 (cell), no prefix
                const digits = v.replace(/[^0-9]/g, "").slice(0, 10);
                handleInputChange("phone", `+39${digits}`);
              }}
              onFocus={() => setFocused("phone")}
              onBlur={() => setFocused(null)}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              maxLength={10}
              // Italian mobile numbers are 10 digits after +39
            />
          </View>
          {!!errors.phone && (
            <Text className="text-xs text-error mt-1">{errors.phone}</Text>
          )}
        </View>
      </View>

      {/* Footer actions */}
      <View className="flex-row justify-between px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
        <TouchableOpacity
          onPress={handleBack}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          className="rounded-full bg-primary px-8 py-4"
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
