import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function ArtistStep3V2() {
  const {
    step3,
    updateStep3,
    setAvatar,
    currentStepDisplay,
    totalStepsDisplay,
  } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<"firstName" | "lastName" | null>(null);
  const { pickFiles, uploadToCloudinary } = useFileUpload();

  const handlePickAvatar = async () => {
    const files = await pickFiles({
      mediaType: "image",
      allowsMultipleSelection: false,
      quality: 0.8,
      maxFiles: 1,
      cloudinaryOptions: cloudinaryService.getAvatarUploadOptions(),
    });
    if (files.length > 0) {
      // 1) Show local URI instantly for fast feedback
      const localUri = files[0].uri;
      setAvatar(localUri);

      // 2) Upload in background and then replace with Cloudinary URL
      (async () => {
        const uploadedFiles = await uploadToCloudinary(
          files,
          cloudinaryService.getAvatarUploadOptions()
        );
        const first = uploadedFiles[0];
        if (first?.cloudinaryResult?.publicId) {
          const transformedUrl = cloudinaryService.getAvatarUrl(
            first.cloudinaryResult.publicId
          );
          setAvatar(transformedUrl);
        }
      })();
    }
  };

  const handleNext = () => {
    router.push("/(auth)/artist-registration/step-4");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 10}
      className="flex-1 bg-background"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          className="flex-1 relative"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
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

          {/* Progress dots (show step 3 of total) */}
          <View className="items-center mb-8">
            <View className="flex-row items-center gap-1">
              {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
                <View
                  key={idx}
                  className={`${idx < currentStepDisplay ? (idx === currentStepDisplay - 1 ? "bg-foreground w-3 h-3" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
                />
              ))}
            </View>
          </View>

          {/* Title */}
          <View className="px-6 mb-4 flex-row gap-2 items-center">
            <Image
              source={require("@/assets/images/icons/user.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
            <Text className="text-foreground section-title font-neueBold">
              Create your profile
            </Text>
          </View>

          {/* Upload section */}
          <View className="px-6">
            <Text className="text-foreground font-montserratSemibold mb-1">
              Upload your photo<Text className="text-error">*</Text>
            </Text>
            <Text className="tat-body-2-light mb-4">
              Supporta JPG, PNG, max size 5MB
            </Text>

            <Pressable
              onPress={handlePickAvatar}
              className="items-center justify-center w-56 h-56 self-center rounded-full border-2 border-dashed border-error/70 bg-black/40"
            >
              {step3?.avatar ? (
                <Image
                  source={{ uri: step3.avatar }}
                  className="w-56 h-56 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <Image
                    source={require("@/assets/images/icons/user.png")}
                    className="w-10 h-10 mb-3"
                    resizeMode="contain"
                  />
                  <View className="bg-primary rounded-full py-3 px-6">
                    <Text className="text-foreground tat-body-1 font-neueBold">
                      Upload image
                    </Text>
                  </View>
                </View>
              )}
            </Pressable>
          </View>

          {/* Inputs */}
          <View className="px-6 mt-8">
            <Text className="text-foreground mb-2 tat-body-2-med">
              Name<Text className="text-error">*</Text>
            </Text>
            <View
              className={`flex-row items-center rounded-xl bg-black/40 ${focused === "firstName" ? "border-2 border-foreground" : "border border-gray"}`}
            >
              <TextInput
                className="flex-1 px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                placeholder="John"
                placeholderTextColor="#A49A99"
                value={step3?.firstName || ""}
                onChangeText={(v) => updateStep3({ firstName: v })}
                onFocus={() => setFocused("firstName")}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View className="mt-6">
              <Text className="text-foreground mb-2 tat-body-2-med">
                Surname<Text className="text-error">*</Text>
              </Text>
              <View
                className={`flex-row items-center rounded-xl bg-black/40 ${focused === "lastName" ? "border-2 border-foreground" : "border border-gray"}`}
              >
                <TextInput
                  className="flex-1 px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                  placeholder="Doe"
                  placeholderTextColor="#A49A99"
                  value={step3?.lastName || ""}
                  onChangeText={(v) => updateStep3({ lastName: v })}
                  onFocus={() => setFocused("lastName")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>
          </View>

          {/* Next button */}
          <View className="px-6 mt-10 mb-10 items-end absolute top-[80vh] left-0 right-0">
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleNext}
              className="bg-primary rounded-full py-4 px-8 items-center"
            >
              <Text className="text-foreground tat-body-1 font-neueBold">
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
