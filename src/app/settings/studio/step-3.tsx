import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import StudioStepHeader from "@/components/ui/StudioStepHeader";
import { SVGIcons } from "@/constants/svg";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudioStep3() {
  const { step3, updateStep3, setCurrentStep, totalSteps } =
    useStudioSetupStore();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    name: step3.name || "",
    province: step3.province || "",
    provinceId: step3.provinceId || "",
    municipality: step3.municipality || "",
    municipalityId: step3.municipalityId || "",
    address: step3.address || "",
  });

  const [modalStep, setModalStep] = useState<null | "province" | "municipality">(null);
  const [provinces, setProvinces] = useState<
    { id: string; name: string; imageUrl?: string | null }[]
  >([]);
  const [municipalities, setMunicipalities] = useState<
    { id: string; name: string; imageUrl?: string | null }[]
  >([]);
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    setCurrentStep(3);
  }, []);

  // Load provinces on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("id, name, imageUrl")
        .eq("isActive", true)
        .order("name");
      if (error) {
        console.error("Error loading provinces:", error);
        setProvinces([]);
      } else {
        setProvinces(data || []);
      }
    })();
  }, []);

  // Load municipalities when a province is selected in modal
  useEffect(() => {
    (async () => {
      if (
        modalStep === "municipality" &&
        (selectedProvince || formData.province)
      ) {
        const provinceId =
          selectedProvince?.id ||
          provinces.find((p) => p.name === formData.province)?.id;
        const { data, error } = await supabase
          .from("municipalities")
          .select("id, name, imageUrl")
          .eq("provinceId", provinceId)
          .eq("isActive", true)
          .order("name");
        if (error) {
          console.error("Error loading municipalities:", error);
          setMunicipalities([]);
        } else {
          setMunicipalities(data || []);
        }
      }
    })();
  }, [modalStep, selectedProvince, formData.province]);

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

  const onChange = (
    province: string,
    municipality: string,
    provinceId: string,
    municipalityId: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      province,
      municipality,
      provinceId,
      municipalityId,
    }));
  };

  const topSix = provinces.slice(0, 6);
  const topSixIds = new Set(topSix.map((p) => p.id));
  const isSearching = search.trim().length > 0;

  const listFiltered = (modalStep === "province" ? provinces : municipalities)
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((r) =>
      modalStep === "province" && !isSearching ? !topSixIds.has(r.id) : true
    );

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
          totalSteps={totalSteps}
          stepName="Studio Info"
          icon={<SVGIcons.Location width={s(19)} height={s(19)} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24), gap: mvs(24) }}>
          {/* Studio Name */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-foreground mb-2"
            >
              Name of the Studio
              <ScaledText variant="body2" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              placeholder="Enter studio name"
              placeholderTextColor="#A49A99"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
            />
          </View>

          {/* Province & Municipality */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-foreground mb-2"
            >
              Provincia & Comune
              <ScaledText variant="body2" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setModalStep("province");
                setSearch("");
              }}
              className="rounded-xl border border-gray px-4 py-3"
              style={{ paddingVertical: mvs(12), paddingHorizontal: s(16) }}
            >
              <ScaledText
                allowScaling={false}
                variant="body1"
                className={displayValue ? "text-foreground" : "text-gray"}
              >
                {displayValue || "Select Province and Municipality"}
              </ScaledText>
            </TouchableOpacity>
          </View>

          {/* Studio Address */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-foreground mb-2"
            >
              Inserisci l'indirizzo dello Studio dove lavori
              <ScaledText variant="body2" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground"
              placeholder="Enter studio address"
              placeholderTextColor="#A49A99"
              value={formData.address}
              onChangeText={(value) => handleInputChange("address", value)}
              multiline
              numberOfLines={3}
              style={{ minHeight: mvs(80), textAlignVertical: "top" }}
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

      {/* Selection Modal */}
      <Modal
        visible={!!modalStep}
        transparent
        animationType="slide"
        onRequestClose={() => setModalStep(null)}
      >
        <View className="flex-1 bg-black/50">
          <View
            className="flex-1 bg-black rounded-t-3xl"
            style={{ marginTop: "auto" }}
          >
            {/* Header */}
            <View
              className="border-b border-gray flex-row items-center justify-between relative bg-primary/30"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(70),
                paddingHorizontal: s(20),
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (modalStep === "municipality") setModalStep("province");
                  else setModalStep(null);
                }}
                className="rounded-full bg-foreground/20 items-center justify-center"
                style={{ width: s(30), height: s(30) }}
              >
                <SVGIcons.Close className="w-8 h-8" />
              </TouchableOpacity>
              <View className="flex-row items-center justify-center">
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                >
                  {modalStep === "province"
                    ? "Seleziona la provincia"
                    : "Seleziona il comune"}
                </ScaledText>
              </View>
              <View style={{ height: mvs(30), width: mvs(30) }} />
            </View>

            {/* Search */}
            <View  style={{ paddingHorizontal: s(20),  paddingTop: mvs(16) }}>
              <View className="border border-gray rounded-full flex-row items-center">
                <View style={{ paddingLeft: s(16) }}>
                  <SVGIcons.Search className="w-5 h-5 mr-2" />
                </View>
                <ScaledTextInput
                  containerClassName="bg-background"
                  className="text-foreground"
                  style={{
                    backgroundColor: "transparent",
                  }}
                  placeholder={
                    modalStep === "province" ? "Cerca provincia" : "Cerca comune"
                  }
                  placeholderTextColor="#A49A99"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1"
              style={{
                paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)),
                paddingTop: mvs(16),
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Popular six for province step - only show when not searching */}
              {modalStep === "province" && topSix.length > 0 && !isSearching && (
                <View style={{ paddingBottom: mvs(16) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="lg"
                    className="text-gray font-neueBold mb-3 ml-1"
                    style={{ paddingHorizontal: s(20) }}
                  >
                    Popular cities
                  </ScaledText>
                  <View className="flex-row flex-wrap gap-[2px] bg-background">
                    {topSix.map((p) => {
                      const active =
                        selectedProvince?.id === p.id ||
                        formData.province === p.name;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            setSelectedProvince(p);
                            setSearch("");
                          }}
                          style={{
                            width: "32%",
                            overflow: "hidden",
                          }}
                          className="h-32"
                        >
                          {p.imageUrl ? (
                            <Image
                              source={{ uri: p.imageUrl }}
                              className="w-full h-[75%]"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-[70%] bg-gray/30" />
                          )}
                          <View
                            className={`h-[25%] flex items-center justify-center ${active ? "bg-primary" : "bg-background"}`}
                          >
                            <ScaledText
                              allowScaling={false}
                              variant="body2"
                              className="text-foreground text-center"
                            >
                              {p.name}
                            </ScaledText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* List */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-gray font-neueBold mb-3 ml-1"
                  style={{ paddingHorizontal: s(20) }}
                >
                  {isSearching
                    ? "Search results"
                    : modalStep === "province"
                      ? "Other provinces"
                      : `Comunes under ${selectedProvince?.name || formData.province || "Selected province"}`}
                </ScaledText>
                {listFiltered.length === 0 ? (
                  <View
                    style={{
                      paddingHorizontal: s(20),
                      paddingVertical: mvs(40),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-gray text-center"
                    >
                      No results found
                    </ScaledText>
                  </View>
                ) : (
                  listFiltered.map((item) => (
                    <Pressable
                      key={item.id}
                      className={`py-4 border-b border-gray/20 ${
                        formData.municipality === item.name &&
                        formData.province === selectedProvince?.name
                          ? "bg-primary"
                          : "bg-[#100C0C]"
                      }`}
                      onPress={() => {
                        if (modalStep === "province") {
                          setSelectedProvince(item);
                          setSearch("");
                        } else {
                          onChange(
                            selectedProvince?.name || formData.province,
                            item.name,
                            selectedProvince?.id ||
                              provinces.find((p) => p.name === formData.province)
                                ?.id ||
                              "",
                            item.id
                          );
                          setModalStep(null);
                          setSearch("");
                        }
                      }}
                    >
                      <View className="flex-row items-center gap-3 px-6">
                        <ScaledText
                          allowScaling={false}
                          variant="body2"
                          className="text-foreground"
                        >
                          {item.name}
                        </ScaledText>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </ScrollView>

            {/* Footer actions */}
            <View
              className="flex-row justify-between absolute left-0 right-0 bg-background border-t border-gray/20"
              style={{
                paddingHorizontal: s(20),
                paddingTop: mvs(16),
                paddingBottom: Math.max(insets.bottom, mvs(20)),
                bottom: 0,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (modalStep === "municipality") setModalStep("province");
                  else setModalStep(null);
                }}
                className="rounded-full border border-foreground items-center flex-row gap-3"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground"
                >
                  Back
                </ScaledText>
              </TouchableOpacity>
              {modalStep === "province" ? (
                <TouchableOpacity
                  onPress={() => {
                    if (selectedProvince) {
                      setModalStep("municipality");
                      setSearch("");
                    }
                  }}
                  className={`rounded-full items-center flex-row gap-3 ${
                    selectedProvince ? "bg-primary" : "bg-gray/40"
                  }`}
                  style={{
                    paddingVertical: mvs(10.5),
                    paddingLeft: s(18),
                    paddingRight: s(20),
                  }}
                  disabled={!selectedProvince}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground"
                  >
                    Next
                  </ScaledText>
                  <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                </TouchableOpacity>
              ) : (
                <View />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

