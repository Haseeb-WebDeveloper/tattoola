import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { getFacets } from "@/services/facet.service";
import { useSearchStore } from "@/stores/searchStore";
import type { Facets, ServiceFacet, StyleFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
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
import ServiceFilter from "./ServiceFilter";
import StyleFilter from "./StyleFilter";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function FilterModal({ visible, onClose }: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const { filters, updateFilters, search, activeTab, facets, results } =
    useSearchStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [tempFilters, setTempFilters] = useState(filters);
  const [tempFacets, setTempFacets] = useState<Facets | null>(null);
  // All active styles and services (for showing all filters)
  const [allStyles, setAllStyles] = useState<StyleFacet[]>([]);
  const [allServices, setAllServices] = useState<ServiceFacet[]>([]);
  // Separate loading states for each filter type
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  // Track pending filter changes for rapid selections
  const pendingFilterChangeRef = useRef<"style" | "service" | null>(null);
  const isLoadingRef = useRef(false);

  // Snap points for the bottom sheet (90% of screen height)
  const snapPoints = useMemo(() => ["80%"], []);

  // Load all active styles and services
  useEffect(() => {
    const loadAllFilters = async () => {
      try {
        const [stylesResult, servicesResult] = await Promise.all([
          supabase
            .from("tattoo_styles")
            .select("id, name, imageUrl")
            .eq("isActive", true)
            .order("name"),
          supabase
            .from("services")
            .select("id, name, category")
            .eq("isActive", true)
            .order("name"),
        ]);

        if (stylesResult.error) {
          console.error("Error loading styles:", stylesResult.error);
        } else {
          const activeStyles: StyleFacet[] = (stylesResult.data || []).map(
            (s) => ({
              id: s.id,
              name: s.name,
              imageUrl: s.imageUrl || null,
            })
          );
          setAllStyles(activeStyles);
        }

        if (servicesResult.error) {
          console.error("Error loading services:", servicesResult.error);
        } else {
          const activeServices: ServiceFacet[] = (servicesResult.data || []).map(
            (s) => ({
              id: s.id,
              name: s.name,
              category: s.category,
            })
          );
          setAllServices(activeServices);
        }
      } catch (error) {
        console.error("Error loading all filters:", error);
      }
    };

    if (visible) {
      loadAllFilters();
    }
  }, [visible, activeTab]);

  // Load facets when modal opens
  useEffect(() => {
    if (visible) {
      setTempFilters(filters);
      setTempFacets(facets);
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
      // Reset loading states
      setIsLoadingStyles(false);
      setIsLoadingServices(false);
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
    changedFilterType?: "style" | "service"
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

        const next = {
          ...prev,
          styleIds: prev.styleIds.filter((id) => styleIdsSet.has(id)),
          serviceIds: prev.serviceIds.filter((id) => serviceIdsSet.has(id)),
        };

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
      }
    }
  };

  // Helper function to update loading states based on changed filter type
  const updateLoadingStates = (changedFilterType?: "style" | "service") => {
    if (changedFilterType === "style") {
      setIsLoadingServices(true);
      setIsLoadingStyles(false);
    } else if (changedFilterType === "service") {
      setIsLoadingStyles(true);
      setIsLoadingServices(false);
    } else {
      // Default: all loading (for initial load or tab change)
      setIsLoadingStyles(true);
      setIsLoadingServices(true);
    }
  };

  // Handle bottom sheet dismiss (called when modal is fully dismissed)
  const handleSheetDismiss = useCallback(() => {
    onClose();
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
    // No need to reload facets - we're using results-based filtering
  };

  const handleServiceChange = (serviceIds: string[]) => {
    setTempFilters((prev) => ({ ...prev, serviceIds }));
    // No need to reload facets - we're using results-based filtering
  };
  const handleResetAll = () => {
    setTempFilters({
      styleIds: [],
      serviceIds: [],
      provinceId: null,
      municipalityId: null,
    });
  };

  const handleResetStyle = () => {
    setTempFilters((prev) => ({ ...prev, styleIds: [] }));
  };

  const handleResetService = () => {
    setTempFilters((prev) => ({ ...prev, serviceIds: [] }));
  };

  const handleApply = () => {
    // Update filters and location display
    updateFilters(tempFilters);

    // Trigger search
    search();

    // Close bottom sheet modal
    // handleSheetDismiss will call onClose() to sync parent state
    bottomSheetRef.current?.dismiss();
  };

  const hasActiveFilters =
    tempFilters.styleIds.length > 0 || tempFilters.serviceIds.length > 0;

  // Show all styles - no conditional filtering
  const availableStyleIds = useMemo(() => {
    const styleIds = new Set<string>();
    allStyles.forEach((style) => {
      styleIds.add(style.id);
    });
    return styleIds;
  }, [allStyles]);

  // Show all services - no conditional filtering
  const availableServiceIds = useMemo(() => {
    const serviceIds = new Set<string>();
    allServices.forEach((service) => {
      serviceIds.add(service.id);
    });
    return serviceIds;
  }, [allServices]);

  // Calculate result count based on active tab and current results
  const resultCount = useMemo(() => {
    return activeTab === "artists" ? results.artists.length : results.studios.length;
  }, [activeTab, results.artists.length, results.studios.length]);

  const typeLabel = activeTab === "studios" ? "studi" : "artisti";

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
          {/* Result Count Header */}
          <View style={{ marginBottom: mvs(20), alignItems: "center" }}>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueBold"
            >
              {resultCount} {typeLabel}
            </ScaledText>
          </View>

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
              allStyles={allStyles}
              availableStyleIds={availableStyleIds}
              isLoading={isLoadingStyles}
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
              allServices={allServices}
              availableServiceIds={availableServiceIds}
              isLoading={isLoadingServices}
            />
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
    </>
  );
}