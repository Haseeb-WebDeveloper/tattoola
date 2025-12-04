import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useUsernameValidation } from "@/hooks/useUsernameValidation";
import { useEmailAvailability } from "@/hooks/useEmailAvailability";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import type { FormErrors, RegisterCredentials } from "@/types/auth";
import { UserRole } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { RegisterValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

export default function ArtistRegisterScreen() {
  const { signUp, loading } = useAuth();
  const { setInProgress, setSuccess, setError, reset, formData: storedFormData } = useSignupStore();
  const [formData, setFormData] = useState<RegisterCredentials>(
    storedFormData || {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.ARTIST,
    }
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<
    keyof RegisterCredentials | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username validation hook
  const usernameValidation = useUsernameValidation(formData.username);
  const emailAvailability = useEmailAvailability(formData.email);

  const totalSteps = 13;
  const currentStep = 1;
  const steps = useMemo(
    () => Array.from({ length: totalSteps }, (_, i) => i + 1),
    []
  );

  // Restore form data from store on mount if available
  useEffect(() => {
    if (storedFormData) {
      setFormData(storedFormData);
    }
  }, []);

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
            return "Le password non coincidono";
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
        formErrors.username = "Questo username è già stato utilizzato";
      }
    }

    // Check email availability (only error, no success border/state)
    if (!formErrors.email && formData.email.trim().length > 0) {
      const isEmailAvailable = await emailAvailability.manualCheck(
        formData.email
      );
      if (!isEmailAvailable) {
        formErrors.email = "Questa email è già registrata";
      }
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
    setInProgress(formData.email, formData);
    router.push("/(auth)/email-confirmation");

    try {
      await signUp(formData);
      // If sign up succeeds, mark success and remain on email-confirmation
      setSuccess();
    } catch (error: any) {
      const code = error?.code;

    if (code === "EMAIL_ALREADY_VERIFIED") {
      const message =
        "Questa email è già registrata e verificata. Accedi per continuare.";

      setError(message);
      toast.error(message);

      router.replace("/(auth)/login");
      return;
    }

    const message =
      error?.message || "Si è verificato un errore durante la registrazione";

    setError(message);
    toast.error(message);

    // Do NOT redirect back to register — stay in the flow
    router.replace("/(auth)/email-confirmation");
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const goToReg = () => {
    router.push("/(auth)/email-confirmation");
  };

  const handleClose = () => {
    router.replace("/(auth)/welcome");
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
        name="Registrati come Artista"
        icon={<SVGIcons.Pen3 className="w-7 h-7" />}
        nameVariant="2xl"
      />

      {/* Inputs */}
      <View className="px-6">
        {/* Username */}
        <ScaledText
          variant="sm"
          className="mb-2 text-tat font-montserratSemibold"
        >
          Username (inserisci un nome univoco)
        </ScaledText>
        <View className="relative">
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl bg-gray-foreground ${focusedField === "username" ? "border-2 border-foreground" : "border border-gray"} ${usernameValidation.isFormatValid && usernameValidation.available === true ? "border-success" : ""} ${usernameValidation.available === false ? "border-red-500" : ""}`}
            className="flex-1 text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="TattooKing_97"
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
            className="mt-1 text-xs text-error font-neueLight"
          >
            {usernameValidation.formatError}
          </ScaledText>
        )}
        {!usernameValidation.formatError &&
          usernameValidation.available === false && (
            <ScaledText
              variant="sm"
              className="mt-1 text-xs text-error font-neueLight"
            >
              Questo username è già stato utilizzato
            </ScaledText>
          )}
        {!usernameValidation.formatError &&
          usernameValidation.available === true && (
            <ScaledText
              variant="sm"
              className="mt-1 text-xs text-success font-neueLight"
            >
              Username disponibile
            </ScaledText>
          )}
        {/* Show form validation errors (from form submit) */}
        {!!errors.username &&
          !usernameValidation.formatError &&
          usernameValidation.available !== false && (
            <ScaledText
              variant="sm"
              className="mt-1 text-xs text-error font-neueLight"
            >
              {errors.username}
            </ScaledText>
          )}

        {/* Email */}
        <View style={{ marginTop: mvs(15) }}>
          <ScaledText
            variant="sm"
            className="mb-2 text-tat font-montserratSemibold"
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
          {/* Only show error state if email is already registered */}
          {!!errors.email && (
            <ScaledText
              variant="sm"
              className="mt-1 text-xs text-error font-neueLight"
            >
              {errors.email}
            </ScaledText>
          )}
        </View>

        {/* Password */}
        <View style={{ marginTop: mvs(15) }}>
          <ScaledText
            variant="sm"
            className="mb-2 text-tat font-montserratSemibold"
          >
            Password (min. 8 caratteri, di cui almeno un numero)
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl bg-transparent ${focusedField === "password" ? "border-2 border-foreground" : "border border-gray"}`}
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
              className="mt-1 text-xs text-error font-neueLight"
            >
              {errors.password}
            </ScaledText>
          )}
        </View>

        {/* Confirm Password */}
        <View style={{ marginTop: mvs(15) }}>
          <ScaledText
            variant="sm"
            className="mb-2 text-tat font-montserratSemibold"
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
              className="mt-1 text-xs text-error font-neueLight"
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
            className="items-center w-full rounded-full bg-primary-brand"
            style={{ paddingVertical: mvs(12), paddingHorizontal: s(32) }}
          >
            <ScaledText
              variant="body1"
              className="text-foreground font-neueBold"
            >
              Registrati
            </ScaledText>
          </TouchableOpacity>
        </View>

        {/* Footer link */}
        <View className="items-center mt-8 mb-8">
          <ScaledText
            variant="md"
            className="text-[#A49A99] font-montserratLight"
          >
            Hai già un account?{" "}
            <ScaledText
              variant="md"
              className="text-foreground font-montserratSemibold"
              onPress={handleLogin}
            >
              Accedi
            </ScaledText>
          </ScaledText>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
