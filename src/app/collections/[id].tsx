import CollectionFilterModal from "@/components/collections/CollectionFilterModal";
import ArtistCard from "@/components/search/ArtistCard";
import ArtistCardSkeleton from "@/components/search/ArtistCardSkeleton";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { fetchCollectionArtists } from "@/services/collection.service";
import type { ServiceFacet, StyleFacet } from "@/types/facets";
import type { ArtistSearchResult } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  TouchableOpacity,
  View
} from "react-native";

function CollectionScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const title = typeof name === "string" && name.length > 0 ? name : "";

  /* ---------------- FACETS ---------------- */
  // Calculate style facets from artists filtered by service AND location (but not style)
  // This ensures that when a service or location is selected, only styles available in matching artists are shown
  const styleFacets = useMemo<StyleFacet[]>(() => {
    // Start with all artists, then apply filters (excluding style filter)
    let artistsForStyleFacets = artists;
    
    // Apply service filter
    if (selectedServiceIds.length > 0) {
      artistsForStyleFacets = artistsForStyleFacets.filter((artist) =>
        (artist.services || []).some((srv) =>
          selectedServiceIds.includes(srv.id)
        )
      );
    }
    
    // Note: Location filtering is handled by the artists array itself
    // If artists are already filtered by location, this will automatically be reflected

    const map = new Map<string, StyleFacet>();
    artistsForStyleFacets.forEach((artist) => {
      artist.styles?.forEach((style) => {
        if (style?.id && !map.has(style.id)) {
          map.set(style.id, {
            id: style.id,
            name: style.name ?? "",
            imageUrl: style.imageUrl ?? null,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [artists, selectedServiceIds]);

  // Calculate service facets from artists filtered by style AND location (but not service)
  // This ensures that when a style or location is selected, only services available in matching artists are shown
  const serviceFacets = useMemo<ServiceFacet[]>(() => {
    // Start with all artists, then apply filters (excluding service filter)
    let artistsForServiceFacets = artists;
    
    // Apply style filter
    if (selectedStyleIds.length > 0) {
      artistsForServiceFacets = artistsForServiceFacets.filter((artist) =>
        artist.styles?.some((s) => selectedStyleIds.includes(s.id))
      );
    }
    
    // Note: Location filtering is handled by the artists array itself
    // If artists are already filtered by location, this will automatically be reflected

    const map = new Map<string, ServiceFacet>();
    artistsForServiceFacets.forEach((artist) => {
      (artist.services || [])?.forEach((service) => {
        if (service?.id && !map.has(service.id)) {
          map.set(service.id, {
            id: service.id,
            name: service.name ?? "",
            category: "",
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [artists, selectedStyleIds]);

  /* ---------------- FILTER ---------------- */
  const filteredArtists = useMemo(() => {
    if (!selectedStyleIds.length && !selectedServiceIds.length) return artists;

    return artists.filter((artist) => {
      const matchesStyle =
        !selectedStyleIds.length ||
        artist.styles?.some((s) => selectedStyleIds.includes(s.id));

      const matchesService =
        !selectedServiceIds.length ||
        (artist.services || []).some((srv) =>
          selectedServiceIds.includes(srv.id)
        );

      // AND across style + service groups
      return matchesStyle && matchesService;
    });
  }, [artists, selectedStyleIds, selectedServiceIds]);

  /* ---------------- LIST ---------------- */
  const keyExtractor = useCallback((item: ArtistSearchResult) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ArtistSearchResult }) => <ArtistCard artist={item} />,
    []
  );

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!id) {
        setError("Collection non trovata");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchCollectionArtists(String(id));
        if (mounted) setArtists(data);
      } catch (e: any) {
        if (mounted)
          setError(e?.message || "Impossibile caricare la collection");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        {/* ================= HEADER (NORMAL LAYOUT) ================= */}
        <View
          style={{
            paddingBottom: mvs(16),
            paddingHorizontal: s(16),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: s(12),
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: s(100),
            }}
          >
            <SVGIcons.ChevronLeft width={s(14)} height={s(14)} />
          </TouchableOpacity>

          {/* Title */}
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueMedium"
            numberOfLines={1}
          >
            {title}
          </ScaledText>

          {/* Filter */}
          <TouchableOpacity
            onPress={() => setShowFilter(true)}
            style={{ padding: s(12) }}
          >
            <SVGIcons.Menu width={s(20)} height={s(20)} />
          </TouchableOpacity>
        </View>

        {/* ================= LIST (SCROLLS ONLY) ================= */}
        {loading ? (
          <>
            <ArtistCardSkeleton />
            <ArtistCardSkeleton />
          </>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <ScaledText variant="md" className="text-foreground">
              {error}
            </ScaledText>
          </View>
        ) : (
          <FlatList
            data={filteredArtists}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: mvs(40),
            }}
          />
        )}
      </LinearGradient>

      {/* ================= FILTER MODAL ================= */}
      <CollectionFilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        styleFacets={styleFacets}
        serviceFacets={serviceFacets}
        selectedStyleIds={selectedStyleIds}
        selectedServiceIds={selectedServiceIds}
        onChangeSelectedStyleIds={setSelectedStyleIds}
        onChangeSelectedServiceIds={setSelectedServiceIds}
      />
    </View>
  );
}

export default React.memo(CollectionScreen);
