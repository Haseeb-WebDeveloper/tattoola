import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { clearProfileCache } from "@/utils/database";
import { mvs, s, scaledFont } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function SocialMediaSettingsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  // Extract username without @ if present
  const getUsername = (value: string | null | undefined) => {
    if (!value) return "";
    return value.startsWith("@") ? value.slice(1) : value;
  };

  const [tiktok, setTiktok] = useState(getUsername(user?.tiktok));
  const [instagram, setInstagram] = useState(getUsername(user?.instagram));
  const [initialTiktok] = useState(getUsername(user?.tiktok));
  const [initialInstagram] = useState(getUsername(user?.instagram));
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    tiktok.trim() !== initialTiktok || instagram.trim() !== initialInstagram;

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

  const handleTiktokChange = (text: string) => {
    // Remove @ if user tries to add it
    const cleanText = text.startsWith("@") ? text.slice(1) : text;
    setTiktok(cleanText);
  };

  const handleInstagramChange = (text: string) => {
    // Remove @ if user tries to add it
    const cleanText = text.startsWith("@") ? text.slice(1) : text;
    setInstagram(cleanText);
  };

  const handleSave = async () => {
    // Don't save if nothing changed
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the update data with @ prefix if not empty
      const updateData: any = {};
      
      if (tiktok.trim() !== initialTiktok) {
        updateData.tiktok = tiktok.trim() ? `@${tiktok.trim()}` : null;
      }
      
      if (instagram.trim() !== initialInstagram) {
        updateData.instagram = instagram.trim() ? `@${instagram.trim()}` : null;
      }

      // Update profile through auth context
      await updateProfile(updateData);

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Social media aggiornati con successo");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating social media:", err);
      toast.error(
        err.message || "Impossibile aggiornare i social media"
      );
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
              Social media
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
        >
          {/* TikTok */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Inserisci lo username del tuo account TikTok (facoltativo)
            </ScaledText>
            <View className="relative">
              {/* @ Symbol - Fixed */}
              <View
                className="absolute z-10 items-center justify-center"
                style={{
                  left: s(16),
                  top: 0,
                  bottom: 0,
                }}
                pointerEvents="none"
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratSemibold"
                >
                  @
                </ScaledText>
              </View>

              <ScaledTextInput
                value={tiktok}
                onChangeText={handleTiktokChange}
                placeholder="tattooking_85"
                  
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                className="text-foreground font-neueMedium"
                containerClassName="rounded-lg"
                containerStyle={{
                  borderWidth: s(1),
                  borderColor: "#A49A99",
                  backgroundColor: "#100C0C",
                }}
                style={{
                  fontSize: scaledFont(14),
                  fontFamily: "Montserrat-Medium",
                  paddingLeft: s(32), // Make room for @ symbol
                }}
              />
            </View>
          </View>

          {/* Instagram */}
          <View style={{ marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Inserisci lo username del tuo account Instagram (facoltativo)
            </ScaledText>
            <View className="relative">
              {/* @ Symbol - Fixed */}
              <View
                className="absolute z-10 items-center justify-center"
                style={{
                  left: s(16),
                  top: 0,
                  bottom: 0,
                }}
                pointerEvents="none"
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratSemibold"
                >
                  @
                </ScaledText>
              </View>

              <ScaledTextInput
                value={instagram}
                onChangeText={handleInstagramChange}
                placeholder="tattooking_85"
                  
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                className="text-foreground font-neueMedium"
                containerClassName="rounded-lg"
                containerStyle={{
                  borderWidth: s(1),
                  borderColor: "#A49A99",
                  backgroundColor: "#100C0C",
                }}
                style={{
                  fontSize: scaledFont(14),
                  fontFamily: "Montserrat-Medium",
                  paddingLeft: s(32), // Make room for @ symbol
                }}
              />
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
              Hai modifiche non salvate nei social media
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

