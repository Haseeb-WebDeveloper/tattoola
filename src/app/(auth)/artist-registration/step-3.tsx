import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step3Schema } from "@/utils/artistRegistrationValidation";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";

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
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }>({});

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
      setErrors((e) => ({ ...e, avatar: undefined }));

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

  const canProceed = isValid(step3Schema, {
    firstName: step3?.firstName || "",
    lastName: step3?.lastName || "",
    avatar: step3?.avatar || "",
  });

  const validateField = (field: "firstName" | "lastName") => {
    const result = step3Schema.safeParse({
      firstName: step3?.firstName || "",
      lastName: step3?.lastName || "",
      avatar: step3?.avatar || "",
    });
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      setErrors((e) => ({ ...e, [field]: issue?.message }));
    } else {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-4");
  };

  return (
    <View className="flex-1 bg-background relative">
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AuthStepHeader />

        {/* Progress dots (show step 3 of total) */}
        <View className="items-center mb-4 mt-8">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
              <View
                key={idx}
                className={`${idx < currentStepDisplay ? (idx === currentStepDisplay - 1 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mb-8 flex-row gap-2 items-center justify-center">
          <SVGIcons.Person width={25} height={25} />
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
            className="items-center w-52 h-52 rounded-full bg-black/40"
          >
            {step3?.avatar ? (
              <Image
                source={{ uri: step3.avatar }}
                className="w-52 h-52 rounded-full border-2 border-dashed border-error/70 "
                resizeMode="cover"
              />
            ) : (
              <View className="items-center border-2 border-dashed border-error/70 w-52 h-52 rounded-full justify-center gap-4 bg-primary/10">
                <SVGIcons.User className="w-10 h-10 mb-3" />
                <View className="bg-primary rounded-full py-2 px-4">
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
          <Text className="mb-2 label">
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
              onBlur={() => {
                setFocused(null);
                validateField("firstName");
              }}
            />
          </View>
          {!!errors.firstName && (
            <Text className="text-xs text-error mt-1">{errors.firstName}</Text>
          )}

          <View className="mt-6">
            <Text className="mb-2 label">
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
                onBlur={() => {
                  setFocused(null);
                  validateField("lastName");
                }}
              />
            </View>
            {!!errors.lastName && (
              <Text className="text-xs text-error mt-1">{errors.lastName}</Text>
            )}
          </View>
        </View>

        {/* Next button */}
        <View className="px-6 mt-10 mb-10 items-end absolute top-[80vh] left-0 right-0">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleNext}
            disabled={!canProceed}
            className={`${canProceed ? "bg-primary" : "bg-gray/40"} rounded-full py-4 px-8 items-center`}
          >
            <Text className="text-foreground tat-body-1 font-neueBold">
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
