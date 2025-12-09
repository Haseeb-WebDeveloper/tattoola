import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useSearchStore } from "@/stores/searchStore";
import { mvs, s } from "@/utils/scale";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
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
  const { filters, updateFilters, search } = useSearchStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [tempFilters, setTempFilters] = useState(filters);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationNames, setLocationNames] = useState<{
    province: string;
    municipality: string;
  } | null>(null);
  const isShowingLocationPickerRef = useRef(false);

  // Snap points for the bottom sheet (90% of screen height)
  const snapPoints = useMemo(() => ["90%"], []);

  // Open/close bottom sheet based on visible prop
  useEffect(() => {
    if (visible) {
      setTempFilters(filters);
      // Get location names from store if they exist
      const { locationDisplay } = useSearchStore.getState();
      if (locationDisplay && filters.provinceId && filters.municipalityId) {
        setLocationNames(locationDisplay);
      } else {
        setLocationNames(null);
      }
      // Open bottom sheet modal
      requestAnimationFrame(() => {
        bottomSheetRef.current?.present();
      });
    } else {
      // Close bottom sheet modal
      bottomSheetRef.current?.dismiss();
      // Reset state when parent closes modal
      setShowLocationPicker(false);
      isShowingLocationPickerRef.current = false;
    }
  }, [visible, filters]);

  // Handle bottom sheet dismiss (called when modal is fully dismissed)
  const handleSheetDismiss = useCallback(() => {
    // Don't call onClose if we're showing location picker
    // The location picker will handle reopening the sheet
    if (!isShowingLocationPickerRef.current) {
      onClose();
    }
  }, [onClose]);

  // Handle sheet changes
  const handleSheetChange = useCallback((index: number) => {
    // This is called during animation, not when fully dismissed
    // We don't need to do anything here for dismissal
  }, []);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

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
    setLocationNames({
      province: data.province,
      municipality: data.municipality,
    });
    setShowLocationPicker(false);
  };
  const handleResetAll = () => {
    setTempFilters({
      styleIds: [],
      serviceIds: [],
      provinceId: null,
      municipalityId: null,
    });
    setLocationNames(null);
  };

  const handleResetStyle = () => {
    setTempFilters((prev) => ({ ...prev, styleIds: [] }));
  };

  const handleResetService = () => {
    setTempFilters((prev) => ({ ...prev, serviceIds: [] }));
  };

  const handleResetLocation = () => {
    setTempFilters((prev) => ({
      ...prev,
      provinceId: null,
      municipalityId: null,
    }));
    setLocationNames(null);
  };

  const handleApply = () => {
    // Update filters and location display
    updateFilters(tempFilters);

    // Update location display in search store (without triggering search)
    if (locationNames && tempFilters.provinceId && tempFilters.municipalityId) {
      // Set location display without triggering search
      useSearchStore.setState({ locationDisplay: locationNames });
    } else {
      // Clear location display without triggering search
      useSearchStore.setState({ locationDisplay: null });
    }

    // Trigger search
    search();
    
    // Close bottom sheet modal
    // handleSheetDismiss will call onClose() to sync parent state
    bottomSheetRef.current?.dismiss();
  };

  const hasActiveFilters =
    tempFilters.styleIds.length > 0 ||
    tempFilters.serviceIds.length > 0 ||
    tempFilters.provinceId !== null ||
    tempFilters.municipalityId !== null;

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        onDismiss={handleSheetDismiss}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: "#100C0C",
          borderTopWidth: s(1),
          borderLeftWidth: s(1),
          borderRightWidth: s(1),
          borderColor: "#908D8F",
          borderTopLeftRadius: s(24),
          borderTopRightRadius: s(24),
        }}
        handleIndicatorStyle={{
          backgroundColor: "#908D8F",
          width: s(30),
          height: mvs(4),
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: s(20),
            paddingBottom: Math.max(insets.bottom, mvs(20)) + mvs(24),
            paddingTop: mvs(10),
          }}
          keyboardShouldPersistTaps="handled"
        >
              {/* Style Filter Section */}
              <View style={{ marginBottom: mvs(18) }}>
                <View
                  className="flex-row items-center justify-between"
                  style={{ marginBottom: mvs(10) }}
                >
                  <View className="flex-row items-center gap-2">
                    <SVGIcons.EditBrush width={s(14)} height={s(14)} />
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-montserratSemibold"
                    >
                      Filtra per stile
                    </ScaledText>
                  </View>
                  <TouchableOpacity onPress={handleResetStyle}>
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-gray font-neueLight"
                    >
                      Reimposta
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
              <View style={{ marginBottom: mvs(18) }}>
                <View
                  className="flex-row items-center justify-between"
                  style={{ marginBottom: mvs(10) }}
                >
                  <View className="flex-row items-center gap-2">
                    <SVGIcons.MagicStick width={s(14)} height={s(14)} />
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-montserratSemibold"
                    >
                      Filtra per servizio
                    </ScaledText>
                  </View>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleResetService}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-gray font-neueLight"
                    >
                      Reimposta
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
                style={{ height: s(0.5), marginBottom: mvs(20) }}
              />

              {/* Location Filter Section */}
              <View style={{ marginBottom: mvs(18) }}>
                <View
                  className="flex-row items-center justify-between"
                  style={{ marginBottom: mvs(10) }}
                >
                  <View className="flex-row items-center gap-2">
                    <SVGIcons.Location width={s(14)} height={s(14)} />
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-montserratSemibold"
                    >
                      Filtra per provincia
                    </ScaledText>
                  </View>
                  {(tempFilters.provinceId || tempFilters.municipalityId) && (
                    <TouchableOpacity onPress={handleResetLocation}>
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="text-gray font-neueLight"
                      >
                        Reimposta
                      </ScaledText>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {
                    // Set flag before dismissing to prevent onClose from being called
                    isShowingLocationPickerRef.current = true;
                    // Dismiss bottom sheet first to avoid modal conflicts
                    bottomSheetRef.current?.dismiss();
                    // Show location picker after a short delay
                    setTimeout(() => {
                      setShowLocationPicker(true);
                    }, 300);
                  }}
                  className="flex-row items-center justify-between bg-tat-foreground border-gray"
                  style={{
                    paddingVertical: mvs(10),
                    paddingHorizontal: s(16),
                    borderWidth: s(1),
                    borderRadius: s(8),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-gray font-montserratMedium"
                  >
                    {locationNames &&
                    tempFilters.provinceId &&
                    tempFilters.municipalityId
                      ? `${locationNames.municipality}, ${locationNames.province}`
                      : "Seleziona posizione"}
                  </ScaledText>
                  <SVGIcons.ChevronDown width={s(14)} height={s(14)} />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-4" style={{ marginTop: mvs(12) }}>
                <TouchableOpacity
                  onPress={handleResetAll}
                  className="items-center justify-center flex-1 border rounded-full border-gray"
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                  >
                    Reimposta
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
                    variant="md"
                    className="text-white font-neueSemibold"
                  >
                    Applica filtri
                  </ScaledText>
                </TouchableOpacity>
              </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => {
          setShowLocationPicker(false);
          // Reset flag
          isShowingLocationPickerRef.current = false;
          // Reopen filter modal if it should still be visible
          if (visible) {
            setTimeout(() => {
              bottomSheetRef.current?.present();
            }, 100);
          }
        }}
        onSelect={handleLocationSelect}
        initialProvinceId={tempFilters.provinceId}
        initialMunicipalityId={tempFilters.municipalityId}
      />
    </>
  );
}
