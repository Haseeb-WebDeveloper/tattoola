import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { BodyPartItem, fetchBodyParts } from "@/services/bodyparts.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step10Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AbsoluteNextBackFooter from "@/components/ui/AbsoluteNextBackFooter";

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
  const insets = useSafeAreaInsets();
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
      <View
        className="flex-row items-center border-b border-gray/20 tat-foreground-gray"
        style={{ paddingHorizontal: s(16), paddingVertical: mvs(16) }}
      >
        <Pressable
          className="items-center"
          style={{ width: s(40) }}
          onPress={() => toggleBodyPart(item.id)}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox className="w-5 h-5" />
          ) : (
            <SVGIcons.UncheckedCheckbox className="w-5 h-5" />
          )}
        </Pressable>
        <View className="flex-1">
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-montserratMedium"
          >
            {item.name}
          </ScaledText>
          {/* {!!item.description && (
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-foreground font-montserratLight"
              style={{ marginTop: mvs(4) }}
              numberOfLines={2}
            >
              {item.description}
            </ScaledText>
          )} */}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Header */}
        <AuthStepHeader />

        {/* Progress */}
        <RegistrationProgress
          currentStep={10}
          totalSteps={totalStepsDisplay}
          name="Body parts you work on"
          description="Select all body areas you typically tattoo"
          icon={<SVGIcons.Pricing width={19} height={19} />}
        />

        {/* List */}
        <View className="flex-1">
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(13),
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <PartSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={parts}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{
                paddingBottom: mvs(13),
              }}
            />
          )}
        </View>

        {/* Fixed Footer */}
        <AbsoluteNextBackFooter
          onNext={onNext}
          nextDisabled={!canProceed}
          backLabel="Back"
          onBack={() => router.back()}
        />
      </View>
    </View>
  );
}
