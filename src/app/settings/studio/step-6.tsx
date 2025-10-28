import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import StudioStepHeader from "@/components/ui/StudioStepHeader";
import { SVGIcons } from "@/constants/svg";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native";

function StyleSkeleton() {
  return (
    <View className="flex-row items-center justify-between border-b border-gray/20 px-4">
      <View className="w-6 h-6 rounded-md bg-gray/30 mr-3" />
      <View className="w-32 h-24 bg-gray/30" />
      <View className="flex-1 px-4">
        <View className="w-24 h-4 bg-gray/30 rounded" />
      </View>
    </View>
  );
}

export default function StudioStep6() {
  const { step6, updateStep6, setCurrentStep, totalSteps } =
    useStudioSetupStore();

  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    step6.styleIds || []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentStep(6);
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const allStyles = await fetchTattooStyles();
        if (mounted) setStyles(allStyles);
      } catch (e) {
        setStyles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId]
    );
  };

  const canProceed = selectedStyles.length >= 1;

  const handleNext = () => {
    if (!canProceed) return;
    updateStep6({
      styleIds: selectedStyles,
    });
    router.push("/settings/studio/step-7" as any);
  };

  const handleBack = () => {
    router.back();
  };

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    try {
      if (url.includes("imgres") && url.includes("imgurl=")) {
        const u = new URL(url);
        const real = u.searchParams.get("imgurl");
        return real || url;
      }
      return url;
    } catch {
      return url;
    }
  };

  const renderItem = ({ item }: { item: TattooStyleItem }) => {
    const isSelected = selectedStyles.includes(item.id);
    const img = resolveImageUrl(item.imageUrl);

    return (
      <View
        className="flex-row items-center border-b border-gray/20"
        style={{ paddingHorizontal: s(16) }}
      >
        {/* Left select box */}
        <Pressable
          className="items-center"
          style={{ width: s(40) }}
          onPress={() => toggleStyle(item.id)}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox className="w-5 h-5" />
          ) : (
            <SVGIcons.UncheckedCheckbox className="w-5 h-5" />
          )}
        </Pressable>

        {/* Image */}
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: s(120), height: s(96) }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="bg-gray/30"
            style={{ width: s(120), height: s(96) }}
          />
        )}

        {/* Name */}
        <View className="flex-1" style={{ paddingHorizontal: s(16) }}>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-montserratSemibold"
          >
            {item.name}
          </ScaledText>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <StudioStepHeader
          currentStep={6}
          totalSteps={totalSteps}
          stepName="Styles"
          icon={<SVGIcons.Style width={s(19)} height={s(19)} />}
        />

        {/* Subtitle */}
        <View style={{ paddingHorizontal: s(24), marginBottom: mvs(8) }}>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-semibold"
          >
            Select tattoo styles
          </ScaledText>
        </View>

        {/* Styles List */}
        <View className="flex-1">
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(120),
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <StyleSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={styles}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: mvs(120),
              }}
            />
          )}
        </View>
      </View>

      {/* Footer - Fixed at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#000",
        }}
      >
        <NextBackFooter
          onNext={handleNext}
          nextDisabled={!canProceed || loading}
          onBack={handleBack}
        />
      </View>
    </View>
  );
}
