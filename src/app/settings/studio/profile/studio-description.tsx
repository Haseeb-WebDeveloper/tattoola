import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
    fetchStudioDetails,
    updateStudioDescription,
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
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

const MAX_DESCRIPTION_LENGTH = 500;

export default function StudioDescriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [description, setDescription] = useState("");
  const [initialDescription, setInitialDescription] = useState("");
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
        const desc = studio.description || "";
        setDescription(desc);
        setInitialDescription(desc);
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
  const hasUnsavedChanges = description !== initialDescription;

  const remainingChars = MAX_DESCRIPTION_LENGTH - description.length;

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

      const result = await updateStudioDescription(
        user.id,
        description.trim() || undefined
      );

      if (result.success) {
        toast.success("Description updated successfully!");
        setInitialDescription(description);
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        toast.error(result.error || "Failed to update description");
      }
    } catch (error: any) {
      console.error("Error updating description:", error);
      toast.error(error.message || "Failed to update description");
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
                className="text-white font-bold"
              >
                Description
              </ScaledText>
            </View>

            {/* Divider */}
            <View
              className="bg-gray"
              style={{ height: s(1), marginBottom: mvs(32) }}
            />

            {/* Content */}
            <View style={{ paddingHorizontal: s(24) }}>
              {/* Title */}
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-white font-semibold"
                style={{ marginBottom: mvs(8) }}
              >
                Describe your studio
              </ScaledText>

              {/* Subtitle */}
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-gray"
                style={{ marginBottom: mvs(24) }}
              >
                Tell people about your studio, what makes it unique, and what they can expect
              </ScaledText>

              {/* Description Input */}
              <View>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="Write a description for your studio..."
                  placeholderTextColor="#A49A99"
                  value={description}
                  onChangeText={(text) => {
                    if (text.length <= MAX_DESCRIPTION_LENGTH) {
                      setDescription(text);
                    }
                  }}
                  multiline
                  numberOfLines={8}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  style={{ minHeight: mvs(200), textAlignVertical: "top" }}
                  editable={!isFetching}
                />

                {/* Character Count */}
                <View className="flex-row justify-end" style={{ marginTop: mvs(8) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className={
                      description.length > MAX_DESCRIPTION_LENGTH ? "text-error" : "text-gray"
                    }
                  >
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </ScaledText>
                </View>
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
                className="text-foreground font-medium"
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
              You have unsaved changes in the description
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
