import ArtistCard from "@/components/search/ArtistCard";
import ArtistCardSkeleton from "@/components/search/ArtistCardSkeleton";
import FilterModal from "@/components/search/FilterModal";
import StudioCard from "@/components/search/StudioCard";
import StudioCardSkeleton from "@/components/search/StudioCardSkeleton";
import SearchLocationPicker from "@/components/shared/SearchLocationPicker";
import ScaledText from "@/components/ui/ScaledText";
import { MOST_POPULAR_PROVINCES_IDS } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { getCurrentUserLocation } from "@/services/profile.service";
import { useSearchStore } from "@/stores/searchStore";
import type { SearchTab } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, FlatList, RefreshControl, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
  const { user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    results,
    isInitializing,
    isLoading,
    isLoadingMore,
    hasMore,
    search,
    loadMore,
    loadFacets,
    locationDisplay,
    filters,
    resetFilters,
    facets,
    isLoadingFacets,
  } = useSearchStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animated red dot for active filters on Menu icon
  const filtersActive = useMemo(
    () =>
      (filters.styleIds && filters.styleIds.length > 0) ||
      (filters.serviceIds && filters.serviceIds.length > 0),
    [filters.styleIds, filters.serviceIds]
  );
  const dotAnim = useRef(new Animated.Value(0)).current;
  const dotOpacity = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const dotScale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (filtersActive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 850,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      dotAnim.stopAnimation();
      dotAnim.setValue(0);
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [filtersActive, dotAnim]);

  useEffect(() => {
    // Keep search location in sync with auth state (guest → Milano, logged-in → profile location)
    let isMounted = true;
    const applyLocation = async () => {
      const { updateFilters, setLocation, search: searchStore } =
        useSearchStore.getState();

      const useMilanoFallback = () => {
        if (MOST_POPULAR_PROVINCES_IDS.length > 0) {
          const milano = MOST_POPULAR_PROVINCES_IDS[0];
          updateFilters({ provinceId: milano.id, municipalityId: null }, { skipLoadFacets: true });
          setLocation(milano.name, "");
        } else {
          updateFilters({ provinceId: null, municipalityId: null }, { skipLoadFacets: true });
          setLocation("", "");
        }
      };

      if (user) {
        const userLocation = await getCurrentUserLocation();
        if (!isMounted) return;

        if (userLocation) {
          // For logged-in users, only use province (not municipality) to show all results in their province
          updateFilters({
            provinceId: userLocation.provinceId,
            municipalityId: null,
          }, { skipLoadFacets: true });
          setLocation(userLocation.province, "");
        } else {
          useMilanoFallback();
        }
      } else {
        useMilanoFallback();
      }

      await searchStore();
    };

    applyLocation();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await search();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadMore();
    }
  };

  const handleTabPress = (tab: SearchTab) => {
    setActiveTab(tab);
  };

  const handleLocationSelect = async (data: {
    province: string;
    provinceId: string;
    municipality: string;
    municipalityId: string;
  }) => {
    const store = useSearchStore.getState();

    // Update filters without triggering an extra facets load; search() will reload facets
    store.updateFilters(
      {
        provinceId: data.provinceId,
        municipalityId: data.municipalityId,
      },
      { skipLoadFacets: true }
    );

    // Set location display
    store.setLocation(data.province, data.municipality);

    // Trigger search which will update the results (and facets)
    await store.search();
  };

  // Combine results based on active tab
  const combinedResults = useMemo(
    () => (activeTab === "artists" ? results.artists : results.studios),
    [activeTab, results.artists, results.studios]
  );

  const renderItem = useCallback(({ item }: any) => {
    if ("businessName" in item) {
      return <ArtistCard artist={item} />;
    } else {
      return <StudioCard studio={item} />;
    }
  }, []);

  const keyExtractor = useCallback((item: any) => {
    // Add type prefix to ensure unique keys when combining artists and studios
    const type = "businessName" in item ? "artist" : "studio";
    return `${type}-${item.id}`;
  }, []);

  // Helper: check if filters are applied (not default/empty)
  // Only checks styles and services filters (excludes location filters)
  const areFiltersActive = () => {
    return (
      (filters.styleIds && filters.styleIds.length > 0) ||
      (filters.serviceIds && filters.serviceIds.length > 0)
    );
  };

  const handleResetFilters = () => {
    const { resetFilters, search: searchStore } = useSearchStore.getState();
    resetFilters();
    searchStore();
  };

  const renderEmpty = () => {
    // Only show empty state when not loading/initializing and results are actually zero
    if (isLoading || isInitializing) return null;
    if (combinedResults.length > 0) return null;

    return (
      // <View
      //   className="items-center justify-center flex-1"
      //   style={{ paddingTop: mvs(100) }}
      // >
      //   <View
      //     className="flex-row items-center justify-center"
      //     style={{ gap: s(4) }}
      //   >
      //     <ScaledText
      //       allowScaling={false}
      //       variant="lg"
      //       className="text-center text-gray font-neueBold"
      //     >
      //       Nessun risultato trovato
      //     </ScaledText>
      //   </View>
      //   <ScaledText
      //     allowScaling={false}
      //     variant="body2"
      //     className="text-center text-gray font-neueLight"
      //     style={{ marginTop: mvs(8), paddingHorizontal: s(40) }}
      //   >
      //     Prova a modificare i filtri
      //     {areFiltersActive() ? " o reimposta i filtri" : ""}.
      //   </ScaledText>
      //   <View style={{ flexDirection: "row", gap: s(16), marginTop: mvs(8) }}>
      //     <TouchableOpacity
      //       onPress={handleRefresh}
      //       className="flex-row items-center"
      //     >
      //       <ScaledText
      //         allowScaling={false}
      //         variant="body2"
      //         className="text-center text-primary font-neueLight"
      //       >
      //         Riprova
      //       </ScaledText>
      //     </TouchableOpacity>
      //     {areFiltersActive() && (
      //       <TouchableOpacity
      //         onPress={handleResetFilters}
      //         className="flex-row items-center"
      //       >
      //         <ScaledText
      //           allowScaling={false}
      //           variant="body2"
      //           className="text-center text-primary font-neueLight"
      //         >
      //           Reimposta filtri
      //         </ScaledText>
      //       </TouchableOpacity>
      //     )}
      //   </View>
      // </View>
      <View
        className="items-center justify-center flex-1"
        style={{ paddingTop: mvs(100) }}
      ></View>
    );
  };

  const renderFooter = () => {
    // Always render a spacer at the end so last card is visible, even if no loading skeleton
    return (
      <>
        {isLoadingMore ? (
          activeTab === "artists" ? (
            <ArtistCardSkeleton />
          ) : (
            <StudioCardSkeleton />
          )
        ) : null}
        <View style={{ height: s(520) }} />
      </>
    );
  };

  const totalResults =
    activeTab === "artists" ? results.artists.length : results.studios.length;

  // Show count immediately if data exists, regardless of loading state
  // Only hide count if no data AND we're loading/initializing
  const hasData = totalResults > 0;
  const shouldShowCount = hasData || (!isLoading && !isInitializing);

  // If not showing count (loading/initializing with no data), use "Artisti"/"Studi" (capitalized)
  // If showing count, use "artisti"/"studi" (lowercase)
  const typeLabel =
    activeTab === "studios"
      ? shouldShowCount
        ? "studi"
        : "Studi"
      : shouldShowCount
        ? "artisti"
        : "Artisti";

  const locationText = shouldShowCount
    ? `${totalResults} ${typeLabel}` +
      (locationDisplay ? " in Provincia di" : "")
    : typeLabel + (locationDisplay ? " in Provincia di" : "");

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View
          style={{
            paddingTop: mvs(8),
            paddingHorizontal: s(16),
            paddingBottom: mvs(28),
          }}
        >
          <View className="flex-row items-center justify-between">
            {/* Logo */}
            <View
              className="flex-row items-center"
              style={{
                width: s(20),
                height: s(20),
              }}
            >
              {/* <SVGIcons.Flash width={s(20)} height={s(20)} /> */}
            </View>
            <View className="flex-row items-center">
              <SVGIcons.LogoLight width={s(90)} height={s(50)} />
            </View>

            {/* Filter Button */}
            <TouchableOpacity onPress={() => setShowFilterModal(true)}>
              <View style={{ width: s(20), height: s(20) }}>
                <SVGIcons.Menu width={s(20)} height={s(20)} />
                {/* Subtle blinking red dot when styles/services filters are active */}
                {filtersActive && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: s(2),
                      right: s(1),
                      width: s(6),
                      height: s(6),
                      borderRadius: s(3),
                      backgroundColor: "#AE0E0E",
                      opacity: dotOpacity,
                      transform: [{ scale: dotScale }],
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View
          className="flex-row items-center justify-center"
          style={{
            paddingHorizontal: s(16),
            marginBottom: mvs(20),
            gap: s(4),
          }}
        >
          <TouchableOpacity
            onPress={() => handleTabPress("artists")}
            className={`rounded-full items-center justify-center border border-gray ${
              activeTab === "artists" ? "bg-primary border-primary" : ""
            }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="sm"
              className={`font-neueLight ${
                activeTab === "artists" ? "text-white" : "text-gray"
              }`}
            >
              Artisti
            </ScaledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabPress("studios")}
            className={`rounded-full items-center justify-center border border-gray ${
              activeTab === "studios" ? "bg-primary border-primary" : ""
            }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="sm"
              className={`font-neueLight ${
                activeTab === "studios" ? "text-white" : "text-gray"
              }`}
            >
              Studi
            </ScaledText>
          </TouchableOpacity>
        </View>

        <View className="min-h-screen">
          {/* Location Display */}
          {locationText && !isInitializing && (
            <View
              className="flex-row items-center justify-center"
              style={{
                paddingHorizontal: s(16),
                marginBottom: mvs(16),
                gap: s(2),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueSemibold"
              >
                {locationText}{" "}
              </ScaledText>
              {locationDisplay && (
                <TouchableOpacity
                  onPress={() => setShowLocationModal(true)}
                  className="flex-row items-center"
                  style={{
                    gap: s(4),
                  }}
                >
                  <SVGIcons.LocationRed width={s(11)} height={s(11)} />
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-primary font-neueSemibold"
                  >
                    {(() => {
                      const province = locationDisplay?.province || "";
                      const municipality = locationDisplay?.municipality || "";
                      if (province && municipality) {
                        const muniAbbrev = municipality
                          .slice(0, 2)
                          .toUpperCase();
                        return `${province.toUpperCase()} (${muniAbbrev})`;
                      }
                      const single = province || municipality;
                      return single.toUpperCase();
                    })()}
                  </ScaledText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Results List */}
          {(() => {
            // Show skeleton only during initial load (first mount)
            // After initialization, always show FlatList so users see existing data
            // or empty state, not skeleton when switching tabs
            if (isInitializing) {
              return (
                <View className="flex-1">
                  {/* Show skeletons based on active tab */}
                  {activeTab === "artists" ? (
                    <>
                      <ArtistCardSkeleton />
                      <ArtistCardSkeleton />
                      <ArtistCardSkeleton />
                    </>
                  ) : null}
                  {activeTab === "studios" ? (
                    <>
                      <StudioCardSkeleton />
                      <StudioCardSkeleton />
                      <StudioCardSkeleton />
                    </>
                  ) : null}
                </View>
              );
            }

            return (
              <>
                <FlatList
                  data={combinedResults}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  contentContainerStyle={{
                    // Add more space at the end, e.g. s(80) instead of s(40)
                    marginBottom: s(80),
                  }}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      tintColor="#AE0E0E"
                    />
                  }
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
                  ListEmptyComponent={renderEmpty}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  windowSize={10}
                  initialNumToRender={10}
                />
              </>
            );
          })()}
        </View>
      </LinearGradient>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
      />

      {/* Location Picker Bottom Sheet */}
      <SearchLocationPicker
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        initialProvinceId={filters.provinceId}
        initialMunicipalityId={filters.municipalityId}
        facets={facets?.locations || []}
        isLoading={isLoadingFacets}
        entityType={activeTab}
      />
    </View>
  );
}