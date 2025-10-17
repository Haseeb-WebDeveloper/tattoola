import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import type { FormErrors, RegisterCredentials } from "@/types/auth";
import { UserRole } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { RegisterValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const validateForm = (): boolean => {
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

    if (!acceptedTerms) {
      formErrors.terms = "You must accept the Terms of Use and Privacy Policy";
    }

    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    // Navigate immediately to email confirmation and start background signup
    setInProgress();
    router.push("/(auth)/email-confirmation");

    try {
      const result = await signUp(formData);
      setSuccess();
      if (!result.needsVerification) {
        router.push("/(auth)/welcome");
      }
    } catch (error: any) {
      const message = error?.message || "An error occurred during registration";
      setError(message);
      router.replace("/(auth)/register");
      Alert.alert("Registration Failed", message, [{ text: "OK" }]);
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleArtistRegister = () => {
    router.push("/(auth)/artist-register");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingSpinner message="Creating your account..." overlay />
      </SafeAreaView>
    );
  }

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
      <View
        className="px-4"
        style={{ marginTop: mvs(15), marginBottom: mvs(20) }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleLogin}
            className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.Close className="w-8 h-8" />
          </TouchableOpacity>
          <SVGIcons.LogoLight className="h-10" />
          <View className="w-10" />
        </View>
        <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
      </View>

      {/* Steps indicator */}
      <View className="items-center" style={{ marginBottom: mvs(24) }}>
        <View className="flex-row items-center relative gap-1">
          <View
            className="absolute left-0 right-0 top-1/2"
            style={{
              height: 1,
              backgroundColor: "#A49A99",
              zIndex: 0,
              marginLeft: 0,
              marginRight: 0,
            }}
          />
          {steps.map((step) => (
            <View
              key={step}
              className={`${step === currentStep ? "w-4 h-4" : " w-[9px] h-[9px] opacity-70"} rounded-full bg-foreground `}
              style={{ zIndex: 100 }}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View
        className="px-6 flex-row gap-2 items-center justify-center"
        style={{ marginBottom: mvs(24) }}
      >
        <SVGIcons.Pen3 className="w-7 h-7" />
        <ScaledText
          variant="sectionTitle"
          allowScaling={false}
          className="text-foreground"
        >
          Registrati
        </ScaledText>
      </View>

      {/* Inputs */}
      <View className="px-6">
        <ScaledText
          variant="sm"
          className="text-tat textcenter mb-2 font-montserratSemibold"
        >
          Username (inserisci un nome univoco)
        </ScaledText>
        <ScaledTextInput
          containerClassName={`flex-row items-center rounded-xl ${focusedField === "username" ? "border-2 border-foreground" : "border border-gray"}`}
          className="flex-1 text-foreground rounded-xl"
          placeholder="TattooLover_97"
          placeholderTextColor="#A49A99"
          autoCapitalize="none"
          value={formData.username}
          onChangeText={(value) => handleInputChange("username", value)}
          onFocus={() => setFocusedField("username")}
          onBlur={() => setFocusedField(null)}
        />
        {!!errors.username && (
          <Text className="text-xs text-error mt-1">{errors.username}</Text>
        )}

        <View style={{ marginTop: mvs(15) }}>
          <ScaledText variant="sm" className="text-tat mb-2 font-montserratSemibold">
            Email
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl ${focusedField === "email" ? "border-2 border-foreground" : "border border-gray"}`}
            className="flex-1 text-foreground rounded-xl"
            placeholder="abc@gmail.com"
            placeholderTextColor="#A49A99"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
          {!!errors.email && (
            <Text className="text-xs text-error mt-1">{errors.email}</Text>
          )}
        </View>

        <View style={{ marginTop: mvs(15) }}>
          <ScaledText variant="sm" className="text-tat mb-2 font-montserratSemibold">
            Password (min. 8 caratteri, di cui almeno un numero)
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl ${focusedField === "password" ? "border-2 border-foreground" : "border border-gray"}`}
            className="flex-1 text-foreground rounded-xl"
            placeholder="*************"
            placeholderTextColor="#A49A99"
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
            <Text className="text-xs text-error mt-1">{errors.password}</Text>
          )}
        </View>

        <View style={{ marginTop: mvs(15) }}>
          <ScaledText variant="sm" className="text-tat mb-2 font-montserratSemibold">
            Conferma Password
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl ${focusedField === "confirmPassword" ? "border-2 border-foreground" : "border border-gray"}`}
            className="flex-1 text-foreground rounded-xl"
            placeholder="*************"
            placeholderTextColor="#A49A99"
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
            <Text className="text-xs text-error mt-1">
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* Register Button */}
        <View className="items-center" style={{ marginTop: mvs(32) }}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleRegister}
            disabled={loading}
            className="bg-primary rounded-full items-center w-full"
            style={{ paddingVertical: mvs(12), paddingHorizontal: s(32) }}
          >
            <ScaledText
              variant="body1"
              className="text-foreground font-neueBold"
            >
              Register
            </ScaledText>
          </TouchableOpacity>
        </View>

        {/* Footer link */}
        <View className="items-center mt-8 mb-8">
          <ScaledText
            variant="sm"
            className="text-[#A49A99] text-center font-montserratMedium"
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
