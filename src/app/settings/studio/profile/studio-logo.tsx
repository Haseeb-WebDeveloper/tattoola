import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import {
    fetchStudioDetails,
    updateStudioLogo,
} from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function StudioLogoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { pickFiles, uploadToCloudinary } = useFileUpload();

  const [newLogo, setNewLogo] = useState<string | null>(null);
  const [initialLogo, setInitialLogo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current studio data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsFetching(true);
        const studio = await fetchStudioDetails(user.id);
        setInitialLogo(studio.logo || "");
      } catch (error: any) {
        console.error("Error fetching studio:", error);
        toast.error(error.message || "Failed to load studio data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = newLogo !== null;

  // Get current display logo
  const currentLogo = newLogo || initialLogo || null;

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

  const handlePickLogo = async () => {
    try {
      setIsUploading(true);

      const files = await pickFiles({
        mediaType: "image",
        allowsMultipleSelection: false,
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
      });

      if (!files || files.length === 0) {
        setIsUploading(false);
        return;
      }

      const file = files[0];

      // Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.fileSize && file.fileSize > maxSize) {
        toast.error("Image size must be less than 5MB");
        setIsUploading(false);
        return;
      }

      // Show local image immediately
      setNewLogo(file.uri);

      // Upload to Cloudinary
      const uploaded = await uploadToCloudinary(
        [file],
        cloudinaryService.getPortfolioUploadOptions("image")
      );

      if (uploaded && uploaded.length > 0 && uploaded[0].cloudinaryResult) {
        setNewLogo(uploaded[0].cloudinaryResult.secureUrl);
      }
    } catch (error: any) {
      console.error("Error picking logo:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges || !user?.id || !newLogo) return;

    try {
      setIsLoading(true);

      const result = await updateStudioLogo(user.id, newLogo);

      if (result.success) {
        toast.success("Studio logo updated successfully!");
        setInitialLogo(newLogo);
        setNewLogo(null);
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        toast.error(result.error || "Failed to update logo");
      }
    } catch (error: any) {
      console.error("Error updating logo:", error);
      toast.error(error.message || "Failed to update logo");
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: mvs(32) }}
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
                disabled={isFetching}
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
                Logo
              </ScaledText>
            </View>

            {/* Divider */}
            <View
              className="bg-gray"
              style={{ height: s(1), marginBottom: mvs(32) }}
            />

            {/* Content */}
            <View style={{ paddingHorizontal: s(16) }} className="items-center">
              {/* Title */}
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-white font-semibold"
                style={{ marginBottom: mvs(8) }}
              >
                Upload your studio logo
              </ScaledText>

              {/* Subtitle */}
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-gray"
                style={{ marginBottom: mvs(24) }}
              >
                Supporta JPG, PNG, max size 5MB
              </ScaledText>

              {/* Logo Upload Area */}
              <View
                className="items-center justify-center"
                style={{ marginBottom: mvs(32) }}
              >
                {currentLogo && !isFetching ? (
                  <View style={{ position: "relative", alignItems: "center" }}>
                    <Image
                      source={{ uri: currentLogo }}
                      style={{
                        width: s(200),
                        height: s(200),
                        borderRadius: s(100),
                      }}
                      resizeMode="cover"
                    />
                    {isUploading && (
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          borderRadius: s(100),
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ActivityIndicator size="large" color="#E80D0D" />
                      </View>
                    )}
                    {/* Edit button below image */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: mvs(-12),
                        left: 0,
                        right: 0,
                        alignItems: "center",
                      }}
                    >
                      <TouchableOpacity
                        onPress={handlePickLogo}
                        disabled={isUploading || isFetching}
                        className="bg-foreground rounded-full items-center justify-center"
                        style={{
                          padding: s(6),
                        }}
                      >
                        <SVGIcons.EditRed width={s(16)} height={s(16)} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePickLogo}
                    disabled={isUploading || isFetching}
                    className="border-2 border-dashed items-center justify-center"
                    style={{
                      width: s(200),
                      height: s(200),
                      borderRadius: s(100),
                      borderColor: "#E80D0D33",
                      backgroundColor: "#E80D0D0D",
                      opacity: isFetching ? 0.5 : 1,
                    }}
                  >
                    {isUploading || isFetching ? (
                      <ActivityIndicator size="large" color="#E80D0D" />
                    ) : (
                      <SVGIcons.Studio width={s(48)} height={s(48)} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
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
              disabled={isLoading || isFetching || !hasUnsavedChanges}
              className="rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  isLoading || isFetching || !hasUnsavedChanges ? "#6B2C2C" : "#AD2E2E",
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
        </KeyboardAvoidingView>
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
              You have unsaved changes in the logo
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
