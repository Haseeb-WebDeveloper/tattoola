import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ArtistStep6V2() {
  const { step4, updateStep4, setCurrentStepDisplay, totalStepsDisplay, currentStepDisplay } = useArtistRegistrationV2Store();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const [localPreview, setLocalPreview] = useState<string | undefined>(undefined);

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
    const uploaded = await uploadToCloudinary(files, cloudinaryService.getCertificateUploadOptions());
    // Prefer secureUrl if available, fallback to publicId URL
    const first = uploaded[0];
    if (first?.cloudinaryResult?.publicId) {
      const url = first.cloudinaryResult.secureUrl || `${first.cloudinaryResult.publicId}`;
      updateStep4({ certificateUrl: url });
      setLocalPreview(url);
    }
  };

  const onNext = () => {
    router.push("/(auth)/artist-registration/step-7");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 10}
      className="flex-1 bg-black"
    >
      <ScrollView className="flex-1 relative" contentContainerClassName="flex-grow">
        {/* Header */}
        <View className="px-4 my-8">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/welcome")}
              className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
            >
              <Image
                source={require("@/assets/images/icons/close.png")}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Image
              source={require("@/assets/logo/logo-light.png")}
              className="h-10"
              resizeMode="contain"
            />
            <View className="w-10" />
          </View>
          <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
        </View>
        {/* Progress */}
        <View className="items-center mb-8">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
              <View
                key={idx}
                className={`${idx < 6 ? (idx === 5 ? "bg-foreground w-3 h-3" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mb-4 flex-row gap-2 items-center">
          <Image
            source={require("@/assets/images/icons/certificate.png")}
            className="w-6 h-6"
            resizeMode="contain"
          />
          <Text className="text-foreground section-title font-neueBold">
            Allega le tue certificazioni
          </Text>
        </View>

        {/* Description */}
        <View className="px-6 mb-6">
          <Text className="text-foreground tat-body-2-light">
            Carica un certificato o attestato che dimostri la tua autorizzazione a esercitare come tatuatore in Italia, insieme a un documento d’identità. Questo ci aiuta a verificare la tua identità e a mantenere la community sicura.
          </Text>
        </View>

        {/* Upload area */}
        <View className="px-6">
          <View className="border-2 border-dashed border-error/70 rounded-2xl bg-black/40 items-center py-10">
            <Image
              source={require("@/assets/images/icons/certificate.png")}
              className="w-16 h-16 mb-4"
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={handlePickCertificate}
              disabled={uploading}
              className="bg-primary rounded-full py-3 px-6"
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
          <View className="px-6 mt-6">
            <Image source={{ uri: localPreview }} className="w-full h-40 rounded-lg" resizeMode="cover" />
          </View>
        )}

        {/* Footer */}
        <View className="flex-row justify-between px-6 mt-10 mb-10 absolute top-[80vh] left-0 right-0">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full border border-foreground px-6 py-4"
          >
            <Text className="text-foreground">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            className="rounded-full px-8 py-4 bg-primary"
          >
            <Text className="text-foreground">Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


