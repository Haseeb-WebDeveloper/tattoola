import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import type { LocationFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Province = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

type Municipality = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

type SearchLocationPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (data: {
    province: string;
    provinceId: string;
    municipality: string;
    municipalityId: string;
  }) => void;
  initialProvinceId?: string | null;
  initialMunicipalityId?: string | null;
  facets?: LocationFacet[];
  allProvinces?: Array<{ id: string; name: string; imageUrl?: string | null }>;
  allMunicipalities?: Array<{ id: string; name: string; provinceId: string; imageUrl?: string | null }>;
  enabledLocationKeys?: Set<string>;
  onDisabledFilterPress?: () => void;
  isLoading?: boolean;
};

export default function SearchLocationPicker({
  visible,
  onClose,
  onSelect,
  initialProvinceId,
  initialMunicipalityId,
  facets = [],
  allProvinces = [],
  allMunicipalities = [],
  enabledLocationKeys = new Set(),
  onDisabledFilterPress,
  isLoading = false,
}: SearchLocationPickerProps) {
  const insets = useSafeAreaInsets();

  const [modalStep, setModalStep] = useState<"province" | "municipality">(
    "province"
  );
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<
    string | null
  >(null);

  // Load provinces - use allProvinces if provided, otherwise fetch from DB
  useEffect(() => {
    if (allProvinces.length > 0) {
      // Use provided all provinces (show all, not just data-driven)
      setProvinces(allProvinces);
    } else {
      // Fallback: fetch from DB if not provided
      (async () => {
        try {
          const { data, error } = await supabase
            .from("provinces")
            .select("id, name, imageUrl")
            .eq("isActive", true)
            .order("name");
          if (error) {
            console.error("📍 [LOCATION_PICKER] Error loading provinces:", error);
            setProvinces([]);
          } else {
            const provincesData = data || [];
            // If facets provided, filter to only show provinces that have facets
            // Otherwise show all provinces
            if (facets.length > 0) {
              const provincesWithFacets = provincesData.filter((province) => {
                return facets.some((f) => f.provinceId === province.id);
              });
              setProvinces(provincesWithFacets);
            } else {
              setProvinces(provincesData);
            }
          }
        } catch (err) {
          console.error("📍 [LOCATION_PICKER] Exception loading provinces:", err);
          setProvinces([]);
        }
      })();
    }
  }, [facets, allProvinces]);

  // Load municipalities when a province is selected - use allMunicipalities if provided
  useEffect(() => {
    if (modalStep === "municipality" && selectedProvince) {
      if (allMunicipalities.length > 0) {
        // Use provided all municipalities filtered by selected province
        const filteredMunicipalities = allMunicipalities.filter(
          (m) => m.provinceId === selectedProvince.id
        );
        setMunicipalities(filteredMunicipalities);
      } else {
        // Fallback: fetch from DB if not provided
        (async () => {
          try {
            const { data, error } = await supabase
              .from("municipalities")
              .select("id, name, imageUrl")
              .eq("provinceId", selectedProvince.id)
              .eq("isActive", true)
              .order("name");
            if (error) {
              setMunicipalities([]);
            } else {
              const municipalitiesData = data || [];
              // If facets provided, filter to only show municipalities that have facets
              // Otherwise show all municipalities
              if (facets.length > 0) {
                const municipalitiesWithFacets = municipalitiesData.filter((municipality) => {
                  return facets.some(
                    (f) =>
                      f.provinceId === selectedProvince.id &&
                      f.municipalityId === municipality.id
                  );
                });
                setMunicipalities(municipalitiesWithFacets);
              } else {
                setMunicipalities(municipalitiesData);
              }
            }
          } catch (err) {
            setMunicipalities([]);
          }
        })();
      }
    }
  }, [modalStep, selectedProvince, facets, allMunicipalities]);

  // Load initial data if provided
  useEffect(() => {
    if (visible && initialProvinceId && provinces.length > 0) {
      const province = provinces.find((p) => p.id === initialProvinceId);
      if (province) {
        setSelectedProvince(province);
      }
    }
  }, [visible, initialProvinceId, provinces]);

  // Preselect municipality when provided (used for highlighting)
  useEffect(() => {
    if (visible && initialMunicipalityId) {
      setSelectedMunicipalityId(initialMunicipalityId);
    }
  }, [visible, initialMunicipalityId]);

  const handleMunicipalitySelect = (municipality: Municipality) => {
    if (selectedProvince) {
      // Check if location is enabled (data-driven)
      const locationKey = `${selectedProvince.id}::${municipality.id}`;
      if (enabledLocationKeys.size > 0 && !enabledLocationKeys.has(locationKey)) {
        console.log("Location is disabled", locationKey);
        // Location is disabled, show toast and prevent selection
        toast.info("Questo filtro non si adatta ai tuoi filtri attuali");
        onDisabledFilterPress?.();
        return;
      }

      setSelectedMunicipalityId(municipality.id);
      onSelect({
        province: selectedProvince.name,
        provinceId: selectedProvince.id,
        municipality: municipality.name,
        municipalityId: municipality.id,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setModalStep("province");
    setSearch("");
    setSelectedProvince(null);
    setSelectedMunicipalityId(null);
    onClose();
  };

  const handleBack = () => {
    if (modalStep === "municipality") {
      setModalStep("province");
      setSearch("");
    } else {
      handleClose();
    }
  };

  const topSix = provinces.slice(0, 6);
  const topSixIds = new Set(topSix.map((p) => p.id));
  const isSearching = search.trim().length > 0;

  const listFiltered = (modalStep === "province" ? provinces : municipalities)
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((r) =>
      modalStep === "province" && !isSearching ? !topSixIds.has(r.id) : true
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : undefined}
    >
      <View className="flex-1 bg-black/50">
        <View
          className="flex-1 bg-black rounded-t-3xl"
          style={{ marginTop: "auto" }}
        >
          {/* Header */}
          <View
            className="relative flex-row items-center justify-between border-b border-gray bg-primary/30"
            style={{
              paddingBottom: mvs(15),
              paddingTop: mvs(50),
              paddingHorizontal: s(20),
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              className="items-center justify-center rounded-full bg-foreground/20"
              style={{ width: s(30), height: s(30) }}
            >
              <SVGIcons.Close width={s(12)} height={s(12)} />
            </TouchableOpacity>
            <View className="flex-row items-center justify-center">
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueSemibold"
              >
                {modalStep === "province"
                  ? "Seleziona la provincia"
                  : "Seleziona il comune"}
              </ScaledText>
            </View>
            <View style={{ height: mvs(30), width: mvs(30) }} />
          </View>

          {/* Search */}
          <View style={{ paddingHorizontal: s(20), paddingTop: mvs(16) }}>
            <View className="flex-row items-center border rounded-full border-gray bg-tat-foreground">
              <View style={{ paddingLeft: s(12) }}>
                <SVGIcons.Search width={s(20)} height={s(20)} />
              </View>
              <ScaledTextInput
                containerClassName="bg-background flex-1 rounded-full"
                containerStyle={{
                  borderRadius: s(50),
                }}
                className="text-foreground"
                style={{
                  backgroundColor: "transparent",
                  fontFamily: "NeueHaasDisplay-Light",
                  fontSize: s(12),
                }}
                placeholder={
                  modalStep === "province" ? "Cerca provincia" : "Cerca comune"
                }
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
              paddingTop: mvs(20),
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Popular six for province step - only show when not searching */}
            {modalStep === "province" && topSix.length > 0 && !isSearching && (
              <View style={{ paddingBottom: mvs(16) }}>
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-gray font-neueSemibold"
                  style={{ paddingHorizontal: s(20), paddingBottom: mvs(6) }}
                >
                  Città più popolari
                </ScaledText>
                <View
                  className="flex-row flex-wrap bg-background"
                  style={{ gap: s(1) }}
                >
                  {topSix.map((p) => {
                    const active = selectedProvince?.id === p.id;
                    // Check if province has at least one enabled location
                    const hasEnabledLocation = Array.from(enabledLocationKeys).some(key => 
                      key.startsWith(`${p.id}::`)
                    );
                    const isEnabled = enabledLocationKeys.size === 0 || hasEnabledLocation;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          if (!isEnabled) {
                            console.log("Province is disabled", p.id);
                            toast.info("Questo filtro non si adatta ai tuoi filtri attuali");
                            onDisabledFilterPress?.();
                            return;
                          }
                          setSelectedProvince(p);
                          setSearch("");
                        }}
                        style={{
                          width: "32%",
                          overflow: "hidden",
                          height: mvs(90),
                          opacity: isEnabled ? 1 : 0.5,
                        }}
                        disabled={!isEnabled}
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
                            variant="11"
                            className="text-center text-foreground font-neueLight"
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
                className="text-gray font-neueSemibold"
                style={{ paddingHorizontal: s(20), paddingBottom: mvs(6) }}
              >
                {isSearching
                  ? "Risultati della ricerca"
                  : modalStep === "province"
                    ? "Altre province"
                    : `Comuni in ${selectedProvince?.name || "provincia selezionata"}`}
              </ScaledText>
              {isLoading ? (
                <View
                  style={{
                    paddingHorizontal: s(20),
                    paddingVertical: mvs(40),
                  }}
                >
                  <ActivityIndicator size="small" color="#AE0E0E" />
                </View>
              ) : listFiltered.length === 0 ? (
                <View
                  style={{
                    paddingHorizontal: s(20),
                    paddingVertical: mvs(40),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="lg"
                    className="text-center text-gray font-neueLight"
                  >
                    Nessun risultato trovato
                  </ScaledText>
                </View>
              ) : (
                listFiltered.map((item) => {
                  const isActive =
                    modalStep === "province"
                      ? selectedProvince?.id === item.id
                      : selectedMunicipalityId === item.id;
                  
                  // Check if location is enabled
                  let isEnabled = true;
                  if (modalStep === "province") {
                    // Check if province has at least one enabled location
                    const hasEnabledLocation = Array.from(enabledLocationKeys).some(key => 
                      key.startsWith(`${item.id}::`)
                    );
                    isEnabled = enabledLocationKeys.size === 0 || hasEnabledLocation;
                  } else {
                    // Check if municipality location is enabled
                    if (selectedProvince) {
                      const locationKey = `${selectedProvince.id}::${item.id}`;
                      isEnabled = enabledLocationKeys.size === 0 || enabledLocationKeys.has(locationKey);
                    }
                  }

                  return (
                    <Pressable
                      key={item.id}
                      className={`py-4 border-b border-gray/20 ${isActive ? "bg-primary" : "bg-[#100C0C]"}`}
                      style={{
                        opacity: isEnabled ? 1 : 0.5,
                      }}
                      onPress={() => {
                        if (!isEnabled) {
                          console.log("Municipality is disabled", item.id);
                          toast.info("Questo filtro non si adatta ai tuoi filtri attuali");
                          onDisabledFilterPress?.();
                          return;
                        }
                        if (modalStep === "province") {
                          setSelectedProvince(item);
                          setSelectedMunicipalityId(null);
                          setSearch("");
                        } else {
                          setSelectedMunicipalityId(item.id);
                          handleMunicipalitySelect(item);
                        }
                      }}
                      disabled={!isEnabled}
                    >
                      <View className="flex-row items-center gap-3 px-6">
                        <View className="flex-1">
                          <ScaledText
                            allowScaling={false}
                            variant="md"
                            className="text-foreground font-montserratLight"
                          >
                            {item.name}
                          </ScaledText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View
            className="absolute left-0 right-0 flex-row justify-between border-t bg-background border-gray/20"
            style={{
              paddingHorizontal: s(20),
              paddingTop: mvs(16),
              paddingBottom: Math.max(insets.bottom, mvs(20)),
              bottom: 0,
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              className="flex-row items-center gap-3 border rounded-full border-foreground"
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
                className="text-foreground font-neueSemibold"
              >
                Indietro
              </ScaledText>
            </TouchableOpacity>
            {modalStep === "province" ? (
              <TouchableOpacity
                onPress={() => {
                  if (selectedProvince) {
                    // Check if province has at least one enabled location
                    const hasEnabledLocation = Array.from(enabledLocationKeys).some(key => 
                      key.startsWith(`${selectedProvince.id}::`)
                    );
                    if (enabledLocationKeys.size > 0 && !hasEnabledLocation) {
                      console.log("Province is disabled", selectedProvince.id);
                      toast.info("Questo filtro non si adatta ai tuoi filtri attuali");
                      onDisabledFilterPress?.();
                      return;
                    }
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
                  className="text-foreground font-neueSemibold"
                >
                  Avanti
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
  );
}
