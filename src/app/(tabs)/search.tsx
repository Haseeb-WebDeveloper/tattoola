import ArtistCard from "@/components/search/ArtistCard";
import FilterModal from "@/components/search/FilterModal";
import StudioCard from "@/components/search/StudioCard";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useSearchStore } from "@/stores/searchStore";
import type { SearchTab } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    setActiveTab,
    results,
    isLoading,
    isLoadingMore,
    hasMore,
    search,
    loadMore,
    locationDisplay,
  } = useSearchStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    search();
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

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: mvs(100) }}
      >
        <ScaledText
          allowScaling={false}
          variant="lg"
          className="text-gray font-neueBold text-center"
        >
          No results found
        </ScaledText>
        <ScaledText
          allowScaling={false}
          variant="body2"
          className="text-gray font-neueLight text-center"
          style={{ marginTop: mvs(8), paddingHorizontal: s(40) }}
        >
          Try adjusting your filters to find what you're looking for
        </ScaledText>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={{ paddingVertical: mvs(20) }}>
        <ActivityIndicator size="large" color="#AE0E0E" />
      </View>
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
            <View className="flex-row items-center">
              <SVGIcons.Flash width={s(20)} height={s(20)} />
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
            className={`rounded-full items-center justify-center ${
              activeTab === "all" ? "bg-primary" : "border border-gray"
            }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className={`font-light ${
                activeTab === "all" ? "text-white" : "text-gray"
              }`}
            >
              All
            </ScaledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabPress("artists")}
            className={`rounded-full items-center justify-center ${
              activeTab === "artists" ? "bg-primary" : "border border-gray"
            }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className={`font-light ${
                activeTab === "artists" ? "text-white" : "text-gray"
              }`}
            >
              Artists
            </ScaledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabPress("studios")}
            className={`rounded-full items-center justify-center ${
              activeTab === "studios" ? "bg-primary" : "border border-gray"
            }`}
            style={{
              paddingVertical: mvs(3),
              paddingHorizontal: s(18),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className={`font-light ${
                activeTab === "studios" ? "text-white" : "text-gray"
              }`}
            >
              Studios
            </ScaledText>
          </TouchableOpacity>
        </View>

        {/* Location Display */}
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
            className="text-white font-semibold"
          >
            {locationText}{" "}
          </ScaledText>
          {locationDisplay && (
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              className="border border-gray rounded-full flex-row items-center"
              style={{
                paddingVertical: mvs(3),
                paddingHorizontal: s(8),
                gap: s(4),
              }}
            >
              <SVGIcons.LocationRed width={s(11)} height={s(11)} />
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-primary font-semibold"
              >
                {locationDisplay.province.toUpperCase()}
              </ScaledText>
            </TouchableOpacity>
          )}
        </View>

        {/* Results List */}
        {isLoading && combinedResults.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#AE0E0E" />
          </View>
        ) : (
          <FlatList
            data={combinedResults}
            renderItem={renderItem}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={{
              paddingBottom: mvs(100),
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
        )}
      </LinearGradient>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
      />
    </View>
  );
}
