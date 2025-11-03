import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step6Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import NextBackFooter from "@/components/ui/NextBackFooter";

export default function ArtistStep6V2() {
  const {
    step4,
    updateStep4,
    setCurrentStepDisplay,
    totalStepsDisplay,
    currentStepDisplay,
  } = useArtistRegistrationV2Store();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const [localPreview, setLocalPreview] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (step4?.certificateUrl) {
      setLocalPreview(step4.certificateUrl);
    }
    setCurrentStepDisplay(6);
  }, []);

  const handlePickCertificate = async () => {
    const files = await pickFiles({
      mediaType: "all",
      allowsMultipleSelection: true,
      maxFiles: 5,
      quality: 0.9,
      cloudinaryOptions: cloudinaryService.getCertificateUploadOptions(),
    });
    if (files.length === 0) return;

    // Show first local preview immediately (for images only)
    setLocalPreview(files[0].uri);

    // Upload in background
    const uploaded = await uploadToCloudinary(
      files,
      cloudinaryService.getCertificateUploadOptions()
    );
    // Prefer secureUrl if available, fallback to publicId URL
    const first = uploaded[0];
    if (first?.cloudinaryResult?.publicId) {
      const url =
        first.cloudinaryResult.secureUrl ||
        `${first.cloudinaryResult.publicId}`;
      updateStep4({ certificateUrl: url });
      setLocalPreview(url);
    }
  };

  const canProceed = isValid(step6Schema, {
    certificateUrl: step4?.certificateUrl || "",
  });

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-7");
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <AuthStepHeader />
      <ScrollView className="flex-1">
        {/* Progress */}
        <RegistrationProgress
          currentStep={6}
          totalSteps={totalStepsDisplay}
          name="Allega le tue certificazioni"
          nameVariant="2xl"
          icon={<SVGIcons.Certificate width={22} height={22} />}
          description="Carica un certificato o attestato che dimostri la tua autorizzazione a esercitare come tatuatore in Italia, insieme a un documento d’identità. Questo ci aiuta a verificare la tua identità e a mantenere la community sicura."
          descriptionVariant="md"
        />

        {/* Upload area */}
        <View style={{ paddingHorizontal: s(24) }}>
          <View
            className="rounded-2xl items-center bg-primary/20 border-dashed border-error/70"
            style={{
              paddingVertical: mvs(24),
              paddingHorizontal: s(16),
              borderWidth: s(1),
            }}
          >
            <SVGIcons.Upload width={s(42)} height={s(42)} />
            <TouchableOpacity
              onPress={handlePickCertificate}
              disabled={uploading}
              className="bg-primary text-background rounded-full"
              style={{
                paddingVertical: mvs(8),
                paddingHorizontal: s(20),
                borderRadius: s(70),
                marginTop: mvs(12),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueSemibold"
              >
                {uploading ? "Uploading..." : "Upload Certificate"}
              </ScaledText>
            </TouchableOpacity>
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-gray text-center font-neueSemibold"
              style={{ marginTop: mvs(12) }}
            >
              Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}Fino a 2
              video, supporta MOV, MP4, AVI. Max size 10MB
            </ScaledText>
          </View>
        </View>

        {/* Preview (first file) */}
        {localPreview && (
          <View
            style={{
              paddingHorizontal: s(24),
              marginTop: mvs(12),
              paddingBottom: mvs(64),
            }}
          >
            <Image
              source={{ uri: localPreview }}
              className="w-full rounded-lg h-fit aspect-square"
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <NextBackFooter
        onNext={onNext}
        nextDisabled={!canProceed}
        backLabel="Back"
        onBack={() => router.back()}
      />
    </View>
  );
}
