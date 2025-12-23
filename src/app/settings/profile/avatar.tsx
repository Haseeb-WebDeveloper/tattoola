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
        toast.error("L'immagine deve essere inferiore a 5MB");
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
      toast.error(error.message || "Caricamento dell'immagine non riuscito");
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

      toast.success("Foto profilo aggiornata con successo");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating avatar:", err);
      toast.error(err.message || "Impossibile aggiornare la foto profilo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          className="relative flex-row items-center justify-center"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            marginBottom: mvs(24),
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="absolute items-center justify-center rounded-full bg-foreground/20"
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
            Foto profilo
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
            <View
              className="flex-row items-center"
              style={{ marginBottom: mvs(4) }}
            >
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-white font-neueSemibold"
              >
                Carica la tua foto
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
            <View style={{ marginBottom: mvs(40), position: "relative" }}>
              <View
                className="overflow-hidden border-2 rounded-full border-gray/30"
                style={{ width: s(180), height: s(180) }}
              >
                {currentAvatar ? (
                  <Image
                    source={{ uri: currentAvatar }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center justify-center w-full h-full bg-gray/20">
                    <SVGIcons.User width={s(60)} height={s(60)} />
                  </View>
                )}
              </View>

              {/* Edit Button */}
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={uploading || isLoading}
                className="absolute items-center justify-center bg-white rounded-full"
                style={{
                  width: s(25),
                  height: s(25),
                  left: (s(180) - s(25)) / 2, // Center button within avatar width
                  bottom: -s(11),
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
                  className="text-error font-neueSemibold"
                >
                  Rimuovi immagine
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
            className="items-center justify-center rounded-full"
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
              className="text-foreground font-neueMedium"
            >
              {isLoading || uploading ? "Salvataggio..." : "Salva"}
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
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", paddingHorizontal: s(16) }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: "100%",
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
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(4) }}
            >
              Hai modifiche non salvate nella foto profilo
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center text-background font-montserratMedium"
              style={{ marginBottom: mvs(32) }}
            >
              Vuoi scartarle?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ gap: mvs(12) }} className="flex-col justify-center">
              {/* Continue Editing Button */}
              <TouchableOpacity
                onPress={handleContinueEditing}
                className="flex-row items-center justify-center border-2 rounded-full"
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
                  Continua a modificare
                </ScaledText>
              </TouchableOpacity>

              {/* Discard Changes Button */}
              <TouchableOpacity
                onPress={handleDiscardChanges}
                className="items-center justify-center rounded-full"
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
                  Scarta le modifiche
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
