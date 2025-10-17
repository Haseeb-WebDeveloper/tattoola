import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import type { ForgotPasswordData, FormErrors } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import {
  ForgotPasswordValidationSchema,
  ValidationUtils,
} from "@/utils/validation";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const { forgotPassword, loading } = useAuth();
  const [formData, setFormData] = useState<ForgotPasswordData>({
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailSent, setEmailSent] = useState(false);

  const handleInputChange = (
    field: keyof ForgotPasswordData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(
      formData,
      ForgotPasswordValidationSchema
    );
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleSendResetEmail = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await forgotPassword(formData);
      setEmailSent(true);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send reset email",
        [{ text: "OK" }]
      );
    }
  };

  const handleBackToLogin = () => {
    router.push("/(auth)/login");
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleSendResetEmail();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <LoadingSpinner message="Sending reset email..." overlay />
      </SafeAreaView>
    );
  }

  if (emailSent) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <SVGIcons.MailSent width={s(40)} height={s(40)} />
            </View>
            <ScaledText variant="2xl" className="text-foreground font-neueBold">
              Check Your Email
            </ScaledText>
            <ScaledText variant="body2" className="text-gray text-center">
              We&apos;ve sent a password reset link to{"\n"}
              <ScaledText
                variant="body2"
                className="text-foreground font-montserratSemibold"
              >
                {formData.email}
              </ScaledText>
            </ScaledText>
          </View>

          <View style={styles.instructions}>
            <ScaledText variant="body2" className="text-gray text-center">
              Click the link in the email to reset your password. If you
              don&apos;t see the email, check your spam folder.
            </ScaledText>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleBackToLogin}
              className="bg-primary rounded-full"
              style={{ paddingVertical: mvs(10), paddingHorizontal: s(32) }}
            >
              <ScaledText
                variant="body1"
                className="text-foreground font-neueBold"
              >
                Back to Login
              </ScaledText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendLink]}
              onPress={handleResendEmail}
            >
              <ScaledText
                variant="body2"
                className="text-foreground font-montserratSemibold"
              >
                Didn&apos;t receive the email? Resend
              </ScaledText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <SVGIcons.ChevronLeft className="w-6 h-6" />
        </TouchableOpacity>

        <View style={styles.header}>
          <ScaledText variant="2xl" className="text-foreground font-neueBold">
            Forgot Password?
          </ScaledText>
          <ScaledText variant="body2" className="text-gray text-center">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </ScaledText>
        </View>

        <View style={styles.form}>
          <ScaledText variant="sm" className="text-foreground mb-2">
            Email
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl border ${errors.email ? "border-error" : "border-gray"}`}
            className="flex-1 text-foreground rounded-xl"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!errors.email && (
            <ScaledText variant="body4" className="text-error mt-1">
              {errors.email}
            </ScaledText>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleSendResetEmail}
            disabled={loading}
            className="bg-primary rounded-full"
            style={[
              styles.sendButton,
              { paddingVertical: mvs(10), paddingHorizontal: s(32) },
            ]}
          >
            <ScaledText
              variant="body1"
              className="text-foreground font-neueBold text-center"
            >
              Send Reset Link
            </ScaledText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.loginLink}
            onPress={handleBackToLogin}
          >
            <ScaledText variant="body2" className="text-gray text-center">
              Remember your password?{" "}
              <ScaledText
                variant="body2"
                className="text-foreground font-montserratSemibold"
              >
                Sign in
              </ScaledText>
            </ScaledText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    marginBottom: 24,
  },
  instructions: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  sendButton: {
    marginTop: 24,
  },
  actions: {
    alignItems: "center",
    gap: 24,
  },
  footer: {
    alignItems: "center",
  },
  loginLink: {
    padding: 8,
  },
  resendLink: {
    padding: 8,
  },
});
