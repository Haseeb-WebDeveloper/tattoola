import { useArtistRegistrationV2Store } from '@/stores/artistRegistrationV2Store';
import { WorkArrangement } from '@/types/auth';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const OPTIONS: { key: WorkArrangement; label: string }[] = [
  { key: 'FREELANCE' as WorkArrangement, label: 'Sono un Tattoo Artist che lavora freelance' },
  { key: 'STUDIO_EMPLOYEE' as WorkArrangement, label: 'Sono un Tattoo Artist che lavora in uno studio' },
  { key: 'STUDIO_OWNER' as WorkArrangement, label: 'Sono il titolare del mio studio' },
];

export default function ArtistStep4V2() {
  const { step4, setWorkArrangement, totalStepsDisplay } = useArtistRegistrationV2Store();
  const activeStep = 4;

  const selected = step4.workArrangement;

  const onNext = () => {
    if (!selected) return;
    router.push('/(auth)/artist-registration/step-5');
  };

  return (
    <ScrollView className="flex-1 bg-black relative" contentContainerClassName="flex-grow">
      {/* Header */}
      <View className="px-4 my-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.replace('/(auth)/welcome')} className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center">
            <Image source={require('@/assets/images/icons/close.png')} resizeMode="contain" />
          </TouchableOpacity>
          <Image source={require('@/assets/logo/logo-light.png')} className="h-10" resizeMode="contain" />
          <View className="w-10" />
        </View>
        <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
      </View>

      {/* Progress */}
      <View className="items-center mb-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
            <View key={idx} className={`${idx < activeStep ? (idx === activeStep - 1 ? 'bg-foreground w-3 h-3' : 'bg-success w-2 h-2') : 'bg-gray w-2 h-2'} rounded-full`} />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-6 flex-row gap-2 items-center">
        <Image source={require('@/assets/images/icons/pen.png')} className="w-6 h-6" resizeMode="contain" />
        <Text className="text-foreground section-title font-neueBold">How do you work as an artist?</Text>
      </View>

      {/* Options */}
      <View className="px-6 gap-4">
        {OPTIONS.map((opt) => {
          const active = selected === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setWorkArrangement(opt.key)}
              className={`rounded-xl px-4 py-6 border ${active ? 'border-foreground' : 'border-gray'} bg-black/40`}
            >
              <View className="flex-row items-center">
                <View className={`w-5 h-5 mr-3 rounded-full ${active ? 'bg-primary' : 'border border-gray'}`} />
                <Text
                  className="text-foreground text-base flex-1"
                  style={{ flexShrink: 1, flexWrap: 'wrap' }}
                >
                  {opt.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer actions */}
      <View className="flex-row justify-between px-6 mt-10 mb-10 absolute top-[80vh] left-0 right-0">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} disabled={!selected} className={`rounded-full px-8 py-4 ${selected ? 'bg-primary' : 'bg-gray/40'}`}>
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


