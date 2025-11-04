import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { clearProfileCache } from "@/utils/database";
import { mvs, s, scaledFont } from "@/utils/scale";
import { ValidationRules, ValidationUtils } from "@/utils/validation";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    TouchableOpacity,
    View
} from "react-native";
import { toast } from "sonner-native";

export default function UsernameSettingsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [initialUsername] = useState(user?.username || "");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges = username.trim() !== initialUsername;

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

  const validateUsername = (value: string): string => {
    const validationError = ValidationUtils.validateField(
      value,
      ValidationRules.username
    );
    return validationError || "";
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSave = async () => {
    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Don't save if nothing changed
    if (username.trim() === initialUsername) {
      router.back();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Update profile through auth context (handles optimistic updates internally)
      await updateProfile({
        username: username.trim(),
      });

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Username updated successfully");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating username:", err);
      toast.error(err.message || "Failed to update username");

      // Show error message
      if (
        err.message?.includes("duplicate") ||
        err.message?.includes("unique")
      ) {
        toast.error("This username is already taken");
      } else {
        toast.error(err.message || "Failed to update username");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Android back button
  useEffect(() => {
    const handleBackPress = () => {
      if (hasUnsavedChanges) {
        setShowUnsavedModal(true);
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    // This would need to be implemented with BackHandler on Android
    // For now, it's handled by the back button in the header
  }, [hasUnsavedChanges]);

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
            Modifica username
          </ScaledText>
        </View>

        {/* Content */}
        <View className="flex-1" style={{ paddingHorizontal: s(16) }}>
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Username (inserisci un nome univoco)
            </ScaledText>
            <ScaledTextInput
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              className="text-foreground font-neueMedium"
              containerClassName="rounded-lg"
              containerStyle={{
                borderWidth: s(1),
                borderColor: error ? "#DC3545" : "#A49A99",
                backgroundColor: "#100C0C",
              }}
            />
            {error ? (
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-error"
                style={{ marginTop: mvs(8) }}
              >
                {error}
              </ScaledText>
            ) : null}
          </View>
        </View>

        {/* Save Button */}
        <View
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !username.trim()}
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor:
                isLoading ||
                !username.trim() ||
                error ||
                username.trim() === initialUsername
                  ? "#6B2C2C"
                  : "#AD2E2E",
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
              {isLoading ? "Saving..." : "Save"}
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
              You have unsaved changes in the username
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
