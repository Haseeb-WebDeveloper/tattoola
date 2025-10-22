import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function AvatarSettingsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();

  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [initialAvatar] = useState(user?.avatar || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    newAvatar !== null || (avatarRemoved && initialAvatar !== "");

  // Get current display avatar
  const currentAvatar = avatarRemoved
    ? null
    : newAvatar || user?.avatar || null;

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

  const handlePickImage = async () => {
    try {
      const files = await pickFiles({
        mediaType: "image",
        allowsMultipleSelection: false,
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getAvatarUploadOptions(),
      });

      if (!files || files.length === 0) return;

      const file = files[0];

      // Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.fileSize && file.fileSize > maxSize) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      // Upload to Cloudinary
      const uploaded = await uploadToCloudinary(
        [file],
        cloudinaryService.getAvatarUploadOptions()
      );

      if (uploaded && uploaded.length > 0 && uploaded[0].cloudinaryResult) {
        setNewAvatar(uploaded[0].cloudinaryResult.secureUrl);
        setAvatarRemoved(false);
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      toast.error(error.message || "Failed to upload image");
    }
  };

  const handleRemoveImage = () => {
    setNewAvatar(null);
    setAvatarRemoved(true);
  };

  const handleSave = async () => {
    // Don't save if nothing changed
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      // Determine the new avatar URL
      const avatarUrl = avatarRemoved ? null : newAvatar || user?.avatar;

      // Update profile through auth context
      await updateProfile({
        avatar: avatarUrl || undefined,
      });

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Profile photo updated successfully");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating avatar:", err);
      toast.error(err.message || "Failed to update profile photo");
    } finally {
      setIsLoading(false);
    }
  };

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
            Profile photo
          </ScaledText>
        </View>

        {/* Content */}
        <View className="flex-1" style={{ paddingHorizontal: s(16) }}>
          {/* Divider */}
          <View
            className="bg-gray"
            style={{ height: s(1), marginBottom: mvs(32) }}
          />

          {/* Upload Section */}
          <View className="items-center" style={{ marginBottom: mvs(40) }}>
            {/* Title */}
            <View className="flex-row items-center" style={{ marginBottom: mvs(4) }}>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-white font-semibold"
              >
                Upload your studio logo
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-error"
              >
                *
              </ScaledText>
            </View>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(32) }}
            >
              Supporta JPG, PNG, max size 5MB
            </ScaledText>

            {/* Avatar Display */}
            <View style={{ marginBottom: mvs(28), position: "relative" }}>
              <View
                className="rounded-full overflow-hidden border-2 border-gray/30"
                style={{ width: s(180), height: s(180) }}
              >
                {currentAvatar ? (
                  <Image
                    source={{ uri: currentAvatar }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-gray/20 items-center justify-center">
                    <SVGIcons.User width={s(60)} height={s(60)} />
                  </View>
                )}
              </View>

              {/* Edit Button */}
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={uploading || isLoading}
                className="absolute bg-white rounded-full items-center justify-center"
                style={{
                  width: s(25),
                  height: s(25),
                  left: (s(180) - s(25)) / 2, // Center button within avatar width
                  bottom: -s(8),
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <SVGIcons.PenRed width={s(15)} height={s(15)} />
              </TouchableOpacity>
            </View>

            {/* Remove Image Button */}
            {(currentAvatar || (!avatarRemoved && initialAvatar)) && (
              <TouchableOpacity
                onPress={handleRemoveImage}
                disabled={uploading || isLoading}
                className="flex-row items-center"
                style={{ gap: s(8) }}
              >
                <SVGIcons.CloseRed
                  width={s(14)}
                  height={s(14)}
                  style={{ color: "#DC3545" }}
                />
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-error font-semibold"
                >
                  Remove image
                </ScaledText>
              </TouchableOpacity>
            )}
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
            disabled={isLoading || uploading || !hasUnsavedChanges}
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor:
                isLoading || uploading || !hasUnsavedChanges
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
              className="text-foreground font-medium"
            >
              {isLoading || uploading ? "Saving..." : "Save"}
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
              You have unsaved changes in the profile photo
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

