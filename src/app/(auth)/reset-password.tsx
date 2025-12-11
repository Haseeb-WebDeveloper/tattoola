import AuthStepHeader from "@/components/ui/auth-step-header";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import type { FormErrors, ResetPasswordData } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import {
  ResetPasswordValidationSchema,
  ValidationUtils,
} from "@/utils/validation";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function ResetPasswordScreen() {
  const { resetPassword, loading, session } = useAuth();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [formData, setFormData] = useState<ResetPasswordData>({
    token: token || "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordReset, setPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);

  // Wait for session to be available after code exchange (for PKCE flow)
  useEffect(() => {
    // If we don't have a token and don't have a session, wait a bit for session to be available
    if (!token && !session && !checkingSession) {
      setCheckingSession(true);
      // Give the auth provider time to set the session after code exchange
      const timeout = setTimeout(() => {
        setCheckingSession(false);
      }, 2000); // Wait up to 2 seconds for session

      return () => clearTimeout(timeout);
    } else if (session || token) {
      setCheckingSession(false);
    }
  }, [session, token, checkingSession]);

  const handleInputChange = (field: keyof ResetPasswordData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const validationRules = {
      ...ResetPasswordValidationSchema,
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
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    if (!session && !token) {
      toast.error(
        "Questo link per il reset della password non è valido o è scaduto. Richiedine uno nuovo."
      );
      setTimeout(() => {
        router.push("/(auth)/forgot-password");
      }, 1000);
      return;
    }

    try {
      // If we have a session, we don't need the token in formData
      const resetData: ResetPasswordData = session
        ? {
            token: "",
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }
        : formData;

      await resetPassword(resetData);
      setPasswordReset(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Reimpostazione della password non riuscita"
      );
    }
  };

  const handleBackToLogin = () => {
    router.push("/(auth)/login");
  };

  // Show loading if we're checking for session or if auth is loading
  if (loading || checkingSession) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingSpinner
          message={
            checkingSession
              ? "Caricamento..."
              : "Reimpostazione della password..."
          }
          overlay
        />
      </SafeAreaView>
    );
  }

  if (passwordReset) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: s(24),
            paddingVertical: mvs(32),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            <View className="mb-4">
              <SVGIcons.VarifiedGreen width={s(40)} height={s(40)} />
            </View>
            <ScaledText variant="2xl" className="text-foreground font-neueBold">
              Password reimpostata con successo
            </ScaledText>
            <ScaledText
              variant="body2"
              className="text-center text-gray font-neueLight "
            >
              La tua password è stata reimpostata correttamente. Ora puoi
              accedere con la nuova password.
            </ScaledText>
          </View>

          <View
            className="items-center"
            style={{ paddingHorizontal: s(16), paddingTop: mvs(24) }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleBackToLogin}
              className="rounded-full bg-primary"
              style={{ paddingVertical: mvs(10), paddingHorizontal: s(32) }}
            >
              <ScaledText
                variant="body1"
                className="text-center text-foreground font-neueBold"
              >
                Vai al login
              </ScaledText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ zIndex: 1 }}
    >
      <AuthStepHeader />

      <View className="items-center" style={{ paddingHorizontal: s(24) }}>
        <ScaledText variant="2xl" className="text-foreground font-neueBold">
          Reimposta la tua password
        </ScaledText>
        <ScaledText
          variant="body2"
          className="text-center text-gray font-montserratLight"
        >
          Inserisci qui sotto la tua nuova password
        </ScaledText>
      </View>

      <View style={{ paddingHorizontal: s(16), paddingTop: mvs(24) }}>
        <ScaledText
          variant="sm"
          className="mb-2 text-foreground font-montserratMedium"
        >
          Nuova password
        </ScaledText>
        <ScaledTextInput
          containerClassName={`flex-row items-center rounded-xl ${errors.password ? "border-2 border-error" : "border border-gray"}`}
          className="flex-1 text-foreground rounded-xl"
          placeholder="Inserisci la tua nuova password"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(value) => handleInputChange("password", value)}
          rightAccessory={
            <TouchableOpacity
              accessibilityRole="button"
              className="px-3 py-2"
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

        <View style={{ height: mvs(12) }} />

        <ScaledText
          variant="sm"
          className="mb-2 text-foreground font-montserratMedium"
        >
          Conferma nuova password
        </ScaledText>
        <ScaledTextInput
          containerClassName={`flex-row items-center rounded-xl ${errors.confirmPassword ? "border-2 border-error" : "border border-gray"}`}
          className="flex-1 text-foreground rounded-xl"
          placeholder="Conferma la tua nuova password"
          secureTextEntry={!showConfirmPassword}
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange("confirmPassword", value)}
          rightAccessory={
            <TouchableOpacity
              accessibilityRole="button"
              className="px-3 py-2"
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

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleResetPassword}
          disabled={loading}
          className="rounded-full bg-primary"
          style={{
            paddingVertical: mvs(10),
            paddingHorizontal: s(32),
            marginTop: mvs(24),
          }}
        >
          <ScaledText
            variant="body1"
            className="text-center text-foreground font-neueBold"
          >
            Reimposta password
          </ScaledText>
        </TouchableOpacity>
      </View>

      <View
        className="items-center"
        style={{ paddingHorizontal: s(16), paddingTop: mvs(8) }}
      >
        <TouchableOpacity
          onPress={handleBackToLogin}
          className="items-center justify-center rounded-full"
          style={{ paddingVertical: mvs(10), paddingHorizontal: s(32) }}
        >
          <ScaledText
            variant="body2"
            className="text-center text-gray font-montserratMedium"
          >
            Ti sei ricordato la password?{" "}
            <ScaledText
              variant="body2"
              className="text-center text-foreground font-montserratSemibold"
            >
              Accedi
            </ScaledText>
          </ScaledText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
