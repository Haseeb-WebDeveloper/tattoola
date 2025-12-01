import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchStudioDetails,
  updateStudioSocial,
} from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

export default function StudioSocialScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    website: "",
    instagram: "",
    tiktok: "",
  });

  const [initialData, setInitialData] = useState({
    website: "",
    instagram: "",
    tiktok: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Fetch current studio data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsFetching(true);
        const studio = await fetchStudioDetails(user.id);

        const data = {
          website: studio.website || "",
          instagram: studio.instagram || "",
          tiktok: (studio as any).tiktok || "",
        };

        setFormData(data);
        setInitialData(data);
      } catch (error: any) {
        console.error("Error fetching studio:", error);
        toast.error(error.message || "Failed to load studio data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify(formData) !== JSON.stringify(initialData);

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
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const result = await updateStudioSocial(
        user.id,
        formData.website.trim() || undefined,
        formData.instagram.trim() || undefined,
        formData.tiktok.trim() || undefined
      );

      if (result.success) {
        toast.success("Social links updated successfully!");
        setInitialData(formData);
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        toast.error(result.error || "Failed to update social links");
      }
    } catch (error: any) {
      console.error("Error updating social links:", error);
      toast.error(error.message || "Failed to update social links");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: mvs(120),
            }}
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
                className="text-white font-neueSemibold"
              >
                Social links
              </ScaledText>
            </View>

            {/* Divider */}
            <View
              className="bg-gray"
              style={{ height: s(1), marginBottom: mvs(32) }}
            />

            {/* Content */}
            <View style={{ paddingHorizontal: s(24), gap: mvs(24) }}>
              {/* Website */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-tat font-montserratSemibold"
                  style={{ marginBottom: mvs(6) }}
                >
                  Inserisci il link al tuo studio website (facoltativo)
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChangeText={(text) => handleInputChange("website", text)}
                  autoCapitalize="none"
                  keyboardType="url"
                  editable={!isFetching}
                />
              </View>

              {/* Instagram */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-tat font-montserratSemibold"
                  style={{ marginBottom: mvs(6) }}
                >
                  Inserisci il link al tuo account Instagram (facoltativo)
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="@username"
                  value={formData.instagram}
                  onChangeText={(text) => handleInputChange("instagram", text)}
                  autoCapitalize="none"
                  editable={!isFetching}
                />
              </View>

              {/* TikTok */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-tat font-montserratSemibold"
                  style={{ marginBottom: mvs(6) }}
                >
                  Inserisci il link al tuo account TikTok (facoltativo)
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="@username"
                  value={formData.tiktok}
                  onChangeText={(text) => handleInputChange("tiktok", text)}
                  autoCapitalize="none"
                  editable={!isFetching}
                />
              </View>
            </View>
          </KeyboardAwareScrollView>

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
                  isLoading || isFetching || !hasUnsavedChanges
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
              You have unsaved changes in social links
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
