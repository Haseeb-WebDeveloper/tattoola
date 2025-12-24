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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, TouchableOpacity, View } from "react-native";

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

  useEffect(() => {
    // Initialize search and facets on mount
    const initialize = async () => {
      const {
        filters: currentFilters,
        updateFilters,
        setLocation,
      } = useSearchStore.getState();

      // Set default location if no province filter is set
      if (!currentFilters.provinceId) {
        // For logged-in users, try to use their primary location
        if (user) {
          const userLocation = await getCurrentUserLocation();
          if (userLocation) {
            // Use user's primary location
            updateFilters({
              provinceId: userLocation.provinceId,
              municipalityId: userLocation.municipalityId,
            });
            setLocation(userLocation.province, userLocation.municipality);
          } else {
            // User logged in but no primary location, fall back to Milano
            if (MOST_POPULAR_PROVINCES_IDS.length > 0) {
              const milano = MOST_POPULAR_PROVINCES_IDS[0];
              updateFilters({ provinceId: milano.id });
              setLocation(milano.name, "");
            }
          }
        } else {
          // Not logged in, use Milano as default
          if (MOST_POPULAR_PROVINCES_IDS.length > 0) {
            const milano = MOST_POPULAR_PROVINCES_IDS[0];
            updateFilters({ provinceId: milano.id });
            setLocation(milano.name, "");
          }
        }
      }

      await Promise.all([search(), loadFacets()]);
    };
    initialize();
  }, [user]);

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

  const handleLocationSelect = (data: {
    province: string;
    provinceId: string;
    municipality: string;
    municipalityId: string;
  }) => {
    const {
      updateFilters,
      setLocation,
      search: searchStore,
    } = useSearchStore.getState();
    updateFilters({
      provinceId: data.provinceId,
      municipalityId: data.municipalityId,
    });
    setLocation(data.province, data.municipality);
    searchStore();
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
  const areFiltersActive = () => {
    return (
      (filters.styleIds && filters.styleIds.length > 0) ||
      (filters.serviceIds && filters.serviceIds.length > 0) ||
      (filters.provinceId && filters.provinceId.length > 0) ||
      (filters.municipalityId && filters.municipalityId.length > 0)
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
              {areFiltersActive() ? (
                <SVGIcons.FilterListRed width={s(20)} height={s(20)} />
              ) : (
                <SVGIcons.Menu width={s(20)} height={s(20)} />
              )}
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
