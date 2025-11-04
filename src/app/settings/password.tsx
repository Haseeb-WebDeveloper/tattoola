import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { clearProfileCache } from "@/utils/database";
import { mvs, s, scaledFont } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { ValidationRules, ValidationUtils } from "@/utils/validation";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function PasswordSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    currentPassword.trim() !== "" ||
    newPassword.trim() !== "" ||
    confirmPassword.trim() !== "";

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    router.back();
  };

  const handleContinueEditing = () => {
    setShowUnsavedModal(false);
  };

  const clearErrors = () => {
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
  };

  const handleCurrentPasswordChange = (text: string) => {
    setCurrentPassword(text);
    if (currentPasswordError) {
      setCurrentPasswordError("");
    }
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (newPasswordError) {
      setNewPasswordError("");
    }
    // Also clear confirm password error if they were not matching
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  const validatePasswords = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate current password
    if (!currentPassword.trim()) {
      setCurrentPasswordError("Current password is required");
      isValid = false;
    }

    // Validate new password
    const newPasswordValidation = ValidationUtils.validateField(
      newPassword,
      ValidationRules.password
    );
    if (newPasswordValidation) {
      setNewPasswordError(newPasswordValidation);
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Both passwords don't match");
      isValid = false;
    }

    return isValid;
  };

  const verifyCurrentPassword = async (): Promise<boolean> => {
    try {
      // Try to sign in with current credentials to verify password
      const { error } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      });

      if (error) {
        setCurrentPasswordError("The password is incorrect");
        return false;
      }

      return true;
    } catch (err) {
      setCurrentPasswordError("The password is incorrect");
      return false;
    }
  };

  const handleSave = async () => {
    // Validate all fields
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);

    try {
      // First verify current password
      const isCurrentPasswordValid = await verifyCurrentPassword();
      if (!isCurrentPasswordValid) {
        setIsLoading(false);
        return;
      }


      // Update password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (data) {
        
        // Clear profile cache (though password doesn't affect profile data)
        // This ensures any auth-related caching is fresh
        await clearProfileCache(user!.id);
        
        toast.success("Password updated successfully");
      } else {
        toast.error(error.message || "Failed to update password");
      }

      // Navigate back
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating password:", err);
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    currentPassword.trim() !== "" &&
    newPassword.trim() !== "" &&
    confirmPassword.trim() !== "";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-center relative"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            marginBottom: mvs(24),
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="absolute rounded-full bg-foreground/20 items-center justify-center"
            style={{
              width: s(34),
              height: s(34),
              left: s(16),
              padding: s(8),
            }}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-bold"
          >
            Modifica password
          </ScaledText>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          style={{ paddingHorizontal: s(16) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Password */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Enter your current password
            </ScaledText>
            <View>
              <ScaledTextInput
                value={currentPassword}
                onChangeText={handleCurrentPasswordChange}
                placeholder="Current password"
                placeholderTextColor="#666"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                className="text-foreground font-neueMedium"
                containerClassName="rounded-lg"
                containerStyle={{
                  borderWidth: s(1),
                  borderColor: currentPasswordError ? "#DC3545" : "#A49A99",
                  backgroundColor: "#100C0C",
                }}
                rightAccessory={
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: "absolute",
                      right: s(16),
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                    }}
                  >
                    {showCurrentPassword ? (
                      <SVGIcons.EyeOpen width={s(20)} height={s(20)} />
                    ) : (
                      <SVGIcons.EyeClose width={s(20)} height={s(20)} />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>
            {currentPasswordError ? (
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-error"
                style={{ marginTop: mvs(8) }}
              >
                {currentPasswordError}
              </ScaledText>
            ) : null}
          </View>

          {/* New Password */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Enter your new password
            </ScaledText>
            <View>
              <ScaledTextInput
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                placeholder="New password"
                placeholderTextColor="#666"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                className="text-foreground font-neueMedium"
                containerClassName="rounded-lg"
                containerStyle={{
                  borderWidth: s(1),
                  borderColor:
                    newPasswordError || confirmPasswordError
                      ? "#DC3545"
                      : "#A49A99",
                  backgroundColor: "#100C0C",
                }}
                style={{
                  fontSize: s(12),
                  paddingRight: s(48),
                }}
                rightAccessory={
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: s(16),
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                    }}
                  >
                    {showNewPassword ? (
                      <SVGIcons.EyeOpen width={s(20)} height={s(20)} />
                    ) : (
                      <SVGIcons.EyeClose width={s(20)} height={s(20)} />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>
            {newPasswordError ? (
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-error"
                style={{ marginTop: mvs(8) }}
              >
                {newPasswordError}
              </ScaledText>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Confirm Password
            </ScaledText>
            <View>
              <ScaledTextInput
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder="Confirm password"
                placeholderTextColor="#666"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                className="text-foreground font-neueMedium"
                containerClassName="rounded-lg"
                containerStyle={{
                  borderWidth: s(1),
                  borderColor: confirmPasswordError ? "#DC3545" : "#A49A99",
                  backgroundColor: "#100C0C",
                }}
                style={{
                  fontSize: s(12),
                  paddingRight: s(48),
                }}
                rightAccessory={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: s(16),
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                    }}
                  >
                    {showConfirmPassword ? (
                      <SVGIcons.EyeOpen width={s(20)} height={s(20)} />
                    ) : (
                      <SVGIcons.EyeClose width={s(20)} height={s(20)} />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>
            {confirmPasswordError ? (
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-error"
                style={{ marginTop: mvs(8) }}
              >
                {confirmPasswordError}
              </ScaledText>
            ) : null}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !isFormValid}
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor:
                isLoading || !isFormValid ? "#6B2C2C" : "#AD2E2E",
              paddingVertical: mvs(10.5),
              paddingLeft: s(18),
              paddingRight: s(20),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueMedium"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </ScaledText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Unsaved Changes Modal */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={handleContinueEditing}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(32),
            }}
          >
            {/* Warning Icon */}
            <View className="items-center" style={{ marginBottom: mvs(20) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              You have unsaved changes in the password
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Do you want to discard them?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ gap: mvs(4) }} className="flex-row justify-center">
              {/* Continue Editing Button */}
              <TouchableOpacity
                onPress={handleContinueEditing}
                className="rounded-full border-2 items-center justify-center flex-row"
                style={{
                  borderColor: "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  gap: s(8),
                }}
              >
                <SVGIcons.PenRed
                  style={{ width: s(14), height: s(14) }}
                  fill="#AD2E2E"
                />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-montserratMedium"
                  style={{ color: "#AD2E2E" }}
                >
                  Continue Editing
                </ScaledText>
              </TouchableOpacity>

              {/* Discard Changes Button */}
              <TouchableOpacity
                onPress={handleDiscardChanges}
                className="rounded-full items-center justify-center"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratMedium"
                >
                  Discard changes
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
