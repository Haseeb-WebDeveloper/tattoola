import ArtistCard from "@/components/search/ArtistCard";
import ArtistCardSkeleton from "@/components/search/ArtistCardSkeleton";
import FilterModal from "@/components/search/FilterModal";
import StudioCard from "@/components/search/StudioCard";
import StudioCardSkeleton from "@/components/search/StudioCardSkeleton";
import LocationPicker from "@/components/shared/LocationPicker";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useSearchStore } from "@/stores/searchStore";
import type { SearchTab } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
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
    locationDisplay,
    filters,
    initializeWithUserLocation,
    resetFilters,
  } = useSearchStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeWithUserLocation();
  }, []);

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
  const combinedResults =
    activeTab === "all"
      ? [...results.artists, ...results.studios]
      : activeTab === "artists"
        ? results.artists
        : results.studios;

  const renderItem = ({ item }: any) => {
    if ("businessName" in item) {
      return <ArtistCard artist={item} />;
    } else {
      return <StudioCard studio={item} />;
    }
  };

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
    if (isLoading) return null;

    return (
      <View
        className="items-center justify-center flex-1"
        style={{ paddingTop: mvs(100) }}
      >
        <View
          className="flex-row items-center justify-center"
          style={{ gap: s(4) }}
        >
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-center text-gray font-neueBold"
          >
            Nessun risultato trovato
          </ScaledText>
          {/* <SVGIcons.SafeAlert width={s(12)} height={s(12)} /> */}
        </View>
        <ScaledText
          allowScaling={false}
          variant="body2"
          className="text-center text-gray font-neueLight"
          style={{ marginTop: mvs(8), paddingHorizontal: s(40) }}
        >
          Prova a modificare i filtri
          {areFiltersActive() ? " o reimposta i filtri" : ""}.
        </ScaledText>
        <View style={{ flexDirection: "row", gap: s(16), marginTop: mvs(8) }}>
          <TouchableOpacity
            onPress={handleRefresh}
            className="flex-row items-center"
          >
            {/* Fallback to generic reload or try again, since SVGIcons.Refresh doesn't exist */}
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-center text-primary font-neueLight"
            >
              Riprova
            </ScaledText>
          </TouchableOpacity>
          {areFiltersActive() && (
            <TouchableOpacity
              onPress={handleResetFilters}
              className="flex-row items-center"
            >
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-center text-primary font-neueLight"
              >
                Reimposta filtri
              </ScaledText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    // Always render a spacer at the end so last card is visible, even if no loading skeleton
    return (
      <>
        {isLoadingMore ? (
          activeTab === "artists" || activeTab === "all" ? (
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
    activeTab === "all"
      ? results.artists.length + results.studios.length
      : activeTab === "artists"
        ? results.artists.length
        : results.studios.length;

  const locationText = locationDisplay
    ? `${totalResults} ${activeTab === "studios" ? "studi" : activeTab === "artists" ? "artisti" : "risultati"} in Provincia di`
    : `${totalResults} ${activeTab === "studios" ? "studi" : activeTab === "artists" ? "artisti" : "risultati"}`;

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
              <SVGIcons.LogoLight />
            </View>

            {/* Filter Button */}
            <TouchableOpacity onPress={() => setShowFilterModal(true)}>
              <SVGIcons.Menu width={s(20)} height={s(20)} />
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
            onPress={() => handleTabPress("all")}
            className={`rounded-full items-center justify-center border border-gray ${activeTab === "all" ? "bg-primary border-primary" : ""
              }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="sm"
              className={`font-neueLight ${activeTab === "all" ? "text-white" : "text-gray"
                }`}
            >
              Tutto
            </ScaledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabPress("artists")}
            className={`rounded-full items-center justify-center border border-gray ${activeTab === "artists" ? "bg-primary border-primary" : ""
              }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="sm"
              className={`font-neueLight ${activeTab === "artists" ? "text-white" : "text-gray"
                }`}
            >
              Artisti
            </ScaledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabPress("studios")}
            className={`rounded-full items-center justify-center border border-gray ${activeTab === "studios" ? "bg-primary border-primary" : ""
              }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="sm"
              className={`font-neueLight ${activeTab === "studios" ? "text-white" : "text-gray"
                }`}
            >
              Studi
            </ScaledText>
          </TouchableOpacity>
        </View>

        <View className="min-h-screen"
        >
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
          {isInitializing || (isLoading && combinedResults.length === 0) ? (
            <View className="flex-1">
              {/* Show skeletons based on active tab */}
              {activeTab === "artists" || activeTab === "all" ? (
                <>
                  <ArtistCardSkeleton />
                  <ArtistCardSkeleton />
                  <ArtistCardSkeleton />
                </>
              ) : null}
              {activeTab === "studios" || activeTab === "all" ? (
                <>
                  <StudioCardSkeleton />
                  <StudioCardSkeleton />
                  <StudioCardSkeleton />
                </>
              ) : null}
            </View>
          ) : (
            <>
              <FlatList
                data={combinedResults}
                renderItem={renderItem}
                keyExtractor={(item: any) => {
                  // Add type prefix to ensure unique keys when combining artists and studios
                  const type = "businessName" in item ? "artist" : "studio";
                  return `${type}-${item.id}`;
                }}
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
              />
            </>
          )}
        </View>
      </LinearGradient>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
      />

      {/* Location Picker Bottom Sheet */}
      <LocationPicker
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        initialProvinceId={filters.provinceId}
        initialMunicipalityId={filters.municipalityId}
      />
    </View>
  );
}
