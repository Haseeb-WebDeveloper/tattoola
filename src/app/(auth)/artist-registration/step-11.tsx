import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ArtistStep11V2() {
  const { step11, updateStep11, totalStepsDisplay, setCurrentStepDisplay } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStepDisplay(11);
  }, []);

  const onNext = () => {
    router.push("/(auth)/artist-registration/step-12");
  };

  const renderCurrencyInput = (
    label: string,
    value: number | undefined,
    onChange: (n?: number) => void,
    field: string
  ) => (
    <View className="px-6 mb-6">
      <Text className="text-foreground mb-2 tat-body-2-med">{label}</Text>
      <View className={`flex-row items-center rounded-xl bg-black/40 ${focused === field ? 'border-2 border-foreground' : 'border border-gray'}`}>
        <View className="pl-4 pr-2 py-3"><Text className="text-foreground font-neueBold">€</Text></View>
        <TextInput
          className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
          placeholder="0"
          placeholderTextColor="#A49A99"
          keyboardType="numeric"
          value={value !== undefined ? String(value) : ''}
          onChangeText={(v) => {
            const digits = v.replace(/[^0-9]/g, '');
            onChange(digits ? Number(digits) : undefined);
          }}
          onFocus={() => setFocused(field)}
          onBlur={() => setFocused(null)}
          maxLength={6}
        />
        <View className="pr-4 py-3">
          <Text className="text-foreground/80">EUR</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 10}
      className="flex-1 bg-black"
    >
      <ScrollView className="flex-1" contentContainerClassName="flex-grow">
        {/* Header */}
        <View className="px-4 my-8">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.replace('/(auth)/welcome')} className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center">
              <Image source={require("@/assets/images/icons/close.png")} resizeMode="contain" />
            </TouchableOpacity>
            <Image source={require("@/assets/logo/logo-light.png")} className="h-10" resizeMode="contain" />
            <View className="w-10" />
          </View>
          <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
        </View>

        {/* Progress */}
        <View className="items-center mb-6">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
              <View key={idx} className={`${idx < 11 ? (idx === 10 ? 'bg-foreground w-3 h-3' : 'bg-success w-2 h-2') : 'bg-gray w-2 h-2'} rounded-full`} />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mb-6 flex-row gap-2 items-center">
          <Image source={require("@/assets/images/icons/style.png")} className="w-6 h-6" resizeMode="contain" />
          <Text className="text-foreground section-title font-neueBold">Pricing</Text>
        </View>

        {renderCurrencyInput('Minimum rate', step11.minimumPrice, (n) => updateStep11({ minimumPrice: n }), 'min')}
        {renderCurrencyInput('Hourly rate', step11.hourlyRate, (n) => updateStep11({ hourlyRate: n }), 'hourly')}

        {/* Footer */}
        <View className="flex-row justify-between px-6 mt-10 mb-10">
          <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
            <Text className="text-foreground">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} className="rounded-full px-8 py-4 bg-primary">
            <Text className="text-foreground">Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


