import { fetchServices, ServiceItem } from "@/services/services.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step9Schema } from "@/utils/artistRegistrationValidation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";

function ServiceSkeleton() {
  return (
    <View className="flex-row items-center justify-between p-4 border-b border-gray/20 tat-foreground-gray">
      <View className="w-6 h-6 rounded bg-gray/30 mr-3" />
      <View className="flex-1">
        <View className="w-48 h-4 bg-gray/30 rounded" />
      </View>
    </View>
  );
}

export default function ArtistStep9V2() {
  const { step9, toggleService, setCurrentStepDisplay, totalStepsDisplay } =
    useArtistRegistrationV2Store();
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
    return () => {
      mounted = false;
    };
  }, []);

  const selected = step9.servicesOffered || [];
  const canProceed = isValid(step9Schema, { servicesOffered: selected });

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-10");
  };

  const renderItem = ({ item }: { item: ServiceItem }) => {
    const isSelected = selected.includes(item.id);
    return (
      <View className="flex-row items-center p-4 border-b border-gray/20 tat-foreground-gray">
        <Pressable
          className="w-10 items-center"
          onPress={() => toggleService(item.id)}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox className="w-5 h-5" />
          ) : (
            <SVGIcons.UncheckedCheckbox className="w-5 h-5" />
          )}
        </Pressable>
        <View className="flex-1">
          <Text className="text-foreground tat-body-1 font-neueBold">
            {item.name}
          </Text>
        </View>
      </View>
    );
  };

  // Calculate list height: screen height - header/progress/title/desc/footer heights
  // We'll use a fixed value for header+progress+title+desc+footer for simplicity
  // You can fine-tune this value as needed for your layout
  const windowHeight = Dimensions.get("window").height;
  const HEADER_HEIGHT = 60; // AuthStepHeader
  const PROGRESS_HEIGHT = 40; // Progress dots
  const TITLE_HEIGHT = 60; // Title + desc
  const FOOTER_HEIGHT = 80; // Footer
  const PADDING = 32; // Extra padding/margins
  const LIST_HEIGHT =
    windowHeight -
    HEADER_HEIGHT -
    PROGRESS_HEIGHT -
    TITLE_HEIGHT -
    FOOTER_HEIGHT -
    PADDING;

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <View className="items-center  mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
            <View
              key={idx}
              className={`${
                idx < 9
                  ? idx === 8
                    ? "bg-foreground w-4 h-4"
                    : "bg-success w-2 h-2"
                  : "bg-gray w-2 h-2"
              } rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-2 flex-row gap-2 items-center justify-center">
        <SVGIcons.Magic width={22} height={22} />
        <Text className="text-foreground section-title font-neueBold text-center">
          Services you offer
        </Text>
      </View>

      <View className="px-6 mb-8">
        <Text className="text-foreground/80 text-center">
          Select all services you provide
        </Text>
      </View>

      {/* List */}
      <View className="flex-1 mb-20" style={{ maxHeight: LIST_HEIGHT }}>
        {loading ? (
          <View>
            {Array.from({ length: 8 }).map((_, i) => (
              <ServiceSkeleton key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>

      {/* Fixed Footer */}
      <View
        className="flex-row justify-between px-6 py-4 bg-background"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full px-6 py-4"
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
