import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { getFacets } from "@/services/facet.service";
import { useSearchStore } from "@/stores/searchStore";
import type { Facets } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchLocationPicker from "../shared/SearchLocationPicker";
import ServiceFilter from "./ServiceFilter";
import StyleFilter from "./StyleFilter";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function FilterModal({ visible, onClose }: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const { filters, updateFilters, search, activeTab, facets } =
    useSearchStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [tempFilters, setTempFilters] = useState(filters);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationNames, setLocationNames] = useState<{
    province: string;
    municipality: string;
  } | null>(null);
  const [tempFacets, setTempFacets] = useState<Facets | null>(null);
  // Separate loading states for each filter type
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const isShowingLocationPickerRef = useRef(false);
  // Track pending filter changes for rapid selections
  const pendingFilterChangeRef = useRef<
    "style" | "service" | "location" | null
  >(null);
  const isLoadingRef = useRef(false);

  // Snap points for the bottom sheet (90% of screen height)
  const snapPoints = useMemo(() => ["80%"], []);

  // Load facets when modal opens
  useEffect(() => {
    if (visible) {
      setTempFilters(filters);
      setTempFacets(facets);
      // Get location names from store if they exist
      const { locationDisplay } = useSearchStore.getState();
      if (locationDisplay && filters.provinceId && filters.municipalityId) {
        setLocationNames(locationDisplay);
      } else {
        setLocationNames(null);
      }
      // Load initial facets (no changedFilterType = all loading)
      loadFacetsForFilters(filters);
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
      // Reset loading states
      setIsLoadingStyles(false);
      setIsLoadingServices(false);
      setIsLoadingLocations(false);
      isLoadingRef.current = false;
      pendingFilterChangeRef.current = null;
    }
  }, [visible, filters]);

  // Track previous activeTab to detect changes
  const prevActiveTabRef = useRef(activeTab);

  // Reload facets immediately when activeTab changes (no debounce)
  useEffect(() => {
    if (!visible) return;

    // Check if tab actually changed
    if (prevActiveTabRef.current !== activeTab) {
      prevActiveTabRef.current = activeTab;
      // Load facets immediately for new tab (no changedFilterType = all loading)
      console.log(
        `🔄 [FILTER_MODAL] Tab changed to ${activeTab}, reloading facets immediately`
      );
      loadFacetsForFilters(tempFilters);
    }
  }, [activeTab, visible]);

  const loadFacetsForFilters = async (
    filterToUse: typeof filters,
    changedFilterType?: "style" | "service" | "location"
  ) => {
    // If already loading and a new change comes in, update pending
    if (isLoadingRef.current && changedFilterType) {
      pendingFilterChangeRef.current = changedFilterType;
      // Adjust loading states immediately
      updateLoadingStates(changedFilterType);
      return; // Don't start new request, let current one finish
    }

    isLoadingRef.current = true;
    updateLoadingStates(changedFilterType);

    try {
      const newFacets = await getFacets({ filters: filterToUse, activeTab });
      setTempFacets(newFacets);

      // Sync selected filters with newly available facets so we don't keep
      // \"ghost\" selections for styles/services/locations that are no longer valid
      setTempFilters((prev) => {
        if (!newFacets) return prev;

        const styleIdsSet = new Set(newFacets.styles.map((s) => s.id));
        const serviceIdsSet = new Set(newFacets.services.map((s) => s.id));
        const locationKeySet = new Set(
          newFacets.locations.map((l) => `${l.provinceId}::${l.municipalityId}`)
        );

        const next = {
          ...prev,
          styleIds: prev.styleIds.filter((id) => styleIdsSet.has(id)),
          serviceIds: prev.serviceIds.filter((id) => serviceIdsSet.has(id)),
        };

        // If current location is no longer valid for the new facets, clear it
        if (next.provinceId && next.municipalityId) {
          const key = `${next.provinceId}::${next.municipalityId}`;
          if (!locationKeySet.has(key)) {
            next.provinceId = null;
            next.municipalityId = null;
            setLocationNames(null);
          }
        }

        return next;
      });

      // Check if there's a pending change
      if (pendingFilterChangeRef.current) {
        const pendingType = pendingFilterChangeRef.current;
        pendingFilterChangeRef.current = null;
        // Recursively call with pending change using current tempFilters
        await loadFacetsForFilters(tempFilters, pendingType);
      }
    } catch (error) {
      console.error("Error loading facets:", error);
    } finally {
      isLoadingRef.current = false;
      // Only clear loading states if no pending change
      if (!pendingFilterChangeRef.current) {
        setIsLoadingStyles(false);
        setIsLoadingServices(false);
        setIsLoadingLocations(false);
      }
    }
  };

  // Helper function to update loading states based on changed filter type
  const updateLoadingStates = (
    changedFilterType?: "style" | "service" | "location"
  ) => {
    if (changedFilterType === "style") {
      setIsLoadingServices(true);
      setIsLoadingLocations(true);
      setIsLoadingStyles(false);
    } else if (changedFilterType === "service") {
      setIsLoadingStyles(true);
      setIsLoadingLocations(true);
      setIsLoadingServices(false);
    } else if (changedFilterType === "location") {
      setIsLoadingStyles(true);
      setIsLoadingServices(true);
      setIsLoadingLocations(false);
    } else {
      // Default: all loading (for initial load or tab change)
      setIsLoadingStyles(true);
      setIsLoadingServices(true);
      setIsLoadingLocations(true);
    }
  };

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
    const newFilters = {
      ...tempFilters,
      provinceId: data.provinceId,
      municipalityId: data.municipalityId,
    };

    setTempFilters(newFilters);
    setLocationNames({
      province: data.province,
      municipality: data.municipality,
    });
    setShowLocationPicker(false);

    // User finished choosing location -> update facets for other filters
    loadFacetsForFilters(newFilters, "location");
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

  // Confirm handlers: user finished choosing styles/services
  const handleStyleConfirm = () => {
    loadFacetsForFilters(tempFilters, "style");
  };

  const handleServiceConfirm = () => {
    loadFacetsForFilters(tempFilters, "service");
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
        enablePanDownToClose={true}
        enableDismissOnClose={true}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
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
              facets={tempFacets?.styles || []}
              isLoading={isLoadingStyles}
              onConfirm={handleStyleConfirm}
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
              <TouchableOpacity activeOpacity={1} onPress={handleResetService}>
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
              facets={tempFacets?.services || []}
              isLoading={isLoadingServices}
              onConfirm={handleServiceConfirm}
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
      <SearchLocationPicker
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
        facets={tempFacets?.locations || []}
        isLoading={isLoadingLocations}
      />
    </>
  );
}
