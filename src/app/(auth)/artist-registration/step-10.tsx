import AuthStepHeader from "@/components/ui/auth-step-header";
import FixedFooter from "@/components/ui/FixedFooter";
import { SVGIcons } from "@/constants/svg";
import { BodyPartItem, fetchBodyParts } from "@/services/bodyparts.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step10Schema } from "@/utils/artistRegistrationValidation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function PartSkeleton() {
  return (
    <View className="flex-row items-center justify-between p-4 border-b border-gray/20 tat-foreground-gray">
      <View className="w-6 h-6 rounded bg-gray/30 mr-3" />
      <View className="flex-1">
        <View className="w-48 h-4 bg-gray/30 rounded" />
      </View>
    </View>
  );
}

export default function ArtistStep10V2() {
  const { step10, toggleBodyPart, setCurrentStepDisplay, totalStepsDisplay } =
    useArtistRegistrationV2Store();
  const [parts, setParts] = useState<BodyPartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentStepDisplay(10);
    let mounted = true;
    (async () => {
      try {
        const data = await fetchBodyParts();
        if (mounted) setParts(data);
      } catch (e) {
        setParts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selected = step10.bodyParts || [];
  const canProceed = isValid(step10Schema, { bodyParts: selected });

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-11");
  };

  const renderItem = ({ item }: { item: BodyPartItem }) => {
    const isSelected = selected.includes(item.id);
    return (
      <View className="flex-row items-center px-4 py-4 border-b border-gray/20 tat-foreground-gray">
        <Pressable
          className="w-10 items-center"
          onPress={() => toggleBodyPart(item.id)}
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
          {!!item.description && (
            <Text
              className="text-foreground/70 text-[12px] mt-1"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Constrain list height similar to step 9 and allow FlatList to scroll
  const windowHeight = Dimensions.get("window").height;
  const HEADER_HEIGHT = 60; // AuthStepHeader
  const PROGRESS_HEIGHT = 40; // Progress dots
  const TITLE_HEIGHT = 100; // Title + helper
  const FOOTER_HEIGHT = 80; // FixedFooter
  const PADDING = 32; // extra padding
  const LIST_HEIGHT =
    windowHeight -
    HEADER_HEIGHT -
    PROGRESS_HEIGHT -
    TITLE_HEIGHT -
    FOOTER_HEIGHT -
    PADDING;

  return (
    <View className="flex-1 bg-black pb-40 relative">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <View className="items-center  mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < 10 ? (idx === 9 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-2 flex-row gap-2 items-center justify-center">
        <SVGIcons.Pricing width={22} height={22} />
        <Text className="text-foreground section-title font-neueBold">
          Body parts you work on
        </Text>
      </View>
      <View className="px-6 mb-8">
        <Text className="text-foreground/80 text-center">
          Select all body areas you typically tattoo
        </Text>
      </View>

      {/* List */}
      <View className="mb-24" style={{ maxHeight: LIST_HEIGHT }}>
        {loading ? (
          <View>
            {Array.from({ length: 8 }).map((_, i) => (
              <PartSkeleton key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={parts}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>

      {/* Fixed Footer */}
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
