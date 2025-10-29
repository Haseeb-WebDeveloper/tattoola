import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useUserRegistrationV2Store } from "@/stores/userRegistrationV2Store";
import type { FormErrors, UserV2Step3 } from "@/types/auth";
import { normalizeItalianPhone } from "@/utils/normalize-italian-phone";
import { mvs, s } from "@/utils/scale";
import { UserStep3ValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function formatItalianPhoneForInput(phone: string): string {
  // Show only the user part (remove +39 prefix), pad with leading zeros
  return phone.replace(/^\+?39\s?/, "");
}

export default function UserRegistrationStep3() {
  const { step3, updateStep3, setErrors, clearErrors, setCurrentStepDisplay } =
    useUserRegistrationV2Store();

  const [formData, setFormData] = useState<UserV2Step3>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

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
    updateStep3({
      ...formData,
      phone: normalizeItalianPhone(formData.phone),
    });
    setCurrentStepDisplay(3);
    router.push("/(auth)/user-registration/step-4");
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
          name="Create your profile"
          icon={<SVGIcons.Person width={25} height={25} />}
        />

        {/* Inputs */}
        <View style={{ paddingHorizontal: s(24) }}>
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Nome
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl border border-gray`}
              className="text-foreground rounded-xl"
              placeholder="Mario"
              placeholderTextColor="#A49A99"
              value={formData.firstName}
              onChangeText={(v) => handleInputChange("firstName", v)}
            />
            {!!errors.firstName && (
              <ScaledText variant="11" className="text-error mt-1">
                {errors.firstName}
              </ScaledText>
            )}
          </View>

          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Cognome
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl border border-gray`}
              className="text-foreground rounded-xl"
              placeholder="Rossi"
              placeholderTextColor="#A49A99"
              value={formData.lastName}
              onChangeText={(v) => handleInputChange("lastName", v)}
            />
            {!!errors.lastName && (
              <ScaledText variant="11" className="text-error mt-1">
                {errors.lastName}
              </ScaledText>
            )}
          </View>

          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Telefono
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <View className="flex-row items-center rounded-xl">
              <View style={{ paddingLeft: s(16), paddingRight: s(8) }}>
                <ScaledText
                  allowScaling={false}
                  variant="body1"
                  className="text-foreground font-neueBold"
                >
                  +39
                </ScaledText>
              </View>
              <ScaledTextInput
                containerClassName="flex-1 border border-gray"
                className="text-foreground rounded-xl"
                placeholder="3XXXXXXXXX"
                placeholderTextColor="#A49A99"
                value={formatItalianPhoneForInput(formData.phone)}
                onChangeText={(v) => {
                  const digits = v.replace(/[^0-9]/g, "").slice(0, 10);
                  handleInputChange("phone", `+39${digits}`);
                }}
                keyboardType="number-pad"
                textContentType="telephoneNumber"
                maxLength={10}
              />
            </View>
            {!!errors.phone && (
              <ScaledText variant="11" className="text-error mt-1">
                {errors.phone}
              </ScaledText>
            )}
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
