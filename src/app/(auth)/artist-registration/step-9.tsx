import { fetchServices, ServiceItem } from "@/services/services.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

function ServiceSkeleton() {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-gray/20">
      <View className="w-6 h-6 rounded bg-gray/30 mr-3" />
      <View className="flex-1">
        <View className="w-48 h-4 bg-gray/30 rounded mb-2" />
        <View className="w-32 h-3 bg-gray/20 rounded" />
      </View>
    </View>
  );
}

export default function ArtistStep9V2() {
  const { step9, toggleService, setCurrentStepDisplay, totalStepsDisplay } = useArtistRegistrationV2Store();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentStepDisplay(9);
    let mounted = true;
    (async () => {
      try {
        const data = await fetchServices();
        if (mounted) setServices(data);
      } catch (e) {
        setServices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selected = step9.servicesOffered || [];

  const onNext = () => {
    router.push("/(auth)/artist-registration/step-10");
  };

  const renderItem = ({ item }: { item: ServiceItem }) => {
    const isSelected = selected.includes(item.id);
    return (
      <Pressable onPress={() => toggleService(item.id)} className="flex-row items-center py-4 border-b border-gray/20">
        <View className="w-10 items-center">
          <View className={`w-5 h-5 rounded-[4px] border ${isSelected ? 'bg-error border-error' : 'bg-transparent border-foreground/50'}`} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground tat-body-1 font-neueBold">{item.name}</Text>
          {!!item.description && (
            <Text className="text-foreground/70 text-[12px] mt-1" numberOfLines={2}>{item.description}</Text>
          )}
        </View>
      </Pressable>
    );
  };

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
              <View key={idx} className={`${idx < 9 ? (idx === 8 ? 'bg-foreground w-3 h-3' : 'bg-success w-2 h-2') : 'bg-gray w-2 h-2'} rounded-full`} />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mb-2 flex-row gap-2 items-center">
          <Image source={require("@/assets/images/icons/style.png")} className="w-6 h-6" resizeMode="contain" />
          <Text className="text-foreground section-title font-neueBold">Services you offer</Text>
        </View>
        <View className="px-6 mb-4">
          <Text className="text-foreground/80">Select all services you provide</Text>
        </View>

        {/* List */}
        <View className="px-6">
          {loading ? (
            <View>
              {Array.from({ length: 8 }).map((_, i) => <ServiceSkeleton key={i} />)}
            </View>
          ) : (
            <FlatList data={services} keyExtractor={(i) => i.id} renderItem={renderItem} scrollEnabled={false} />
          )}
        </View>

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


