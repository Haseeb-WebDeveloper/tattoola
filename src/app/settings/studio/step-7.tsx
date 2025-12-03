import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import StudioStepHeader from "@/components/ui/StudioStepHeader";
import { SVGIcons } from "@/constants/svg";
import { fetchServices, ServiceItem } from "@/services/services.service";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, TouchableOpacity, View } from "react-native";

function ServiceSkeleton() {
  return (
    <View
      className="flex-row items-center border-b border-gray/20"
      style={{ paddingHorizontal: s(20), paddingVertical: mvs(16) }}
    >
      <View
        className="rounded bg-gray/30"
        style={{ width: s(18), height: s(18), marginRight: s(16) }}
      />
      <View className="flex-1">
        <View
          className="bg-gray/30 rounded"
          style={{ width: s(120), height: s(16) }}
        />
      </View>
    </View>
  );
}

export default function StudioStep7() {
  const { step7, updateStep7, setCurrentStep, totalSteps } =
    useStudioSetupStore();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    step7.serviceIds || []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentStep(7);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const allServices = await fetchServices();

        if (mounted) {
          setServices(allServices);
        }
      } catch (error: any) {
        console.error("Error loading services:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const canProceed = selectedServices.length >= 1;

  const handleNext = () => {
    if (!canProceed) return;

    // Save to store
    updateStep7({
      serviceIds: selectedServices,
    });

    // Navigate to next step
    router.push("/settings/studio/step-8" as any);
  };

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }: { item: ServiceItem }) => {
    const isSelected = selectedServices.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => toggleService(item.id)}
      >
      <View
        className="flex-row items-center border-b border-gray/20"
        style={{
          paddingHorizontal: s(16),
          paddingVertical: mvs(16),
          gap: s(8),
        }}
      >
        <Pressable
          className="items-center"
          style={{ width: s(40) }}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox style={{ width: s(20), height: s(20) }} />
          ) : (
            <SVGIcons.UncheckedCheckbox
              style={{ width: s(20), height: s(20) }}
            />
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
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <StudioStepHeader
          currentStep={7}
          totalSteps={8}
          stepName="Seleziona i  servizi del tuo studio"
          icon={<SVGIcons.MagicStick width={s(19)} height={s(19)} />}
        />

        {/* Subtitle */}
        <View style={{ paddingHorizontal: s(24)}}>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueSemibold"
            style={{ marginBottom: mvs(8) }}
          >
            Seleziona i servizi
          </ScaledText>
        </View>

        {/* Services List */}
        <View className="flex-1">
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(120),
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <ServiceSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={services}
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
