import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useSearchStore } from "@/stores/searchStore";
import { mvs, s } from "@/utils/scale";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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

  const [tempFilters, setTempFilters] = useState(filters);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationNames, setLocationNames] = useState<{
    province: string;
    municipality: string;
  } | null>(null);
  const [internalVisible, setInternalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      setTempFilters(filters);
      // Get location names from store if they exist
      const { locationDisplay } = useSearchStore.getState();
      if (locationDisplay && filters.provinceId && filters.municipalityId) {
        setLocationNames(locationDisplay);
      } else {
        setLocationNames(null);
      }
    }
  }, [visible, filters]);

  // --- Animated sliding mechanics ---
  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(1)).current;
  const dragOffset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt, gestureState) => {
        // Only vertical gestures
        return true;
      },
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        dragOffset.current = 0;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        dragOffset.current = 0;
        if (gestureState.dy > 85) {
          // If dragged sufficiently downward, close the modal
          isClosingRef.current = true;
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 600,
              duration: 140,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 140,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Set internal visible to false first to hide the modal
            setInternalVisible(false);
            // Use setTimeout to ensure animation is fully complete before closing
            setTimeout(() => {
              isClosingRef.current = false;
              onClose();
            }, 50);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (internalVisible) {
      // Only reset when opening, not when closing
      if (!isClosingRef.current) {
        translateY.setValue(0);
        backdropOpacity.setValue(1);
      }
    } else {
      // Reset when modal is closed (for next open)
      isClosingRef.current = false;
      translateY.setValue(0);
      backdropOpacity.setValue(1);
    }
  }, [internalVisible, translateY, backdropOpacity]);

  // --- End animated sliding mechanics ---

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
    updateFilters(tempFilters);

    // Update location display in search store (without triggering search)
    if (locationNames && tempFilters.provinceId && tempFilters.municipalityId) {
      // Set location display without triggering search
      useSearchStore.setState({ locationDisplay: locationNames });
    } else {
      // Clear location display without triggering search
      useSearchStore.setState({ locationDisplay: null });
    }

    search();
    onClose();
  };

  const hasActiveFilters =
    tempFilters.styleIds.length > 0 ||
    tempFilters.serviceIds.length > 0 ||
    tempFilters.provinceId !== null ||
    tempFilters.municipalityId !== null;

  // Close on tap-outside
  const handleBackdropPress = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 600,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      setTimeout(() => {
        isClosingRef.current = false;
        onClose();
      }, 50);
    });
  };

  return (
    <>
      <Modal
        visible={internalVisible}
        transparent
        animationType="none"
        onRequestClose={handleBackdropPress}
      >
        <Animated.View
          className="flex-1"
          style={{
            backgroundColor: "rgba(24,18,18,0.5)",
            opacity: backdropOpacity,
          }}
        >
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View
              style={{
                flex: 1,
              }}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            className="bg-background"
            {...panResponder.panHandlers}
            style={{
              marginTop: "auto",
              transform: [{ translateY }],
              paddingBottom: Math.max(insets.bottom, mvs(20)),
              borderTopWidth: s(1),
              borderLeftWidth: s(1),
              borderRightWidth: s(1),
              borderColor: "#908D8F",
              borderRadius: s(24),
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
                      Filtra per posizione
                    </ScaledText>
                  </View>
                  {(tempFilters.provinceId || tempFilters.municipalityId) && (
                    <TouchableOpacity onPress={handleResetLocation}>
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="text-gray font-neueLight"
                      >
                        Reset
                      </ScaledText>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setShowLocationPicker(true)}
                  className="bg-tat-foreground border-gray flex-row items-center justify-between"
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
                  className="flex-1 border border-gray rounded-full items-center justify-center"
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
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
                    variant="md"
                    className="text-white font-neueSemibold"
                  >
                    Apply Filters
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
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
