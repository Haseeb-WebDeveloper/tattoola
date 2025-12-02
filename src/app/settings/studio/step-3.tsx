import LocationPicker from "@/components/shared/LocationPicker";
import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import StudioStepHeader from "@/components/ui/StudioStepHeader";
import { SVGIcons } from "@/constants/svg";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function StudioStep3() {
  const { step3, updateStep3, setCurrentStep, totalSteps } =
    useStudioSetupStore();

  const [formData, setFormData] = useState({
    name: step3.name || "",
    province: step3.province || "",
    provinceId: step3.provinceId || "",
    municipality: step3.municipality || "",
    municipalityId: step3.municipalityId || "",
    address: step3.address || "",
  });

  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    setCurrentStep(3);
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed =
    formData.name.trim() !== "" &&
    formData.province !== "" &&
    formData.municipality !== "" &&
    formData.address.trim() !== "";

  const handleNext = () => {
    if (!canProceed) return;

    // Save to store
    updateStep3(formData);

    // Navigate to next step
    router.push("/settings/studio/step-4" as any);
  };

  const handleBack = () => {
    router.back();
  };

  const handleLocationSelect = (data: {
    province: string;
    provinceId: string;
    municipality: string;
    municipalityId: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      province: data.province,
      provinceId: data.provinceId,
      municipality: data.municipality,
      municipalityId: data.municipalityId,
    }));
  };

  const displayValue =
    formData.municipality && formData.province
      ? `${formData.province}, ${formData.municipality}`
      : formData.province || "";

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: mvs(120),
        }}
      >
        {/* Header */}
        <StudioStepHeader
          currentStep={3}
          totalSteps={8}
        stepName="Informazioni Studio"
          icon={<SVGIcons.Location width={s(19)} height={s(19)} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24), gap: mvs(24) }}>
          {/* Studio Name */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
            className="text-tat mb-2 font-montserratSemibold"
            >
              Nome dello Studio
              <ScaledText variant="body2" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              style={{ fontSize: s(12) }}
              placeholder="Inserisci il nome dello Studio"
                
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
            />
          </View>

          {/* Province & Municipality */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
            className="text-tat mb-2 font-montserratSemibold"
            >
              Provincia & Comune
              <ScaledText variant="body2" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowLocationModal(true)}
              className="rounded-xl border border-gray px-4 py-3 bg-tat-foreground"
              style={{ paddingVertical: mvs(12), paddingHorizontal: s(16) }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className={displayValue ? "text-tat font-montserratSemibold" : "text-gray font-montserratSemibold"}
              >
                {displayValue || "Seleziona Provincia e Comune"}
              </ScaledText>
            </TouchableOpacity>
          </View>

          {/* Studio Address */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat mb-2 font-montserratSemibold"
            >
              Inserisci l'indirizzo dello Studio dove lavori
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              placeholder="Inserisci l'indirizzo dello Studio"
                
              value={formData.address}
              onChangeText={(value) => handleInputChange("address", value)}
              multiline
              numberOfLines={3}
              style={{ minHeight: mvs(80), textAlignVertical: "top", fontSize: s(12) }}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

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
          nextDisabled={!canProceed}
          onBack={handleBack}
        />
      </View>

      {/* Location Picker Bottom Sheet */}
      <LocationPicker
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        initialProvinceId={formData.provinceId}
        initialMunicipalityId={formData.municipalityId}
      />
    </View>
  );
}

