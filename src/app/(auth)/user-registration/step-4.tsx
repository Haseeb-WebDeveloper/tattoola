import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useUserRegistrationV2Store } from "@/stores/userRegistrationV2Store";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { toast } from "sonner-native";

export default function UserRegistrationStep4() {
  const { step4, updateStep4, setCurrentStepDisplay } =
    useUserRegistrationV2Store();
  const { pickFiles, uploadToCloudinary } = useFileUpload();

  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [initialAvatar, setInitialAvatar] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step4?.avatar) {
      setInitialAvatar(step4.avatar);
    }
  }, [step4]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = newAvatar !== null;

  // Get current display avatar
  const currentAvatar = newAvatar || initialAvatar || null;

  const handleBack = () => {
    router.back();
  };

  const handlePickAvatar = async () => {
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
        toast.error("La dimensione dell'immagine deve essere inferiore a 5MB");
        setIsUploading(false);
        return;
      }

      // Show local image immediately
      setNewAvatar(file.uri);

      // Upload to Cloudinary
      const uploaded = await uploadToCloudinary(
        [file],
        cloudinaryService.getPortfolioUploadOptions("image")
      );

      if (uploaded && uploaded.length > 0 && uploaded[0].cloudinaryResult) {
        setNewAvatar(uploaded[0].cloudinaryResult.secureUrl);
      }
    } catch (error: any) {
      console.error("Error picking avatar:", error);
      toast.error(error.message || "Caricamento immagine fallito");
      setNewAvatar(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    // Save avatar if changed
    if (hasUnsavedChanges && newAvatar) {
      updateStep4({ avatar: newAvatar });
    }

    setCurrentStepDisplay(4);
    router.push("/(auth)/user-registration/step-5");
  };

  const handleSkip = () => {
    // Allow skipping avatar upload
    setCurrentStepDisplay(4);
    router.push("/(auth)/user-registration/step-5");
  };

  return (
    <View className="flex-1 bg-black">
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AuthStepHeader />

        {/* Progress */}
        <RegistrationProgress
          currentStep={4}
          totalSteps={7}
          name="La tua foto"
          nameVariant="2xl"
          icon={<SVGIcons.Smile width={20} height={20} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24) }}>
          {/* Avatar Upload Area */}
          <View
            className="items-center justify-center"
            style={{ marginBottom: mvs(24) }}
          >
            {currentAvatar ? (
              <View style={{ position: "relative", alignItems: "center" }}>
                <Image
                  source={{ uri: currentAvatar }}
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
                    onPress={handlePickAvatar}
                    disabled={isUploading}
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
                onPress={handlePickAvatar}
                disabled={isUploading}
                className="border-2 border-dashed items-center justify-center  bg-tat-darkMaroon border-primary"
                style={{
                  width: s(200),
                  height: s(200),
                  borderRadius: s(100),
                  opacity: isUploading ? 0.5 : 1,
                }}
              >
                {isUploading ? (
                  <ActivityIndicator size="large" color="#E80D0D" />
                ) : (
                  <SVGIcons.User width={s(48)} height={s(48)} />
                )}
                <View
                  className="items-center justify-center"
                  style={{
                    paddingVertical: mvs(8),
                    paddingHorizontal: s(20),
                    borderRadius: s(70),
                    backgroundColor: "#E80D0D",
                    marginTop: mvs(16),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                  >
                    Carica Foto
                  </ScaledText>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center justify-center">
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratSemibold"
            >
              Supporta JPG, PNG, max size 5MB
            </ScaledText>
          </View>

          {/* Skip Option */}
          {/* {!currentAvatar && (
            <TouchableOpacity
              onPress={handleSkip}
              disabled={isUploading}
              style={{ alignItems: "center", marginTop: mvs(16) }}
            >
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-gray"
              >
                Skip for now
              </ScaledText>
            </TouchableOpacity>
          )} */}
        </View>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <NextBackFooter
        onNext={handleNext}
        nextLabel="Avanti"
        backLabel="Indietro"
        onBack={handleBack}
        nextDisabled={isUploading}
      />
    </View>
  );
}
