import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
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

type LocationPickerProps = {
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
};

export default function LocationPicker({
  visible,
  onClose,
  onSelect,
  initialProvinceId,
  initialMunicipalityId,
}: LocationPickerProps) {
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
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string | null>(
    null
  );

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

  // Load municipalities when a province is selected
  useEffect(() => {
    (async () => {
      if (modalStep === "municipality" && selectedProvince) {
        const { data, error } = await supabase
          .from("municipalities")
          .select("id, name, imageUrl")
          .eq("provinceId", selectedProvince.id)
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
  }, [modalStep, selectedProvince]);

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
              paddingBottom: mvs(15),
              paddingTop: mvs(50),
              paddingHorizontal: s(20),
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              className="rounded-full bg-foreground/20 items-center justify-center"
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
            <View className="border border-gray rounded-full flex-row items-center">
              <View style={{ paddingLeft: s(12) }}>
                <SVGIcons.Search width={s(20)} height={s(20)} />
              </View>
              <ScaledTextInput
                containerClassName="bg-background"
                className="text-foreground"
                style={{
                  backgroundColor: "transparent",
                  fontSize: s(14),
                  lineHeight: mvs(23),
                  fontFamily: "NeueHaasDisplay-Light",
                  paddingVertical: mvs(6),
                  paddingHorizontal: s(12),
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
                  Popular cities
                </ScaledText>
                <View className="flex-row flex-wrap gap-[2px] bg-background">
                  {topSix.map((p) => {
                    const active = selectedProvince?.id === p.id;
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
                            variant="11"
                            className="text-foreground text-center font-neueLight"
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
                style={{ paddingHorizontal: s(20),  paddingBottom: mvs(6) }}
              >
                {isSearching
                  ? "Search results"
                  : modalStep === "province"
                    ? "Other provinces"
                    : `Comunes under ${selectedProvince?.name || "Selected province"}`}
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
                    variant="lg"
                    className="text-gray text-center font-neueLight"
                  >
                    No results found
                  </ScaledText>
                </View>
              ) : (
                listFiltered.map((item) => {
                  const isActive =
                    modalStep === "province"
                      ? selectedProvince?.id === item.id
                      : selectedMunicipalityId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      className={`py-4 border-b border-gray/20 ${isActive ? "bg-primary" : "bg-[#100C0C]"}`}
                      onPress={() => {
                      if (modalStep === "province") {
                          setSelectedProvince(item);
                          setSelectedMunicipalityId(null);
                          setSearch("");
                        } else {
                          setSelectedMunicipalityId(item.id);
                          handleMunicipalitySelect(item);
                        }
                      }}
                    >
                      <View className="flex-row items-center gap-3 px-6">
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-foreground font-montserratLight"
                        >
                          {item.name}
                        </ScaledText>
                      </View>
                    </Pressable>
                  );
                })
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
              onPress={handleBack}
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
                className="text-foreground font-neueSemibold"
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
                  className="text-foreground font-neueSemibold"
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
  );
}

