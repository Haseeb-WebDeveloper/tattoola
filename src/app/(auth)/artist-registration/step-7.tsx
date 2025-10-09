import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step7Schema } from "@/utils/artistRegistrationValidation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
export default function ArtistStep7V2() {
  const {
    step7,
    updateStep7,
    totalStepsDisplay,
    currentStepDisplay,
    setCurrentStepDisplay,
  } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ bio?: string }>({});

  useEffect(() => {
    setCurrentStepDisplay(7);
  }, []);

  const canProceed = isValid(step7Schema, {
    bio: step7.bio || "",
    instagram: step7.instagram || undefined,
    tiktok: step7.tiktok || undefined,
  });

  const validateAll = () => {
    const result = step7Schema.safeParse({
      bio: step7.bio || "",
      instagram: step7.instagram || undefined,
      tiktok: step7.tiktok || undefined,
    });
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "bio");
      setErrors({ bio: issue?.message });
    } else {
      setErrors({});
    }
  };

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-8");
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={150}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-black"
    >
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <View className="items-center  mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < 7 ? (idx === 6 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-8 flex-row gap-2 items-center justify-center">
        <SVGIcons.Heart width={22} height={22} />
        <Text className="text-foreground section-title font-neueBold">
          Add Bio & Socials
        </Text>
      </View>

      {/* Bio */}
      <View className="px-6 mb-6">
        <Text className="mb-2 label">
          Racconta qualcosa di te<Text className="text-error">*</Text>
        </Text>
        <View
          className={`rounded-2xl bg-black/40 ${focused === "bio" ? "border-2 border-foreground" : "border border-gray"}`}
        >
          <TextInput
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-2xl min-h-[120px] text-start"
            placeholder="Hi, I’m John. I’m a tattoo artist from the past 10 years..."
            placeholderTextColor="#A49A99"
            value={step7.bio || ""}
            onChangeText={(v) => updateStep7({ bio: v })}
            onFocus={() => setFocused("bio")}
            onBlur={() => {
              setFocused(null);
              validateAll();
            }}
          />
        </View>
        {!!errors.bio && (
          <Text className="text-xs text-error mt-1">{errors.bio}</Text>
        )}
      </View>

      {/* Instagram */}
      <View className="px-6 mb-6">
        <Text className="mb-2 label">
          Inserisci il link al tuo account Instagram (facoltativo)
        </Text>
        <View
          className={`flex-row items-center rounded-xl bg-black/40 ${focused === "instagram" ? "border-2 border-foreground" : "border border-gray"}`}
        >
          <View className="pl-4 pr-2 py-3">
            <Text className="text-foreground font-neueBold">@</Text>
          </View>
          <TextInput
            className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
            placeholder="tattooking_85"
            placeholderTextColor="#A49A99"
            autoCapitalize="none"
            value={(step7.instagram || "").replace(/^@/, "")}
            onChangeText={(v) => {
              const username = v.replace(/\s+/g, "").replace(/^@/, "");
              updateStep7({ instagram: username });
            }}
            onFocus={() => setFocused("instagram")}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>

      {/* TikTok */}
      <View className="px-6 mb-6">
        <Text className="mb-2 label">
          Inserisci il link al tuo account Tiktok (facoltativo)
        </Text>
        <View
          className={`flex-row items-center rounded-xl bg-black/40 ${focused === "tiktok" ? "border-2 border-foreground" : "border border-gray"}`}
        >
          <View className="pl-4 pr-2 py-3">
            <Text className="text-foreground font-neueBold">@</Text>
          </View>
          <TextInput
            className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
            placeholder="tattooking_85"
            placeholderTextColor="#A49A99"
            autoCapitalize="none"
            value={(step7.tiktok || "").replace(/^@/, "")}
            onChangeText={(v) => {
              const username = v.replace(/\s+/g, "").replace(/^@/, "");
              updateStep7({ tiktok: username });
            }}
            onFocus={() => setFocused("tiktok")}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>

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
          disabled={!canProceed}
          className={`rounded-full px-8 py-4 ${canProceed ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
