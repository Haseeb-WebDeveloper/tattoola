import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step6Schema } from "@/utils/artistRegistrationValidation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

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
      <ScrollView className="flex-1" >
        {/* Progress */}
        <View className="items-center  mb-4 mt-8">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
              <View
                key={idx}
                className={`${idx < 6 ? (idx === 5 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mb-4 flex-row gap-2 items-center justify-center">
          <SVGIcons.Certificate width={22} height={22} />
          <Text className="text-foreground section-title font-neueBold">
            Allega le tue certificazioni
          </Text>
        </View>

        {/* Description */}
        <View className="px-6 mb-6">
          <Text className="tat-body-2-light text-center text-foreground">
            Carica un certificato o attestato che dimostri la tua autorizzazione a
            esercitare come tatuatore in Italia, insieme a un documento
            d’identità. Questo ci aiuta a verificare la tua identità e a mantenere
            la community sicura.
          </Text>
        </View>

        {/* Upload area */}
        <View className="px-6">
          <View className="rounded-2xl items-center py-10 px-6 bg-primary/20 border-2 border-dashed border-error/70">
            <SVGIcons.Upload className="w-16 h-16" />
            <TouchableOpacity
              onPress={handlePickCertificate}
              disabled={uploading}
              className="bg-primary rounded-full py-2 px-4 mt-4"
            >
              <Text className="text-foreground tat-body-1 font-neueBold">
                {uploading ? "Uploading..." : "Upload files"}
              </Text>
            </TouchableOpacity>
            <Text className="text-foreground/80 mt-6 text-center">
              Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}
              Fino a 2 video, supporta MOV, MP4, AVI. Max size 10MB
            </Text>
          </View>
        </View>

        {/* Preview (first file) */}
        {localPreview && (
          <View className="px-6 mt-6 pb-32">
            <Image
              source={{ uri: localPreview }}
              className="w-full rounded-lg h-fit aspect-square"
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View className="flex-row justify-between px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          disabled={!canProceed}
          className={`rounded-full px-8 py-4 ${canProceed ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
