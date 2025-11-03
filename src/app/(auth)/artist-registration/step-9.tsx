import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { fetchServices, ServiceItem } from "@/services/services.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step9Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AbsoluteNextBackFooter from "@/components/ui/AbsoluteNextBackFooter";

function ServiceSkeleton() {
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
      <Pressable className="items-center">
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

export default function ArtistStep9V2() {
  const insets = useSafeAreaInsets();
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
      <View
        className="flex-row items-center tat-foreground-gray border-gray"
        style={{
          paddingHorizontal: s(16),
          paddingVertical: mvs(14),
          borderBottomWidth: s(0.5),
          gap: s(8),
        }}
      >
        <Pressable
          className="items-center"
          onPress={() => toggleService(item.id)}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox width={s(17)} height={s(17)} />
          ) : (
            <SVGIcons.UncheckedCheckbox width={s(17)} height={s(17)} />
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
          currentStep={9}
          totalSteps={totalStepsDisplay}
          name="Services you offer"
          description="Select all services you provide"
          icon={<SVGIcons.Magic width={19} height={19} />}
          nameVariant="2xl"
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
                <ServiceSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={services}
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
