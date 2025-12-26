import { RequireGuest } from "@/components/AuthGuard";
import { CustomToast } from "@/components/ui/CustomToast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import type { FormErrors, LoginCredentials } from "@/types/auth";
import { mvs, s, scaledVSize } from "@/utils/scale";
import { LoginValidationSchema, ValidationUtils } from "@/utils/validation";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";


import { useLocalSearchParams, useRouter } from "expo-router";

function LoginScreenContent() {
  const { signIn, loading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<
    keyof LoginCredentials | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);

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
      // After login, redirect to previous page if present
      const redirectTo = params.redirect as string | undefined;
      if (redirectTo) {
        router.replace(redirectTo);
      }
      // Otherwise, navigation will be handled by the auth context
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Si è verificato un errore durante l'accesso";
      let toastId: any;
      toastId = toast.custom(
        <CustomToast
          message={message}
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />, 
        { duration: 9000 }
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
    router.push("/(auth)/artist-registration/tattoola-pro");
  };

  const handleBackToWelcome = () => {
    // If redirected from another page, go back to it
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingSpinner message="Accesso in corso..." overlay />
      </SafeAreaView>
    );
  }

  // Full screen dimensions for absolute gradient overlay
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
        // Disable bounce/overscroll on iOS & Android so only content area scrolls
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-transparent"
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ zIndex: 1 }}
      >
        {/* Header with Back Button, Logo, and Help Icon */}
        <View
          className="w-full flex-row justify-between items-center px-6"
          style={{ marginTop: mvs(15), marginBottom: mvs(40) }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBackToWelcome}
            className="rounded-full items-center justify-center"
            style={{
              width: s(36),
              height: s(36),
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <SVGIcons.ChevronLeft
              width={s(16)}
              height={s(16)}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* Logo */}
          <SVGIcons.LogoLight height={s(50)} width={s(90)} />

          {/* Help Icon */}
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => router.push("/(auth)/help")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SVGIcons.HelpQuestion width={s(24)} height={s(24)} />
          </TouchableOpacity>
        </View>

        {/* New Tattooler registration heading */}
        <View className="px-6" style={{ marginBottom: mvs(24) }}>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground text-center font-neueSemibold"
          >
           Non sei ancora iscritto a Tattoola?
          </ScaledText>
        </View>

        {/* New registration button */}
        <View className="px-6" style={{ marginBottom: mvs(32) }}>
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            onPress={handleRegister}
            className="bg-primary rounded-full items-center justify-center w-full flex-row"
            style={{ paddingVertical: mvs(12), gap: s(8) }}
          >
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueSemibold"
            >
              Nuova registrazione
            </ScaledText>
            <SVGIcons.UserFilled width={s(20)} height={s(20)} />
          </TouchableOpacity>
        </View>

        {/* Oppure divider */}
        <View
          className="flex-row items-center px-6"
          style={{ marginBottom: mvs(32) }}
        >
          <View className="flex-1 h-px bg-gray/30" />
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-gray font-montserratLight"
            style={{
              marginHorizontal: s(16),
              fontSize: s(14),
              lineHeight: 23,
              color: "#A49A99",
            }}
          >
           Oppure se sei già iscritto
          </ScaledText>
          <View className="flex-1 h-px bg-gray/30" />
        </View>

        {/* Inputs */}
        <View className="px-6">
          <View style={{ marginBottom: mvs(16) }}>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl ${focusedField === "email" ? "border-2 border-foreground" : "border border-gray"}`}
              className="flex-1 text-foreground rounded-xl"
              style={{ fontSize: s(14) }}
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
            {!!errors.email && (
              <Text className="text-xs text-error mt-1">{errors.email}</Text>
            )}
          </View>

          <View style={{ marginBottom: mvs(8) }}>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl ${focusedField === "password" ? "border-2 border-foreground" : "border border-gray"}`}
              className="flex-1 text-foreground rounded-xl"
              style={{ fontSize: s(14) }}
              placeholder="Password"
              placeholderTextColor="#A49A99"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              rightAccessory={
                <TouchableOpacity
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  className="px-3 py-1 rounded-xl m-1"
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
                variant="body2"
                allowScaling={false}
                className="text-error font-montserratLight"
              >
                {errors.password}
              </ScaledText>
            )}
          </View>

          <TouchableOpacity
            className="self-end"
            style={{ marginBottom: mvs(24) }}
            onPress={handleForgotPassword}
          >
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-neueLight"
            >
             Dimenticato la password?
            </ScaledText>
          </TouchableOpacity>

          {/* Sign in button */}
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary rounded-full items-center w-full"
            style={{ paddingVertical: mvs(12), marginBottom: mvs(20) }}
          >
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueSemibold"
            >
              Accedi
            </ScaledText>
          </TouchableOpacity>
        </View>

        {/* Bottom video with artist text overlay */}
        <View
          className="w-full relative "
          style={{ marginTop: "auto", flex: 1, minHeight: scaledVSize(200) }}
        >
          <Video
            source={require("@/assets/video/artist welcome v1.mp4")}
            style={{ width: "100%", height: "100%" }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
          <LinearGradient
            colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Artist text overlay with glass effect */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleArtistLogin}
            style={[
              StyleSheet.absoluteFillObject,
              { justifyContent: "flex-end", alignItems: "center" },
            ]}
            className="items-center justify-center pb-12 "
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                paddingHorizontal: s(20),
                paddingVertical: mvs(9),
                borderRadius: s(24),
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(20px)",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground text-center font-neueSemibold"
              >
                Se invece sei un artista...
              </ScaledText>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

export default function LoginScreen() {
  return (
    <RequireGuest>
      <LoginScreenContent />
    </RequireGuest>
  );
}