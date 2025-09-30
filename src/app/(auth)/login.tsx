import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/providers/AuthProvider";
import type { FormErrors, LoginCredentials } from "@/types/auth";
import { LoginValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

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
        error instanceof Error ? error.message : "An error occurred during login",
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
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 py-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-12">
            <Text className="text-3xl font-bold text-foreground text-center mb-2">
              Welcome to Tattoola
            </Text>
            <Text className="text-base text-muted-foreground text-center">
              Sign in to your account
            </Text>
          </View>

          <View className="flex-1 mb-8">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              error={errors.password}
              required
            />

            <TouchableOpacity
              className="self-end mb-6"
              onPress={handleForgotPassword}
            >
              <Text className="text-sm text-muted-foreground">
                Forgot your password?
              </Text>
            </TouchableOpacity>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              className="mt-2"
            />
          </View>

          <View className="items-center gap-4">
            <TouchableOpacity
              className="p-2"
              onPress={handleRegister}
            >
              <Text className="text-base text-muted-foreground text-center">
                Not registered?{" "}
                <Text className="text-foreground font-semibold">Register</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-2"
              onPress={handleArtistLogin}
            >
              <Text className="text-base text-foreground font-medium text-center">
                Or are you an Artist?
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}