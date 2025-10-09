import { RequireGuest } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/providers/AuthProvider";
import type { FormErrors, LoginCredentials } from "@/types/auth";
import { LoginValidationSchema, ValidationUtils } from "@/utils/validation";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

function LoginScreenContent() {
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<
    keyof LoginCredentials | null
  >(null);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(
      formData,
      LoginValidationSchema
    );
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await signIn(formData);
      // Navigation will be handled by the auth context
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error
          ? error.message
          : "An error occurred during login",
        [{ text: "OK" }]
      );
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
  };

  const handleArtistLogin = () => {
    router.push("/(auth)/artist-register");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingSpinner message="Signing in..." overlay />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-black"
      >
        {/* Hero Section with logo + image + gradient like welcome.tsx */}
        <View className="relative">
          <View className="mt-4 w-full flex justify-center items-center">
            <Image
              source={require("@/assets/logo/logo-light.png")}
              className="h-12"
              resizeMode="contain"
            />
          </View>

          <View className="w-full relative">
            <Image
              source={require("@/assets/auth/login.jpg")}
              className="w-full h-[320px]"
              resizeMode="cover"
            />
            <LinearGradient
              colors={["#000000", "transparent", "transparent", "#000000"]}
              locations={[0, 0.25, 0.75, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="absolute w-full h-[320px] top-0 left-0 right-0 bottom-0 z-10"
            />

            {/* Headline */}
            <View className="absolute bottom-6 left-0 right-0 px-6 z-20">
              <Text className="text-foreground text-center  section-title font-semibold">
                Welcome back!!
              </Text>
            </View>
          </View>
        </View>

        {/* Inputs */}
        <View className="px-6 pt-6">
          <View className="mb-4">
            <Text className="mb-2 label">Email</Text>
            <View
              className={`flex-row items-center rounded-xl bg-black/40 ${focusedField === "email" ? "border-2 border-foreground" : "border border-gray"}`}
            >
              <TextInput
                className="flex-1 px-4 py-3 text-base text-foreground"
                placeholder="Email"
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

          <View className="mb-2">
            <Text className="mb-2 label">
              Password
            </Text>
            <View
              className={`flex-row items-center rounded-xl bg-black/40 ${focusedField === "password" ? "border-2 border-foreground" : "border border-gray"}`}
            >
              <TextInput
                className="flex-1 px-4 py-3 text-base text-foreground"
                placeholder="Password"
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

          <TouchableOpacity
            className="self-end mb-6"
            onPress={handleForgotPassword}
          >
            <Text className="text-sm text-gray">Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign in button */}
        <View className="items-center px-6">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary rounded-full py-4 px-8 items-center w-full"
          >
            <Text className="text-foreground tat-body-1 font-neueBold">
              Sign in
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom link */}
        <View className="items-center mt-10 px-6 pb-8">
          <Text className="text-[#A49A99]">
            Don’t have an account?{" "}
            <Text
              className="text-foreground font-semibold"
              onPress={handleRegister}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export default function LoginScreen() {
  return (
    <RequireGuest>
      <LoginScreenContent />
    </RequireGuest>
  );
}
