import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useSearchStore } from "@/stores/searchStore";
import { mvs, s } from "@/utils/scale";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationPicker from "../shared/LocationPicker";
import ServiceFilter from "./ServiceFilter";
import StyleFilter from "./StyleFilter";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function FilterModal({ visible, onClose }: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const { filters, updateFilters, locationDisplay, setLocation, search } =
    useSearchStore();

  const [tempFilters, setTempFilters] = useState(filters);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempFilters(filters);
    }
  }, [visible, filters]);

  const handleStyleChange = (styleIds: string[]) => {
    setTempFilters((prev) => ({ ...prev, styleIds }));
  };

  const handleServiceChange = (serviceIds: string[]) => {
    setTempFilters((prev) => ({ ...prev, serviceIds }));
  };

  const handleLocationSelect = (data: {
    province: string;
    provinceId: string;
    municipality: string;
    municipalityId: string;
  }) => {
    setTempFilters((prev) => ({
      ...prev,
      provinceId: data.provinceId,
      municipalityId: data.municipalityId,
    }));
    setLocation(data.province, data.municipality);
  };

  const handleResetAll = () => {
    setTempFilters({
      styleIds: [],
      serviceIds: [],
      provinceId: null,
      municipalityId: null,
    });
    setLocation("", "");
  };

  const handleResetStyle = () => {
    setTempFilters((prev) => ({ ...prev, styleIds: [] }));
  };

  const handleResetService = () => {
    setTempFilters((prev) => ({ ...prev, serviceIds: [] }));
  };

  const handleApply = () => {
    updateFilters(tempFilters);
    search();
    onClose();
  };

  const hasActiveFilters =
    tempFilters.styleIds.length > 0 ||
    tempFilters.serviceIds.length > 0 ||
    tempFilters.provinceId !== null ||
    tempFilters.municipalityId !== null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-background/50">
          <View
            className="bg-background border border-gray rounded-t-2xl"
            style={{
              marginTop: "auto",
              paddingBottom: Math.max(insets.bottom, mvs(20)),
            }}
          >
            {/* Handle */}
            <View
              className="items-center"
              style={{ paddingTop: mvs(12), paddingBottom: mvs(8) }}
            >
              <View
                className="bg-gray rounded-lg"
                style={{ width: s(30), height: mvs(4) }}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: s(20),
                paddingBottom: mvs(24),
              }}
            >
              {/* Style Filter Section */}
              <View style={{ marginBottom: mvs(24) }}>
                <View
                  className="flex-row items-center justify-between"
                  style={{ marginBottom: mvs(16) }}
                >
                  <View className="flex-row items-center gap-2">
                    <SVGIcons.EditBrush width={s(14)} height={s(14)} />
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-white font-montserratSemiBold"
                    >
                      Filtra per stile
                    </ScaledText>
                  </View>
                  <TouchableOpacity onPress={handleResetStyle}>
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-gray font-neueLight"
                    >
                      Reset
                    </ScaledText>
                  </TouchableOpacity>
                </View>
                <StyleFilter
                  selectedIds={tempFilters.styleIds}
                  onSelectionChange={handleStyleChange}
                />
              </View>

              {/* Divider */}
              <View
                className="bg-gray"
                style={{ height: s(0.5), marginBottom: mvs(24) }}
              />

              {/* Service Filter Section */}
              <View style={{ marginBottom: mvs(24) }}>
                <View
                  className="flex-row items-center justify-between"
                  style={{ marginBottom: mvs(16) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-white font-montserratSemiBold"
                  >
                    Filtra per servizio
                  </ScaledText>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleResetService}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-gray font-neueLight"
                    >
                      Reset
                    </ScaledText>
                  </TouchableOpacity>
                </View>
                <ServiceFilter
                  selectedIds={tempFilters.serviceIds}
                  onSelectionChange={handleServiceChange}
                />
              </View>

              {/* Divider */}
              <View
                className="bg-gray"
                style={{ height: s(0.5), marginBottom: mvs(24) }}
              />

              {/* Location Section */}
              <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="body2"
                  className="text-white font-montserratSemiBold"
                  style={{ marginBottom: mvs(16) }}
                >
                  Filtra per posizione
                </ScaledText>
                <TouchableOpacity
                  onPress={() => setShowLocationPicker(true)}
                  className="bg-tat-foreground border border-gray rounded-lg flex-row items-center justify-between"
                  style={{
                    paddingVertical: mvs(12),
                    paddingHorizontal: s(16),
                    borderWidth: s(1),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className={`font-montserratSemiBold text-foreground`}
                  >
                    {locationDisplay
                      ? `${locationDisplay.province}, ${locationDisplay.municipality}`
                      : "Seleziona posizione"}
                  </ScaledText>
                  <SVGIcons.Location width={s(18)} height={s(18)} />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={handleResetAll}
                  className="flex-1 border border-white rounded-full items-center justify-center"
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-white font-neueMedium"
                  >
                    Reset
                  </ScaledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApply}
                  className={`flex-1 rounded-full items-center justify-center ${
                    hasActiveFilters ? "bg-primary" : "bg-primary/50"
                  }`}
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-white font-neueMedium"
                  >
                    Apply Filters
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationSelect}
        initialProvinceId={tempFilters.provinceId}
        initialMunicipalityId={tempFilters.municipalityId}
      />
    </>
  );
}
