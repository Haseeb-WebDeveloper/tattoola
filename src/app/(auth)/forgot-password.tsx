import AuthStepHeader from '@/components/ui/auth-step-header';
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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function ForgotPasswordScreen() {
  const { forgotPassword, loading } = useAuth();
  const [formData, setFormData] = useState<ForgotPasswordData>({
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailSent, setEmailSent] = useState(false);
  const [focusedField, setFocusedField] = useState<
    keyof ForgotPasswordData | null
  >(null);

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
      toast.error(
        error instanceof Error
          ? error.message
          : "Invio dell'email di reset non riuscito"
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
        className="flex-1 bg-background"
      >
        <LoadingSpinner message="Invio dell'email di reset..." overlay />
      </SafeAreaView>
    );
  }

  const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
    Dimensions.get("window");

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          StyleSheet.absoluteFillObject,
          { height: SCREEN_HEIGHT, width: SCREEN_WIDTH, zIndex: 0 },
        ]}
        pointerEvents="none"
      />

      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        extraKeyboardSpace={100}
        bottomOffset={62}
        ScrollViewComponent={ScrollView}
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-transparent"
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ zIndex: 1 }}
      >
        {/* Header with logo */}
        <AuthStepHeader />

        {/* Title and subtitle */}
        <View
          className="items-center"
          style={{ paddingHorizontal: s(24), }}
        >
          <ScaledText
            allowScaling={false}
            variant="2xl"
            className="text-foreground text-center font-neueSemibold"
          >
            Password dimenticata?
          </ScaledText>
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-gray text-center font-montserratLight"
          >
            Inserisci il tuo indirizzo email e ti invieremo un link per
            reimpostare la password.
          </ScaledText>
        </View>

        {/* Form */}
        {!emailSent && (
          <View style={{ paddingHorizontal: s(16), paddingTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-foreground mb-2 font-montserratMedium"
            >
              Email
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl ${focusedField === "email" ? "border-2 border-foreground" : errors.email ? "border-2 border-error" : "border border-gray"}`}
              className="flex-1 text-foreground rounded-xl"
              style={{ fontSize: s(12) }}
              placeholder="Inserisci la tua email"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
            {!!errors.email && (
              <ScaledText variant="body4" className="text-error mt-1">
                {errors.email}
              </ScaledText>
            )}

            <View className="items-center mt-6">
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleSendResetEmail}
                disabled={loading}
                className="bg-primary rounded-full items-center w-full"
                style={{ paddingVertical: mvs(10), paddingHorizontal: s(32) }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold text-center"
                >
                  Invia link di reset
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Email Sent State */}
        {emailSent && (
          <View className="items-center"
            style={{ paddingHorizontal: s(16), paddingTop: mvs(24) }}
          >
            <View style={{ marginBottom: mvs(16) }}>
              <SVGIcons.MailSent width={s(40)} height={s(40)} />
            </View>
            <ScaledText
              variant="2xl"
              className="text-foreground font-neueBold text-center"
            >
              Controlla la tua email
            </ScaledText>
            <ScaledText
              variant="body2"
              className="text-gray text-center mt-2 font-neueLight"
            >
              Ti abbiamo inviato un link per reimpostare la password a
            </ScaledText>
            <ScaledText
              variant="body2"
              className="text-foreground font-montserratSemibold mt-1"
            >
              {formData.email}
            </ScaledText>

            <View className="items-center mt-6" style={{ gap: 12 }}>
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
                  Torna al login
                </ScaledText>
              </TouchableOpacity>

              {/* <TouchableOpacity onPress={handleResendEmail}
                className="border-gray rounded-full"
                style={{ paddingVertical: mvs(8), paddingHorizontal: s(20), borderWidth: 1 }}
              >
                <ScaledText
                  variant="sm"
                  className="text-foreground font-montserratSemibold text-center"
                >
                  inviare nuovamente
                </ScaledText>
              </TouchableOpacity> */}
            </View>
          </View>
        )}

        {/* Bottom link */}
        <View className="items-center"
          style={{ paddingHorizontal: s(16), paddingTop: mvs(24) }}
        >
          <TouchableOpacity onPress={handleBackToLogin}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-gray font-montserratMedium"
            >
              Ti sei ricordato la password?{" "}
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                Accedi
              </ScaledText>
            </ScaledText>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
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
