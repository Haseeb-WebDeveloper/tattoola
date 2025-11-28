import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useUsernameValidation } from "@/hooks/useUsernameValidation";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import type { FormErrors, RegisterCredentials } from "@/types/auth";
import { UserRole } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { RegisterValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();
  const { setInProgress, setSuccess, setError } = useSignupStore();
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: UserRole.TATTOO_LOVER,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<
    keyof RegisterCredentials | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username validation hook
  const usernameValidation = useUsernameValidation(formData.username);

  const totalSteps = 8; // TL flow ends at step-8 (completion)
  const currentStep = 1;
  const steps = useMemo(
    () => Array.from({ length: totalSteps }, (_, i) => i + 1),
    []
  );

  const handleInputChange = (
    field: keyof RegisterCredentials,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const validationRules = {
      ...RegisterValidationSchema,
      confirmPassword: {
        required: true,
        custom: (value: string) => {
          if (value !== formData.password) {
            return "Passwords do not match";
          }
          return true;
        },
      },
    };

    const formErrors = ValidationUtils.validateForm(formData, validationRules);

    // Check username availability if format is valid
    if (!formErrors.username && formData.username.trim().length >= 3) {
      const isAvailable = await usernameValidation.manualCheck();
      if (!isAvailable) {
        formErrors.username = "This username is already taken";
      }
    }

    if (!acceptedTerms) {
      formErrors.terms = "You must accept the Terms of Use and Privacy Policy";
    }

    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleRegister = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    // Navigate immediately to email confirmation and start background signup
    setInProgress(formData.email);
    router.push("/(auth)/email-confirmation");

    try {
      const result = await signUp(formData);
      setSuccess();
      // if (!result.needsVerification) {
      //   router.push("/(auth)/welcome");
      // }
    } catch (error: any) {
      const message = error?.message || "An error occurred during registration";
      setError(message);
      router.replace("/(auth)/register");
      toast.error(message);
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleArtistRegister = () => {
    router.push("/(auth)/artist-register");
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={150}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-background"
    >
      {/* Header: close + logo */}
      <AuthStepHeader />

      {/* Steps indicator */}
      <RegistrationProgress
        currentStep={currentStep}
        totalSteps={steps.length}
        name="Registrati come user"
        icon={<SVGIcons.User2 width={s(18)} height={s(18)} />}
        nameVariant="2xl"
      />

      {/* Inputs */}
      <View className="px-6">
        <ScaledText
          variant="sm"
          className="text-tat textcenter mb-2 font-montserratSemibold"
        >
          Username (inserisci un nome univoco)
        </ScaledText>
        <View className="relative">
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl ${focusedField === "username" ? "border-2 border-foreground" : "border border-gray"} ${usernameValidation.isFormatValid && usernameValidation.available === true ? "border-success" : ""} ${usernameValidation.available === false ? "border-red-500" : ""}`}
            className="flex-1 text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="TattooLover_97"
            autoCapitalize="none"
            value={formData.username}
            onChangeText={(value) => handleInputChange("username", value)}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
            rightAccessory={
              formData.username.trim().length > 0 ? (
                <View className="px-3">
                  {usernameValidation.checking ? (
                    <ActivityIndicator size="small" color="#A49A99" />
                  ) : usernameValidation.isFormatValid &&
                    usernameValidation.available === true ? (
                    <SVGIcons.CheckGreen
                      width={s(18)}
                      height={s(18)}
                      className="text-success"
                    />
                  ) : usernameValidation.available === false ? (
                    <SVGIcons.Error width={s(18)} height={s(18)} />
                  ) : null}
                </View>
              ) : null
            }
          />
        </View>
        {/* Show format error or availability error */}
        {usernameValidation.formatError && (
          <ScaledText
            variant="sm"
            className="text-xs text-error mt-1 font-neueLight"
          >
            {usernameValidation.formatError}
          </ScaledText>
        )}
        {!usernameValidation.formatError &&
          usernameValidation.available === false && (
            <ScaledText
              variant="sm"
              className="text-xs text-error mt-1 font-neueLight"
            >
              This username is already taken
            </ScaledText>
          )}
        {!usernameValidation.formatError &&
          usernameValidation.available === true && (
            <ScaledText
              variant="sm"
              className="text-xs text-success mt-1 font-neueLight"
            >
              Username is available
            </ScaledText>
          )}
        {/* Show form validation errors (from form submit) */}
        {!!errors.username &&
          !usernameValidation.formatError &&
          usernameValidation.available !== false && (
            <ScaledText
              variant="sm"
              className="text-xs text-error mt-1 font-neueLight"
            >
              {errors.username}
            </ScaledText>
          )}

        <View style={{ marginTop: mvs(15) }}>
          <ScaledText
            variant="sm"
            className="text-tat mb-2 font-montserratSemibold"
          >
            Email
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl ${focusedField === "email" ? "border-2 border-foreground" : "border border-gray"}`}
            className="flex-1 text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="abc@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
          {!!errors.email && (
            <ScaledText
              variant="sm"
              className="text-xs text-error mt-1 font-neueLight"
            >
              {errors.email}
            </ScaledText>
          )}
        </View>

        <View style={{ marginTop: mvs(15) }}>
          <ScaledText
            variant="sm"
            className="text-tat mb-2 font-montserratSemibold"
          >
            Password (min. 8 caratteri, di cui almeno un numero)
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl ${focusedField === "password" ? "border-2 border-foreground" : "border border-gray"}`}
            className="flex-1 text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="*************"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(value) => handleInputChange("password", value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            rightAccessory={
              <TouchableOpacity
                accessibilityRole="button"
                className="px-3 py-2 bg-[#100C0C] rounded-xl"
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPassword ? (
                  <SVGIcons.EyeOpen width={s(18)} height={s(18)} />
                ) : (
                  <SVGIcons.EyeClose width={s(18)} height={s(18)} />
                )}
              </TouchableOpacity>
            }
          />
          {!!errors.password && (
            <ScaledText
              variant="sm"
              className="text-xs text-error mt-1 font-neueLight"
            >
              {errors.password}
            </ScaledText>
          )}
        </View>

        <View style={{ marginTop: mvs(15) }}>
          <ScaledText
            variant="sm"
            className="text-tat mb-2 font-montserratSemibold"
          >
            Conferma Password
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl ${focusedField === "confirmPassword" ? "border-2 border-foreground" : "border border-gray"}`}
            className="flex-1 text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="*************"
            secureTextEntry={!showConfirmPassword}
            value={formData.confirmPassword}
            onChangeText={(value) =>
              handleInputChange("confirmPassword", value)
            }
            onFocus={() => setFocusedField("confirmPassword")}
            onBlur={() => setFocusedField(null)}
            rightAccessory={
              <TouchableOpacity
                accessibilityRole="button"
                className="px-3 py-2 bg-[#100C0C] rounded-xl"
                onPress={() => setShowConfirmPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showConfirmPassword ? (
                  <SVGIcons.EyeOpen width={s(18)} height={s(18)} />
                ) : (
                  <SVGIcons.EyeClose width={s(18)} height={s(18)} />
                )}
              </TouchableOpacity>
            }
          />
          {!!errors.confirmPassword && (
            <ScaledText
              variant="sm"
              className="text-xs text-error mt-1 font-neueLight"
            >
              {errors.confirmPassword}
            </ScaledText>
          )}
        </View>

        {/* Register Button */}
        <View className="items-center" style={{ marginTop: mvs(32) }}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleRegister}
            disabled={loading}
            className={` rounded-full items-center w-full bg-primary-brand `}
            style={{ paddingVertical: mvs(12), paddingHorizontal: s(32) }}
          >
            <ScaledText
              variant="body1"
              className="text-foreground font-neueBold"
            >
              Submit
            </ScaledText>
          </TouchableOpacity>
        </View>

        {/* Footer link */}
        <View className="items-center mt-8 mb-8">
          <ScaledText
            variant="sm"
            className="text-[#A49A99] text-center font-montserratLight"
          >
            Already have an account?{" "}
            <ScaledText
              variant="sm"
              className="text-foreground font-montserratSemibold"
              onPress={handleLogin}
            >
              Sign in
            </ScaledText>
          </ScaledText>
          <View className="mt-2" />
          <ScaledText
            variant="sm"
            className="text-foreground font-montserratSemibold"
            onPress={handleArtistRegister}
          >
            Are you an Artist?
          </ScaledText>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
