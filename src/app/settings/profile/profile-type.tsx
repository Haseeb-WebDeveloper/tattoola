import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

// These should exist as SVGIcons.*
const CircleUncheckedCheckbox = SVGIcons.CircleUncheckedCheckbox;
const CircleCheckedCheckbox = SVGIcons.CircleCheckedCheckbox;

type ProfileType = "public" | "private";

export default function ProfileTypeSettingsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [selectedType, setSelectedType] = useState<ProfileType>(
    user?.isPublic ? "public" : "private"
  );
  const [initialType] = useState<ProfileType>(
    user?.isPublic ? "public" : "private"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges = selectedType !== initialType;

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

  const handleSave = async () => {
    // Don't save if nothing changed
    if (selectedType === initialType) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      const isPublic = selectedType === "public";

      // Update in database
      const { error } = await supabase
        .from("users")
        .update({ isPublic })
        .eq("id", user!.id);

      if (error) throw error;

      // Update auth context
      await updateProfile({ isPublic });

      toast.success(
        `Profile set to ${selectedType === "public" ? "public" : "private"}`
      );

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating profile type:", err);
      toast.error(err.message || "Failed to update profile visibility");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
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
            className="text-white font-neueSemibold"
          >
            Profile visibility
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          style={{
            height: s(0.5),
            backgroundColor: "#A49A99",
            marginHorizontal: s(37.5),
            marginBottom: mvs(32),
          }}
        />

        {/* Content */}
        <ScrollView
          className="flex-1"
          style={{ paddingHorizontal: s(32) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Public Profile Option */}
          <TouchableOpacity
            onPress={() => setSelectedType("public")}
            activeOpacity={0.7}
            className="border-gray"
            style={{
              borderWidth: selectedType === "public" ? s(1) : s(0.5),
              backgroundColor: "#100C0C",
              paddingHorizontal: s(11),
              paddingVertical: mvs(20),
              marginBottom: mvs(16),
              borderRadius: s(12),
            }}
          >
            <View className="flex-row items-start">
              {/* Use checked/unchecked circle */}
              <View
                className="items-center justify-center"
                style={{
                  width: s(17),
                  height: s(17),
                  marginRight: s(9),
                }}
              >
                {selectedType === "public" ? (
                  <CircleCheckedCheckbox width={s(17)} height={s(17)} />
                ) : (
                  <CircleUncheckedCheckbox width={s(17)} height={s(17)} />
                )}
              </View>

              {/* Text Content */}
              <View className="flex-1">
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                  style={{ marginBottom: mvs(4) }}
                >
                  Public profile
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-foreground font-neueRoman"
                >
                  Your tattoos, the artists you follow will be visible on your
                  page
                </ScaledText>
              </View>
            </View>
          </TouchableOpacity>

          {/* Private Profile Option */}
          <TouchableOpacity
            onPress={() => setSelectedType("private")}
            activeOpacity={0.7}
            className="border-gray"
            style={{
              borderWidth: selectedType === "private" ? s(1) : s(0.5),
              backgroundColor: "#100C0C",
              paddingHorizontal: s(11),
              paddingVertical: mvs(20),
              marginBottom: mvs(24),
              borderRadius: s(12),
            }}
          >
            <View className="flex-row items-start">
              {/* Use checked/unchecked circle */}
              <View
                className="items-center justify-center"
                style={{
                  width: s(17),
                  height: s(17),
                  marginRight: s(9),
                }}
              >
                {selectedType === "private" ? (
                  <CircleCheckedCheckbox width={s(17)} height={s(17)} />
                ) : (
                  <CircleUncheckedCheckbox width={s(17)} height={s(17)} />
                )}
              </View>

              {/* Text Content */}
              <View className="flex-1">
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                  style={{ marginBottom: mvs(4) }}
                >
                  Private profile
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-foreground font-neueRoman"
                >
                  Your tattoos and the artists you follow are visible only to
                  you
                </ScaledText>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Save Button */}
        <View
          style={{
            paddingHorizontal: s(22),
            paddingBottom: mvs(32),
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor:
                isLoading || !hasUnsavedChanges ? "#6B2C2C" : "#AD2E2E",
              paddingVertical: mvs(10.5),
              opacity: isLoading || !hasUnsavedChanges ? 0.5 : 1,
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
              You have unsaved changes in profile visibility
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
    </View>
  );
}
