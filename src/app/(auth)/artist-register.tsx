import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/providers/AuthProvider";
import { useSignupStore } from "@/stores/signupStore";
import type { FormErrors, RegisterCredentials } from "@/types/auth";
import { UserRole } from "@/types/auth";
import { RegisterValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ArtistRegisterScreen() {
  const { signUp, loading } = useAuth();
  const { setInProgress, setSuccess, setError, reset } = useSignupStore();
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: UserRole.ARTIST,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<
    keyof RegisterCredentials | null
  >(null);

  const totalSteps = 13;
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

    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    console.log("formData starting registration", formData);

    // Navigate immediately to email confirmation and start background signup
    setInProgress();
    router.push("/(auth)/email-confirmation");

    try {
      const result = await signUp(formData);
      console.log("result from signUp", result);
      // If sign up succeeds, mark success and remain on email-confirmation
      setSuccess();
      if (!result.needsVerification) {
        router.push("/(auth)/welcome");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred during registration";
      setError(message);
      // Go back to the form and show the error
      router.replace("/(auth)/artist-register");
      Alert.alert("Registration Failed", message, [{ text: "OK" }]);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingSpinner message="Creating your artist account..." overlay />
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
      <View className="px-4 my-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleClose}
            className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
          >
            <Image
              source={require("@/assets/images/icons/close.png")}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Image
            source={require("@/assets/logo/logo-light.png")}
            className="h-10"
            resizeMode="contain"
          />
          <View className="w-10" />
        </View>
        <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
      </View>

      {/* Steps indicator */}
      <View className="items-center mb-8">
        <View className="flex-row items-center relative gap-1">
          {/* Horizontal line behind the steps */}
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
          {steps.map((step, idx) => (
            <View
              key={step}
              className={`${step === currentStep ? "w-4 h-4" : " w-[9px] h-[9px] opacity-70"} rounded-full bg-foreground `}
              style={{
                zIndex: 100,
              }}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-6 flex-row gap-2 items-center justify-center">
        <Image
          source={require("@/assets/images/icons/pen.png")}
          resizeMode="contain"
          className="w-7 h-7"
        />
        <Text className="text-foreground section-title font-neueBold">
          Registrati come Artista
        </Text>
      </View>

      {/* Inputs */}
      <View className="px-6">
        {/* Username */}
        <Text className="text-foreground textcenter mb-2 ta-body-3-button-text">
          Username (inserisci un nome univoco)
        </Text>
        <View
          className={`flex-row items-center rounded-xl bg-black/40 ${focusedField === "username" ? "border-2 border-foreground" : "border border-gray"}`}
        >
          <TextInput
            className="flex-1 px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
            placeholder="TattooKing_97"
            placeholderTextColor="#A49A99"
            autoCapitalize="none"
            value={formData.username}
            onChangeText={(value) => handleInputChange("username", value)}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        {!!errors.username && (
          <Text className="text-xs text-error mt-1">{errors.username}</Text>
        )}

        {/* Email */}
        <View className="mt-6">
          <Text className="text-foreground mb-2 ta-body-3-button-text">
            Email
          </Text>
          <View
            className={`flex-row items-center rounded-xl bg-black/40 ${focusedField === "email" ? "border-2 border-foreground" : "border border-gray"}`}
          >
            <TextInput
              className="flex-1 px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
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
          </View>
          {!!errors.email && (
            <Text className="text-xs text-error mt-1">{errors.email}</Text>
          )}
        </View>

        {/* Password */}
        <View className="mt-6">
          <Text className="text-foreground mb-2 ta-body-3-button-text">
            Password (min. 8 caratteri, di cui almeno un numero)
          </Text>
          <View
            className={`flex-row items-center rounded-xl bg-black/40 ${focusedField === "password" ? "border-2 border-foreground" : "border border-gray"}`}
          >
            <TextInput
              className="flex-1 px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
              placeholder="*************"
              placeholderTextColor="#A49A99"
              secureTextEntry
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {!!errors.password && (
            <Text className="text-xs text-error mt-1">{errors.password}</Text>
          )}
        </View>

        {/* Confirm Password */}
        <View className="mt-6">
          <Text className="text-foreground mb-2 ta-body-3-button-text">
            Conferma Password
          </Text>
          <View
            className={`flex-row items-center rounded-xl bg-black/40 ${focusedField === "confirmPassword" ? "border-2 border-foreground" : "border border-gray"}`}
          >
            <TextInput
              className="flex-1 px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
              placeholder="*************"
              placeholderTextColor="#A49A99"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {!!errors.confirmPassword && (
            <Text className="text-xs text-error mt-1">
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* Register Button */}
        <View className="items-center mt-8">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleRegister}
            disabled={loading}
            className="bg-primary rounded-full py-4 px-8 items-center w-full"
          >
            <Text className="text-foreground tat-body-1 font-neueBold">
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer link */}
        <View className="items-center mt-8 mb-8">
          <Text className="text-[#A49A99]">
            Already have an account?{" "}
            <Text
              className="text-foreground font-semibold"
              onPress={handleLogin}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
