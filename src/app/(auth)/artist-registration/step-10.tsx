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
    <View
      className="flex-row items-center tat-foreground-gray border-gray"
      style={{
        paddingHorizontal: s(16),
        paddingVertical: mvs(14),
        borderBottomWidth: s(0.5),
        gap: s(8),
      }}
    >
      <Pressable className="w-10 items-center">
        <SVGIcons.UncheckedCheckbox width={s(17)} height={s(17)} />
      </Pressable>
      <View className="flex-1">
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground font-montserratMedium"
        >
          ...
        </ScaledText>
      </View>
    </View>
  );
}

export default function ArtistStep10V2() {
  const insets = useSafeAreaInsets();
  const { step10, toggleBodyPart, setCurrentStepDisplay, totalStepsDisplay } =
    useArtistRegistrationV2Store();
  const { step13 } = useArtistRegistrationV2Store();
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
      <Pressable
        className="flex-row items-center tat-foreground-gray border-gray"
        style={{
          paddingHorizontal: s(10),
          paddingVertical: mvs(14),
          borderBottomWidth: s(0.5),
          gap: s(8),
        }}
        onPress={() => toggleBodyPart(item.id)}
      >
        <View className="items-center">
          {isSelected ? (
            <SVGIcons.CheckedCheckbox width={s(17)} height={s(17)} />
          ) : (
            <SVGIcons.UncheckedCheckbox width={s(17)} height={s(17)} />
          )}
        </View>
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
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Header */}
        <AuthStepHeader
          onClose={() => {
            router.replace("/(auth)/welcome");
          }}
        />

        {/* Progress */}
        <RegistrationProgress
          currentStep={10}
          totalSteps={totalStepsDisplay}
          name="Parti del corpo su cui lavori"
          description="Seleziona tutte le aree del corpo che tatu di solito"
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
              {Array.from({ length: 12 }).map((_, i) => (
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
          backLabel="Indietro"
          onBack={() => router.back()}
        />
      </View>
    </View>
  );
}
