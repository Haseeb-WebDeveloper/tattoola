import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function ArtistStep7V2() {
  const { step7, updateStep7, totalStepsDisplay, currentStepDisplay, setCurrentStepDisplay } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStepDisplay(7);
  }, []);

  const onNext = () => {
    router.push("/(auth)/artist-registration/step-8");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 10}
      className="flex-1 bg-black"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView className="flex-1 relative" contentContainerClassName="flex-grow">
          {/* Header */}
          <View className="px-4 my-8">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/welcome")}
                className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
              >
                <Image source={require("@/assets/images/icons/close.png")} resizeMode="contain" />
              </TouchableOpacity>
              <Image source={require("@/assets/logo/logo-light.png")} className="h-10" resizeMode="contain" />
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
                  className={`${idx < 7 ? (idx === 6 ? "bg-foreground w-3 h-3" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
                />
              ))}
            </View>
          </View>

          {/* Title */}
          <View className="px-6 mb-4 flex-row gap-2 items-center">
            <Image source={require("@/assets/images/icons/heart.png")} className="w-6 h-6" resizeMode="contain" />
            <Text className="text-foreground section-title font-neueBold">Add Bio & Socials</Text>
          </View>

          {/* Bio */}
          <View className="px-6 mb-6">
            <Text className="text-foreground mb-2 tat-body-2-med">Racconta qualcosa di te<Text className="text-error">*</Text></Text>
            <View className={`rounded-2xl bg-black/40 ${focused === "bio" ? "border-2 border-foreground" : "border border-gray"}`}>
              <TextInput
                multiline
                numberOfLines={6}
                className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-2xl min-h-[160px]"
                placeholder="Hi, I’m John. I’m a tattoo artist from the past 10 years..."
                placeholderTextColor="#A49A99"
                value={step7.bio || ""}
                onChangeText={(v) => updateStep7({ bio: v })}
                onFocus={() => setFocused("bio")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Instagram */}
          <View className="px-6 mb-6">
            <Text className="text-foreground mb-2 tat-body-2-med">Inserisci il link al tuo account Instagram (facoltativo)</Text>
            <View className={`flex-row items-center rounded-xl bg-black/40 ${focused === "instagram" ? "border-2 border-foreground" : "border border-gray"}`}>
              <View className="pl-4 pr-2 py-3"><Text className="text-foreground font-neueBold">@</Text></View>
              <TextInput
                className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                placeholder="tattooking_85"
                placeholderTextColor="#A49A99"
                autoCapitalize="none"
                value={(step7.instagram || "").replace(/^@/, "")}
                onChangeText={(v) => {
                  const username = v.replace(/\s+/g, '').replace(/^@/, '');
                  updateStep7({ instagram: username });
                }}
                onFocus={() => setFocused("instagram")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* TikTok */}
          <View className="px-6 mb-6">
            <Text className="text-foreground mb-2 tat-body-2-med">Inserisci il link al tuo account Tiktok (facoltativo)</Text>
            <View className={`flex-row items-center rounded-xl bg-black/40 ${focused === "tiktok" ? "border-2 border-foreground" : "border border-gray"}`}>
              <View className="pl-4 pr-2 py-3"><Text className="text-foreground font-neueBold">@</Text></View>
              <TextInput
                className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                placeholder="tattooking_85"
                placeholderTextColor="#A49A99"
                autoCapitalize="none"
                value={(step7.tiktok || "").replace(/^@/, "")}
                onChangeText={(v) => {
                  const username = v.replace(/\s+/g, '').replace(/^@/, '');
                  updateStep7({ tiktok: username });
                }}
                onFocus={() => setFocused("tiktok")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-between px-6 mt-10 mb-10 absolute top-[80vh] left-0 right-0">
            <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
              <Text className="text-foreground">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} className="rounded-full px-8 py-4 bg-primary">
              <Text className="text-foreground">Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


