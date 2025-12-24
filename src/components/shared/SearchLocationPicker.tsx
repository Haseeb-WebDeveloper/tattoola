import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import type { LocationFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View
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
  isLoading?: boolean;
  entityType?: "artists" | "studios"; // determines how to compute top 6 provinces
};

export default function SearchLocationPicker({
  visible,
  onClose,
  onSelect,
  initialProvinceId,
  initialMunicipalityId,
  facets = [],
  isLoading = false,
  entityType = "artists",
}: SearchLocationPickerProps) {
  const insets = useSafeAreaInsets();

  const [modalStep, setModalStep] = useState<"province" | "municipality">(
    "province"
  );
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [municipalityCounts, setMunicipalityCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<
    string | null
  >(null);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [displayCount, setDisplayCount] = useState(30); // Initial items to display for smoother feel

  // Memoize facet province IDs to avoid unnecessary recalculations
  const facetProvinceIds = useMemo(() => new Set(facets.map((f) => f.provinceId)), [facets]);

  // Load provinces with count-based sorting depending on entityType (artists or studios)
  useEffect(() => {
    let isMounted = true;

    const loadProvinces = async () => {
      // If there are no facet provinces, show none
      if (facetProvinceIds.size === 0) {
        setProvinces([]);
        return;
      }

      setIsLoadingProvinces(true);

      try {
        // Count entities per province based on entityType
        let provinceEntityCount: Record<string, number> = {};

        if (entityType === "artists") {
          // Optimized query: Join user_locations with users to get artist locations in one query
          const { data: artistLocations, error: locError } = await supabase
            .from("user_locations")
            .select(`
              provinceId,
              userId,
              users!inner(role)
            `)
            .eq("isPrimary", true)
            .eq("users.role", "ARTIST");

          if (locError) {
            console.error("📍 [LOCATION_PICKER] Error loading artist locations:", locError);
          }

          (artistLocations || []).forEach((loc: any) => {
            provinceEntityCount[loc.provinceId] = (provinceEntityCount[loc.provinceId] || 0) + 1;
          });
        } else {
          // Studios: join studio_locations with studios to filter active/completed studios
          const { data: studioLocations, error: studioLocError } = await supabase
            .from("studio_locations")
            .select(`
              provinceId,
              studioId,
              studios!inner(isActive, isCompleted)
            `)
            .eq("isPrimary", true)
            .eq("studios.isActive", true)
            .eq("studios.isCompleted", true);

          if (studioLocError) {
            console.error("📍 [LOCATION_PICKER] Error loading studio locations:", studioLocError);
          }

          (studioLocations || []).forEach((loc: any) => {
            provinceEntityCount[loc.provinceId] = (provinceEntityCount[loc.provinceId] || 0) + 1;
          });
        }

        // Fetch provinces
        const { data: allProvinces, error: provError } = await supabase
          .from("provinces")
          .select("id, name, imageUrl")
          .eq("isActive", true);

        if (provError) {
          console.error("📍 [LOCATION_PICKER] Error loading provinces:", provError);
          if (isMounted) setProvinces([]);
          return;
        }

        if (!isMounted) return;

        // Filter to provinces with facets and sort by entity count (desc), then name (asc)
        const provincesWithFacets = (allProvinces || [])
          .filter((province) => facetProvinceIds.has(province.id))
          .sort((a, b) => {
            const countA = provinceEntityCount[a.id] || 0;
            const countB = provinceEntityCount[b.id] || 0;
            if (countB !== countA) {
              return countB - countA; // Higher count first
            }
            return a.name.localeCompare(b.name); // Alphabetical as tiebreaker
          });

        setProvinces(provincesWithFacets);
      } catch (err) {
        console.error("📍 [LOCATION_PICKER] Exception loading provinces:", err);
        if (isMounted) setProvinces([]);
      } finally {
        if (isMounted) setIsLoadingProvinces(false);
      }
    };

    loadProvinces();

    return () => {
      isMounted = false;
    };
  }, [facetProvinceIds, entityType]);

  // Load municipalities when a province is selected and enrich with facet counts
  useEffect(() => {
    (async () => {
      if (modalStep === "municipality" && selectedProvince) {
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
            // Filter to only show municipalities that have facets (available locations)
            const municipalitiesWithFacets = municipalitiesData.filter((municipality) => {
              return facets.some(
                (f) =>
                  f.provinceId === selectedProvince.id &&
                  f.municipalityId === municipality.id
              );
            });
            setMunicipalities(municipalitiesWithFacets);

            // Compute counts per municipality for the selected province
            try {
              if (municipalitiesWithFacets.length > 0) {
                const targetMunicipalityIds = new Set(
                  municipalitiesWithFacets.map((m) => m.id)
                );

                if (entityType === "artists") {
                  const { data: artistLocs } = await supabase
                    .from("user_locations")
                    .select(`
                      municipalityId,
                      userId,
                      users!inner(role)
                    `)
                    .eq("isPrimary", true)
                    .eq("provinceId", selectedProvince.id)
                    .eq("users.role", "ARTIST");

                  const userIds = Array.from(
                    new Set((artistLocs || []).map((l: any) => l.userId))
                  );
                  let activeUserIds = new Set<string>();
                  if (userIds.length > 0) {
                    const { data: subscriptions } = await supabase
                      .from("user_subscriptions")
                      .select("userId")
                      .in("userId", userIds)
                      .eq("status", "ACTIVE")
                      .or(`endDate.is.null,endDate.gte.${new Date().toISOString()}`);
                    activeUserIds = new Set(
                      (subscriptions || []).map((s: any) => s.userId)
                    );
                  }

                  const counts: Record<string, number> = {};
                  (artistLocs || []).forEach((l: any) => {
                    const mId = String(l.municipalityId || "");
                    if (!mId || !targetMunicipalityIds.has(mId)) return;
                    if (!activeUserIds.has(l.userId)) return;
                    counts[mId] = (counts[mId] || 0) + 1;
                  });
                  setMunicipalityCounts(counts);
                } else {
                  const { data: studioLocs } = await supabase
                    .from("studio_locations")
                    .select(`
                      municipalityId,
                      studioId,
                      studios!inner(isActive, isCompleted)
                    `)
                    .eq("isPrimary", true)
                    .eq("provinceId", selectedProvince.id)
                    .eq("studios.isActive", true)
                    .eq("studios.isCompleted", true);

                  const counts: Record<string, number> = {};
                  (studioLocs || []).forEach((l: any) => {
                    const mId = String(l.municipalityId || "");
                    if (!mId || !targetMunicipalityIds.has(mId)) return;
                    counts[mId] = (counts[mId] || 0) + 1;
                  });
                  setMunicipalityCounts(counts);
                }
              } else {
                setMunicipalityCounts({});
              }
            } catch (countErr) {
              setMunicipalityCounts({});
            }
          }
        } catch (err) {
          setMunicipalities([]);
          setMunicipalityCounts({});
        }
      }
    })();
  }, [modalStep, selectedProvince, facets, entityType]);

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

  const handleClose = useCallback(() => {
    setModalStep("province");
    setSearch("");
    setSelectedProvince(null);
    setSelectedMunicipalityId(null);
    onClose();
  }, [onClose]);

  const handleMunicipalitySelect = useCallback((municipality: Municipality) => {
    if (selectedProvince) {
      setSelectedMunicipalityId(municipality.id);
    }
  }, [selectedProvince]);

  const handleApplySelection = useCallback(() => {
    if (selectedProvince && selectedMunicipalityId) {
      const municipality = municipalities.find((m) => m.id === selectedMunicipalityId);
      if (!municipality) return;
      onSelect({
        province: selectedProvince.name,
        provinceId: selectedProvince.id,
        municipality: municipality.name,
        municipalityId: municipality.id,
      });
      handleClose();
    }
  }, [selectedProvince, selectedMunicipalityId, municipalities, onSelect, handleClose]);

  const handleBack = useCallback(() => {
    if (modalStep === "municipality") {
      setModalStep("province");
      setSearch("");
    } else {
      handleClose();
    }
  }, [modalStep, handleClose]);

  // Memoize top 6 provinces
  const topSix = useMemo(() => provinces.slice(0, 6), [provinces]);
  
  // Memoize top six IDs set
  const topSixIds = useMemo(() => new Set(topSix.map((p) => p.id)), [topSix]);
  
  const isSearching = search.trim().length > 0;

  // Reset display count when search or modalStep changes
  useEffect(() => {
    setDisplayCount(30);
  }, [search, modalStep]);

  // Memoize filtered list
  const listFiltered = useMemo(() => {
    const list = modalStep === "province" ? provinces : municipalities;
    const searchLower = search.trim().toLowerCase();
    
    const filtered = list
      .filter((r) => r.name.toLowerCase().includes(searchLower))
      .filter((r) =>
        modalStep === "province" && !isSearching ? !topSixIds.has(r.id) : true
      );
    
    // Sort "Altre province" alphabetically when not searching
    if (modalStep === "province" && !isSearching) {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
  }, [modalStep, provinces, municipalities, search, isSearching, topSixIds]);

  // Progressive display - only show first N items
  const displayedItems = useMemo(() => {
    return listFiltered.slice(0, displayCount);
  }, [listFiltered, displayCount]);

  const hasMoreItems = displayCount < listFiltered.length;

  const loadMoreItems = useCallback(() => {
    if (hasMoreItems) {
      // Load in bigger chunks to reduce perceived stutter
      setDisplayCount(prev => Math.min(prev + 30, listFiltered.length));
    }
  }, [hasMoreItems, listFiltered.length]);

  // Handle scroll to load more items
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    
    // Check if user has scrolled near the bottom
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreItems();
    }
  }, [loadMoreItems]);

  // Ensure content fills the view; progressively load until scrollable
  const handleContentSizeChange = useCallback((_: number, contentHeight: number) => {
    if (hasMoreItems && contentHeight <= containerHeight + 20) {
      loadMoreItems();
    }
  }, [hasMoreItems, containerHeight, loadMoreItems]);

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
            className="relative flex-row items-center justify-between border-b border-gray bg-[#140404]"
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
                  ? "Seleziona la Provincia"
                  : "Seleziona il Comune"}
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
                containerClassName="bg-background"
                className="text-foreground"
                style={{
                  backgroundColor: "transparent",
                  fontFamily: "NeueHaasDisplay-Light",
                  fontSize: s(12),
                }}
                placeholder={
                  modalStep === "province" ? "Cerca Provincia" : "Cerca Comune"
                }
                placeholderTextColor="#ffffff7e"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1"
            style={{
              paddingBottom: mvs(160) + Math.max(insets.bottom, mvs(20)),
              paddingTop: mvs(20),
            }}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
            onContentSizeChange={handleContentSizeChange}
          >
            {/* Popular six for province step - only show when not searching */}
            {modalStep === "province" && topSix.length > 0 && !isSearching && (
              <View style={{ paddingBottom: mvs(16) }}>
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-gray font-neueSemibold"
                  style={{ paddingHorizontal: s(20), paddingBottom: mvs(12) }}
                >
                  {entityType === "artists" ? "Province con più artisti" : "Province con più studi"}
                </ScaledText>
                <View
                  style={{ 
                    backgroundColor: '#140404',
                    marginHorizontal: s(2),
                  }}
                >
                  <View className="flex-row flex-wrap">
                    {topSix.map((p, index) => {
                      const active = selectedProvince?.id === p.id;
                      const isRightColumn = (index + 1) % 3 === 0;
                      const isBottomRow = index >= 3;
                      
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            setSelectedProvince(p);
                            setSearch("");
                          }}
                          style={{
                            width: '33.333%',
                            height: mvs(100),
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: s(12),
                            borderRightWidth: active ? 2 : (isRightColumn ? 0 : 1),
                            borderBottomWidth: active ? 2 : (isBottomRow ? 0 : 1),
                            borderLeftWidth: active ? 2 : 0,
                            borderTopWidth: active ? 2 : 0,
                            borderColor: active ? '#AE0E0E' : '#333',
                          }}
                        >
                          <ScaledText
                            allowScaling={false}
                            className="text-center text-foreground font-neueLight"
                            style={{
                              fontSize: s(14),
                              lineHeight: mvs(23),
                              letterSpacing: 0,
                            }}
                          >
                            {p.name.toUpperCase()}
                          </ScaledText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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
                {(() => {
                  if (isSearching) return "Risultati della ricerca";
                  if (modalStep === "province") return "Altre province";

                  // Municipality step header
                  const selectedMunicipality = municipalities.find(
                    (m) => m.id === selectedMunicipalityId
                  );
                  const count = selectedMunicipalityId
                    ? municipalityCounts[selectedMunicipalityId] ?? null
                    : null;
                  const labelType = entityType === "studios" ? "studi" : "artisti";

                  if (selectedMunicipality && count !== null) {
                    // Prefer municipality name; fallback to province name if missing
                    const placeName = (selectedMunicipality.name || selectedProvince?.name || "").toUpperCase();
                    return `${count} ${labelType} nel comune di ${placeName}`;
                  }

                  return `Comuni in Provincia di  ${selectedProvince?.name.toUpperCase() || "PROVINCIA SELEZIONATA"}`;
                })()}
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
                <>
                  {displayedItems.map((item) => {
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
                            handleMunicipalitySelect(item);
                          }
                        }}
                      >
                        <View className="flex-row items-center gap-3 px-6">
                          <View className="flex-1">
                            <ScaledText
                              allowScaling={false}
                              variant="md"
                              className="text-foreground font-montserratLight"
                            >
                              {modalStep === "province"
                                ? item.name.toUpperCase()
                                : item.name}
                            </ScaledText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                  {hasMoreItems && (
                    <View style={{ paddingVertical: mvs(16), alignItems: "center" }}>
                      <ActivityIndicator size="small" color="#AE0E0E" />
                    </View>
                  )}
                </>
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
              <TouchableOpacity
                onPress={handleApplySelection}
                className={`rounded-full items-center flex-row gap-3 ${
                  selectedMunicipalityId ? "bg-primary" : "bg-gray/40"
                }`}
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
                disabled={!selectedMunicipalityId}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueSemibold"
                >
                  Applica
                </ScaledText>
                <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}