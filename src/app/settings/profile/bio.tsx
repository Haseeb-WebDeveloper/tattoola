import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function BioSettingsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [initialBio] = useState(user?.bio || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges = bio.trim() !== initialBio.trim();

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

  const handleBioChange = (text: string) => {
    setBio(text);
  };

  const handleSave = async () => {
    // Don't save if nothing changed
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      // Update profile through auth context
      await updateProfile({
        bio: bio.trim() || null,
      });

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Bio aggiornata con successo");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating bio:", err);
      toast.error(err.message || "Impossibile aggiornare la bio");
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
            Bio
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          className="bg-gray"
          style={{ height: s(1), marginBottom: mvs(32), marginHorizontal: s(16) }}
        />

        {/* Content */}
        <ScrollView
          style={{ flex: 1, paddingHorizontal: s(16) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratSemibold"
              style={{ marginBottom: mvs(12) }}
            >
              Racconta qualcosa di te
            </ScaledText>
            <TextInput
              value={bio}
              onChangeText={handleBioChange}
              placeholder="Tattoo artist appassionato di fine line e blackwork. Più di 8 anni di esperienza nella creazione di design personalizzati"
              multiline
              textAlignVertical="top"
              editable={!isLoading}
              maxLength={500}
              style={{
                color: "#FFFFFF",
                fontSize: s(12),
                borderWidth: s(1),
                borderColor: "#A49A99",
                borderRadius: s(8),
                paddingHorizontal: s(16),
                paddingVertical: mvs(16),
                minHeight: mvs(280),
              }}
            />
            {/* Character count */}
            <View className="flex-row justify-end" style={{ marginTop: mvs(8) }}>
              <ScaledText
                allowScaling={false}
                variant="xs"
                className="text-gray font-montserratMedium"
              >
                {bio.length}/500
              </ScaledText>
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
            disabled={isLoading || !hasUnsavedChanges}
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor:
                isLoading || !hasUnsavedChanges ? "#6B2C2C" : "#AD2E2E",
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
              {isLoading ? "Salvataggio..." : "Salva"}
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
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              Hai modifiche non salvate nella bio
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Vuoi scartarle?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ gap: mvs(12) }} className="flex-col justify-center">
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
                  Continua a modificare
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

