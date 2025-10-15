import AuthStepHeader from "@/components/ui/auth-step-header";
import { SVGIcons } from "@/constants/svg";
import { useUserRegistrationStore } from "@/stores";
import type { FormErrors, UserV2Step4 } from "@/types/auth";
import { supabase } from "@/utils/supabase";
import { UserStep4ValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function UserRegistrationStep4() {
  const { step2, updateStep, setErrors, clearErrors, setCurrentStep } =
    useUserRegistrationStore();

  const [formData, setFormData] = useState<UserV2Step4>({
    province: "",
    municipality: "",
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [showModal, setShowModal] = useState<
    null | "province" | "municipality"
  >(null);
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

  // Load existing data if available
  useEffect(() => {
    if (step2 && Object.keys(step2).length > 0) {
      setFormData(step2 as UserV2Step4);
    }
  }, [step2]);

  // Load provinces on mount (for modal selections)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("id, name, imageUrl")
        .eq("isActive", true)
        .order("name");
      if (error) {
        setProvinces([
          { id: "1", name: "AGRIGENTO" },
          { id: "2", name: "PALERMO" },
          { id: "3", name: "CATANIA" },
          { id: "4", name: "MESSINA" },
          { id: "5", name: "SIRACUSA" },
          { id: "6", name: "TRAPANI" },
        ]);
      } else {
        setProvinces(data || []);
      }
    })();
  }, []);

  // Load municipalities when a province is selected in modal
  useEffect(() => {
    (async () => {
      if (
        showModal === "municipality" &&
        (selectedProvince || formData.province)
      ) {
        const provinceId = selectedProvince?.id || provinces.find((p) => p.name === formData.province)?.id;
        const { data, error } = await supabase
          .from("municipalities")
          .select("id, name, imageUrl")
          .eq("provinceId", provinceId)
          .eq("isActive", true)
          .order("name");
        if (error) {
          const mocks = [
            { id: "1", name: "Aragona" },
            { id: "2", name: "Agrigento" },
            { id: "3", name: "Palermo" },
            { id: "4", name: "Catania" },
          ];
          setMunicipalities(mocks);
        } else {
          setMunicipalities(data || []);
        }
      }
    })();
  }, [showModal, selectedProvince, formData.province]);

  // Note: data loaders are inlined in useEffects above to match the artist UI flow

  const handleInputChange = (field: keyof UserV2Step4, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setLocalErrors((prev) => ({ ...prev, [field]: "" }));
      clearErrors();
    }
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(
      formData,
      UserStep4ValidationSchema
    );
    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in Zustand store
    updateStep("step4", formData);
    setCurrentStep(3);
    router.push("/(auth)/user-registration/step-5");
  };

  const handleBack = () => {
    router.back();
  };

  const handleProvinceConfirm = () => {
    if (selectedProvince) {
      setFormData((prev) => ({
        ...prev,
        province: selectedProvince.name,
        municipality: "",
      }));
      setShowModal("municipality");
      setSearch("");
    }
  };

  const handleMunicipalitySelect = (municipality: any) => {
    setFormData((prev) => ({ ...prev, municipality: municipality.name }));
    setShowModal(null);
    setSearch("");
  };

  return (
    <View className="flex-1 bg-background relative">
      <View className="flex-1">
        {/* Header */}
        <AuthStepHeader />

        {/* Progress */}
        <View className="items-center mb-4 mt-8">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <View
                key={idx}
                className={`${idx < 4 ? (idx === 3 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mb-8 flex-row gap-2 items-center justify-center">
          <SVGIcons.Studio width={22} height={22} />
          <Text className="text-foreground section-title font-neueBold">
            Where are you located?
          </Text>
        </View>

        {/* Province & Municipality (artist-style) */}
        <View className="px-6 gap-6">
          <View>
            <Text className="mb-2 label">
              Province<Text className="text-error">*</Text>
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setShowModal("province");
                setSearch("");
              }}
              className="rounded-xl border border-gray bg-[#100C0C] px-4 py-3"
            >
              <Text
                className={
                  formData.province ? "text-foreground" : "text-[#A49A99]"
                }
              >
                {formData.province || "Select Province"}
              </Text>
            </TouchableOpacity>
            {!!errors.province && (
              <Text className="text-xs text-error mt-1">{errors.province}</Text>
            )}
          </View>

          <View>
            <Text className="mb-2 label">
              Municipality/Comune<Text className="text-error">*</Text>
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={!formData.province}
              onPress={() => {
                if (formData.province) {
                  const p = provinces.find((px) => px.name === formData.province) || null;
                  setSelectedProvince(p);
                  setShowModal("municipality");
                  setSearch("");
                }
              }}
              className={`rounded-xl border px-4 py-3 ${formData.province ? "border-gray bg-[#100C0C]" : "border-gray bg-[#0F0F0F]/40"}`}
            >
              <Text
                className={
                  formData.municipality ? "text-foreground" : "text-[#A49A99]"
                }
              >
                {formData.municipality || "Select Municipality"}
              </Text>
            </TouchableOpacity>
            {!!errors.municipality && (
              <Text className="text-xs text-error mt-1">
                {errors.municipality}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-between px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
          <TouchableOpacity
            onPress={handleBack}
            className="rounded-full border border-foreground px-6 py-4"
          >
            <Text className="text-foreground">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            className="rounded-full bg-primary px-8 py-4"
          >
            <Text className="text-foreground">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selection Modal */}
      <Modal
        visible={!!showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(null)}
      >
        <View className="flex-1 justify-end">
          <View className="w-full bg-black rounded-t-3xl h-[100vh]">
            {/* Header */}
            <View className="px-6 pb-6 pt-20 border-b border-gray flex-row items-center justify-between relative bg-primary/30">
              <TouchableOpacity
                onPress={() => {
                  if (showModal === "municipality") setShowModal("province");
                  else setShowModal(null);
                }}
                className="absolute left-6 top-20 w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
              >
                <SVGIcons.Close className="w-8 h-8" />
              </TouchableOpacity>
              <View className="flex-row items-center justify-center w-full">
                <Text className="text-foreground text-lg font-neueBold tat-body-1">
                  {showModal === "province"
                    ? "Seleziona la provincia"
                    : "Seleziona il comune"}
                </Text>
              </View>
            </View>

            {/* Search */}
            <View className="pt-8 mb-28 relative">
              <View className="mx-6 border border-gray py-0.5 px-4 mb-8 rounded-full flex-row items-center">
                <SVGIcons.Search className="w-5 h-5 mr-2" />
                <TextInput
                  className="text-foreground flex-1"
                  placeholder={
                    showModal === "province"
                      ? "Cerca provincia"
                      : "Cerca comune"
                  }
                  placeholderTextColor="#A49A99"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {/* Popular Six (when province step) */}
              {showModal === "province" && provinces.slice(0, 6).length > 0 && (
                <View className="mb-6">
                  <Text className="px-6 text-lg font-semibold text-gray tat-body-1 mb-3 ml-1">
                    Popular cities
                  </Text>
                  <View className="flex-row flex-wrap gap-[2px] bg-background">
                    {provinces.slice(0, 6).map((p) => {
                      const active =
                        selectedProvince?.id === p.id ||
                        formData.province === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            setSelectedProvince(p);
                            setSearch("");
                          }}
                          style={{ width: "32%", overflow: "hidden" }}
                          className="h-32"
                        >
                          {p.imageUrl ? (
                            <View className="w-full h-[75%] bg-gray/20" />
                          ) : (
                            <View className="w-full h-[70%] bg-gray/30" />
                          )}
                          <View
                            className={`h-[25%] flex items-center justify-center ${active ? "bg-primary" : "bg-background"}`}
                          >
                            <Text className="text-foreground text-center text-[11px]">
                              {p.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* List */}
              <View>
                <Text className="px-6 mb-2 tat-body-1 text-gray font-semibold">
                  {showModal === "province"
                    ? "Other provinces"
                    : `Comunes under ${selectedProvince?.name || formData.province || "Roma"}`}
                </Text>
                <ScrollView style={{ maxHeight: 360 }}>
                  {(showModal === "province" ? provinces : municipalities)
                    .filter((r) =>
                      r.name.toLowerCase().includes(search.trim().toLowerCase())
                    )
                    .map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        className={`py-4 border-b border-gray/20 ${showModal === "municipality" && formData.municipality === item.name ? "bg-primary" : "bg-[#100C0C]"}`}
                        onPress={() => {
                          if (showModal === "province") {
                            setSelectedProvince(item);
                          } else {
                            handleMunicipalitySelect(item);
                          }
                        }}
                      >
                        <View className="flex-row items-center gap-3 px-6 tat-body-2-light">
                          <Text className="text-foreground">{item.name}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>

              {/* Modal footer actions */}
              <View className="absolute top-[75vh] left-0 right-0 px-6 pt-4 pb-10 bg-background/90 blur-sm backdrop-blur-xl flex-row justify-between">
                <TouchableOpacity
                  onPress={() => {
                    if (showModal === "municipality") setShowModal("province");
                    else setShowModal(null);
                  }}
                  className="rounded-full border border-foreground px-6 py-3"
                >
                  <Text className="text-foreground">Back</Text>
                </TouchableOpacity>
                {showModal === "province" ? (
                  <TouchableOpacity
                    onPress={handleProvinceConfirm}
                    className={`rounded-full px-8 py-3 ${selectedProvince ? "bg-primary" : "bg-gray/40"}`}
                    disabled={!selectedProvince}
                  >
                    <Text className="text-foreground">Next</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
