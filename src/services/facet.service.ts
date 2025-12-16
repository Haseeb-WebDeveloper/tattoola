import type { SearchFilters, SearchTab } from "@/types/search";
import type { Facets, LocationFacet, ServiceFacet, StyleFacet } from "@/types/facets";
import { supabase } from "@/utils/supabase";
import { SEARCH_FILTER_COMPRESSION } from "@/constants/limits";

type FacetParams = {
  filters: SearchFilters;
  activeTab: SearchTab;
};

// Cache for base IDs to avoid redundant subscription queries
const baseIdCache = new Map<string, { artistIds: string[]; studioIds: string[] }>();

// Request deduplication - prevent multiple simultaneous calls with same params
let pendingFacetRequest: Promise<Facets> | null = null;
let pendingRequestParams: string | null = null;

function getCacheKey(
  filters: SearchFilters,
  activeTab: SearchTab,
  excludeStyle: boolean,
  excludeService: boolean,
  excludeLocation: boolean
): string {
  return `${activeTab}-${excludeStyle}-${excludeService}-${excludeLocation}-${JSON.stringify(filters)}`;
}

function getRequestKey(params: FacetParams): string {
  return `${params.activeTab}-${JSON.stringify(params.filters)}`;
}

function clearBaseIdCache() {
  baseIdCache.clear();
}

/**
 * Get base artist IDs that match current filters (excluding the dimension being counted)
 */
async function getFilteredArtistIds(
  filters: SearchFilters,
  excludeStyle?: boolean,
  excludeService?: boolean,
  excludeLocation?: boolean
): Promise<string[]> {
  let filteredArtistIds: string[] | null = null;

  // Apply style filter
  if (!excludeStyle && filters.styleIds.length > 0) {
    const { data: artistStyles } = await supabase
      .from("artist_styles")
      .select("artistId")
      .in("styleId", filters.styleIds);

    if (artistStyles && artistStyles.length > 0) {
      filteredArtistIds = [...new Set(artistStyles.map((as) => as.artistId))];
    } else {
      return [];
    }
  }

  // Apply service filter
  if (!excludeService && filters.serviceIds.length > 0) {
    const { data: artistServices } = await supabase
      .from("artist_services")
      .select("artistId")
      .in("serviceId", filters.serviceIds)
      .eq("isActive", true);

    if (artistServices && artistServices.length > 0) {
      const serviceArtistIds = [...new Set(artistServices.map((as) => as.artistId))];
      if (filteredArtistIds !== null) {
        filteredArtistIds = filteredArtistIds.filter((id) => serviceArtistIds.includes(id));
        if (filteredArtistIds.length === 0) return [];
      } else {
        filteredArtistIds = serviceArtistIds;
      }
    } else {
      return [];
    }
  }

  // Apply location filter
  if (!excludeLocation && (filters.provinceId || filters.municipalityId)) {
    let locationQuery = supabase.from("user_locations").select("userId");

    if (filters.provinceId) {
      locationQuery = locationQuery.eq("provinceId", filters.provinceId);
    }
    if (filters.municipalityId) {
      locationQuery = locationQuery.eq("municipalityId", filters.municipalityId);
    }

    const { data: userIds } = await locationQuery;

    if (userIds && userIds.length > 0) {
      const { data: locationArtists } = await supabase
        .from("artist_profiles")
        .select("id")
        .in("userId", userIds.map((ul) => ul.userId));

      if (locationArtists && locationArtists.length > 0) {
        const locationArtistIds = locationArtists.map((a) => a.id);
        if (filteredArtistIds !== null) {
          filteredArtistIds = filteredArtistIds.filter((id) => locationArtistIds.includes(id));
          if (filteredArtistIds.length === 0) return [];
        } else {
          filteredArtistIds = locationArtistIds;
        }
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  // Get all artists with active subscriptions if no filters applied
  if (filteredArtistIds === null) {
    const { data: allArtists } = await supabase
      .from("artist_profiles")
      .select("id, userId")
      .limit(10000);

    if (!allArtists || allArtists.length === 0) {
      return [];
    }

    // Filter by active subscriptions
    const userIds = allArtists.map((a) => a.userId);
    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select("userId")
      .in("userId", userIds)
      .eq("status", "ACTIVE")
      .or(`endDate.is.null,endDate.gte.${new Date().toISOString()}`);

    if (!subscriptions || subscriptions.length === 0) {
      return [];
    }

    const activeUserIds = new Set(subscriptions.map((s) => s.userId));
    filteredArtistIds = allArtists
      .filter((a) => activeUserIds.has(a.userId))
      .map((a) => a.id);
  }

  return filteredArtistIds || [];
}

/**
 * Get base studio IDs that match current filters (excluding the dimension being counted)
 */
async function getFilteredStudioIds(
  filters: SearchFilters,
  excludeStyle?: boolean,
  excludeService?: boolean,
  excludeLocation?: boolean
): Promise<string[]> {
  let filteredStudioIds: string[] | null = null;

  // Apply style filter
  if (!excludeStyle && filters.styleIds.length > 0) {
    const { data: studioStyles } = await supabase
      .from("studio_styles")
      .select("studioId")
      .in("styleId", filters.styleIds);

    if (studioStyles && studioStyles.length > 0) {
      filteredStudioIds = [...new Set(studioStyles.map((ss) => ss.studioId))];
    } else {
      return [];
    }
  }

  // Apply service filter
  if (!excludeService && filters.serviceIds.length > 0) {
    const { data: studioServices } = await supabase
      .from("studio_services")
      .select("studioId")
      .in("serviceId", filters.serviceIds)
      .eq("isActive", true);

    if (studioServices && studioServices.length > 0) {
      const serviceStudioIds = [...new Set(studioServices.map((ss) => ss.studioId))];
      if (filteredStudioIds !== null) {
        filteredStudioIds = filteredStudioIds.filter((id) => serviceStudioIds.includes(id));
        if (filteredStudioIds.length === 0) return [];
      } else {
        filteredStudioIds = serviceStudioIds;
      }
    } else {
      return [];
    }
  }

  // Apply location filter
  if (!excludeLocation && (filters.provinceId || filters.municipalityId)) {
    let locationQuery = supabase.from("studio_locations").select("studioId");

    if (filters.provinceId) {
      locationQuery = locationQuery.eq("provinceId", filters.provinceId);
    }
    if (filters.municipalityId) {
      locationQuery = locationQuery.eq("municipalityId", filters.municipalityId);
    }

    const { data: studioIds } = await locationQuery;

    if (studioIds && studioIds.length > 0) {
      const locationStudioIds = studioIds.map((sl) => sl.studioId);
      if (filteredStudioIds !== null) {
        filteredStudioIds = filteredStudioIds.filter((id) => locationStudioIds.includes(id));
        if (filteredStudioIds.length === 0) return [];
      } else {
        filteredStudioIds = locationStudioIds;
      }
    } else {
      return [];
    }
  }

  // Get all active studios if no filters applied
  if (filteredStudioIds === null) {
    const { data: allStudios } = await supabase
      .from("studios")
      .select("id, ownerId")
      .eq("isCompleted", true)
      .eq("isActive", true)
      .limit(10000);

    if (!allStudios || allStudios.length === 0) {
      return [];
    }

    // Filter by active subscriptions of owners
    const ownerIds = allStudios.map((s) => s.ownerId);
    const { data: ownerProfiles } = await supabase
      .from("artist_profiles")
      .select("id, userId")
      .in("id", ownerIds);

    if (!ownerProfiles || ownerProfiles.length === 0) {
      return [];
    }

    // Create a map from artist profile ID to user ID
    const artistIdToUserId = new Map(
      ownerProfiles.map((p) => [p.id, p.userId])
    );

    const userIds = ownerProfiles.map((p) => p.userId);
    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select("userId")
      .in("userId", userIds)
      .eq("status", "ACTIVE")
      .or(`endDate.is.null,endDate.gte.${new Date().toISOString()}`);

    if (!subscriptions || subscriptions.length === 0) {
      return [];
    }

    const activeUserIds = new Set(subscriptions.map((s) => s.userId));

    filteredStudioIds = allStudios
      .filter((s) => {
        const ownerUserId = artistIdToUserId.get(s.ownerId);
        return ownerUserId && activeUserIds.has(ownerUserId);
      })
      .map((s) => s.id);
  }

  return filteredStudioIds || [];
}

/**
 * Get style facets (batch queries - no counting)
 */
async function getStyleFacets(params: FacetParams): Promise<StyleFacet[]> {
  const { filters, activeTab } = params;

  // Get filtered IDs excluding style filter (with caching)
  const cacheKey = getCacheKey(filters, activeTab, true, false, false);
  let artistIds: string[];
  let studioIds: string[];

  if (baseIdCache.has(cacheKey)) {
    const cached = baseIdCache.get(cacheKey)!;
    artistIds = cached.artistIds;
    studioIds = cached.studioIds;
  } else {
    // If compression is "high", always fetch both artist and studio IDs regardless of tab
    // If compression is "medium", only fetch IDs for the current tab
    const shouldFetchArtists = SEARCH_FILTER_COMPRESSION === "high" || activeTab === "all" || activeTab === "artists";
    const shouldFetchStudios = SEARCH_FILTER_COMPRESSION === "high" || activeTab === "all" || activeTab === "studios";
    
    const [fetchedArtistIds, fetchedStudioIds] = await Promise.all([
      shouldFetchArtists
        ? getFilteredArtistIds(filters, true, false, false)
        : Promise.resolve([]),
      shouldFetchStudios
        ? getFilteredStudioIds(filters, true, false, false)
        : Promise.resolve([]),
    ]);
    artistIds = fetchedArtistIds;
    studioIds = fetchedStudioIds;
    baseIdCache.set(cacheKey, { artistIds, studioIds });
  }

  if (artistIds.length === 0 && studioIds.length === 0) {
    return [];
  }

  // If compression is "high", require both artists and studios to have results
  if (SEARCH_FILTER_COMPRESSION === "high" && (artistIds.length === 0 || studioIds.length === 0)) {
    return [];
  }

  // Get all active styles
  const { data: allStyles } = await supabase
    .from("tattoo_styles")
    .select("id, name, imageUrl")
    .eq("isActive", true)
    .order("name");

  if (!allStyles || allStyles.length === 0) {
    return [];
  }

  // BATCH QUERY: Get all artist-style and studio-style relationships at once
  const [artistStylesResult, studioStylesResult] = await Promise.all([
    artistIds.length > 0
      ? supabase
          .from("artist_styles")
          .select("styleId, artistId")
          .in("artistId", artistIds)
      : Promise.resolve({ data: [] }),
    studioIds.length > 0
      ? supabase
          .from("studio_styles")
          .select("styleId, studioId")
          .in("studioId", studioIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build sets of style IDs that have results
  const artistStyleIds = new Set<string>();
  const studioStyleIds = new Set<string>();

  artistStylesResult.data?.forEach((as) => {
    artistStyleIds.add(as.styleId);
  });

  studioStylesResult.data?.forEach((ss) => {
    studioStyleIds.add(ss.styleId);
  });

  // Filter styles based on compression mode
  let validStyleIds: Set<string>;
  if (SEARCH_FILTER_COMPRESSION === "high") {
    // High compression: only show styles that have both artists AND studios
    validStyleIds = new Set(
      Array.from(artistStyleIds).filter((styleId) => studioStyleIds.has(styleId))
    );
  } else {
    // Medium compression: show styles that have artists OR studios (current behavior)
    validStyleIds = new Set([...artistStyleIds, ...studioStyleIds]);
  }

  // Filter styles to only those with results
  const validFacets: StyleFacet[] = allStyles
    .filter((style) => validStyleIds.has(style.id))
    .map((style) => ({
      id: style.id,
      name: style.name,
      imageUrl: style.imageUrl,
    }));

  return validFacets;
}

/**
 * Get service facets (batch queries - no counting)
 */
async function getServiceFacets(params: FacetParams): Promise<ServiceFacet[]> {
  const { filters, activeTab } = params;

  // Get filtered IDs excluding service filter (with caching)
  const cacheKey = getCacheKey(filters, activeTab, false, true, false);
  let artistIds: string[];
  let studioIds: string[];

  if (baseIdCache.has(cacheKey)) {
    const cached = baseIdCache.get(cacheKey)!;
    artistIds = cached.artistIds;
    studioIds = cached.studioIds;
  } else {
    // If compression is "high", always fetch both artist and studio IDs regardless of tab
    // If compression is "medium", only fetch IDs for the current tab
    const shouldFetchArtists = SEARCH_FILTER_COMPRESSION === "high" || activeTab === "all" || activeTab === "artists";
    const shouldFetchStudios = SEARCH_FILTER_COMPRESSION === "high" || activeTab === "all" || activeTab === "studios";
    
    const [fetchedArtistIds, fetchedStudioIds] = await Promise.all([
      shouldFetchArtists
        ? getFilteredArtistIds(filters, false, true, false)
        : Promise.resolve([]),
      shouldFetchStudios
        ? getFilteredStudioIds(filters, false, true, false)
        : Promise.resolve([]),
    ]);
    artistIds = fetchedArtistIds;
    studioIds = fetchedStudioIds;
    baseIdCache.set(cacheKey, { artistIds, studioIds });
  }

  if (artistIds.length === 0 && studioIds.length === 0) {
    return [];
  }

  // If compression is "high", require both artists and studios to have results
  if (SEARCH_FILTER_COMPRESSION === "high" && (artistIds.length === 0 || studioIds.length === 0)) {
    return [];
  }

  // Get all active services
  const { data: allServices } = await supabase
    .from("services")
    .select("id, name, category")
    .eq("isActive", true)
    .order("name");

  if (!allServices || allServices.length === 0) {
    return [];
  }

  // BATCH QUERY: Get all artist-service and studio-service relationships at once
  const [artistServicesResult, studioServicesResult] = await Promise.all([
    artistIds.length > 0
      ? supabase
          .from("artist_services")
          .select("serviceId, artistId")
          .eq("isActive", true)
          .in("artistId", artistIds)
      : Promise.resolve({ data: [] }),
    studioIds.length > 0
      ? supabase
          .from("studio_services")
          .select("serviceId, studioId")
          .eq("isActive", true)
          .in("studioId", studioIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build sets of service IDs that have results
  const artistServiceIds = new Set<string>();
  const studioServiceIds = new Set<string>();

  artistServicesResult.data?.forEach((as) => {
    artistServiceIds.add(as.serviceId);
  });

  studioServicesResult.data?.forEach((ss) => {
    studioServiceIds.add(ss.serviceId);
  });

  // Filter services based on compression mode
  let validServiceIds: Set<string>;
  if (SEARCH_FILTER_COMPRESSION === "high") {
    // High compression: only show services that have both artists AND studios
    validServiceIds = new Set(
      Array.from(artistServiceIds).filter((serviceId) => studioServiceIds.has(serviceId))
    );
  } else {
    // Medium compression: show services that have artists OR studios (current behavior)
    validServiceIds = new Set([...artistServiceIds, ...studioServiceIds]);
  }

  // Filter services to only those with results
  const validFacets: ServiceFacet[] = allServices
    .filter((service) => validServiceIds.has(service.id))
    .map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
    }));

  return validFacets;
}

/**
 * Get location facets (simplified - no counting)
 */
async function getLocationFacets(params: FacetParams): Promise<LocationFacet[]> {
  const { filters, activeTab } = params;
  console.log("📍 [LOCATION_FACETS] Starting calculation for tab:", activeTab);

  // Get filtered IDs excluding location filter (with caching)
  const cacheKey = getCacheKey(filters, activeTab, false, false, true);
  let artistIds: string[];
  let studioIds: string[];

  if (baseIdCache.has(cacheKey)) {
    const cached = baseIdCache.get(cacheKey)!;
    artistIds = cached.artistIds;
    studioIds = cached.studioIds;
  } else {
    // If compression is "high", always fetch both artist and studio IDs regardless of tab
    // If compression is "medium", only fetch IDs for the current tab
    const shouldFetchArtists = SEARCH_FILTER_COMPRESSION === "high" || activeTab === "all" || activeTab === "artists";
    const shouldFetchStudios = SEARCH_FILTER_COMPRESSION === "high" || activeTab === "all" || activeTab === "studios";
    
    const [fetchedArtistIds, fetchedStudioIds] = await Promise.all([
      shouldFetchArtists
        ? getFilteredArtistIds(filters, false, false, true)
        : Promise.resolve([]),
      shouldFetchStudios
        ? getFilteredStudioIds(filters, false, false, true)
        : Promise.resolve([]),
    ]);
    artistIds = fetchedArtistIds;
    studioIds = fetchedStudioIds;
    baseIdCache.set(cacheKey, { artistIds, studioIds });
  }

  console.log("📍 [LOCATION_FACETS] Base IDs:", {
    artists: artistIds.length,
    studios: studioIds.length,
  });

  if (artistIds.length === 0 && studioIds.length === 0) {
    console.log("📍 [LOCATION_FACETS] No base IDs, returning empty");
    return [];
  }

  // If compression is "high", require both artists and studios to have results
  if (SEARCH_FILTER_COMPRESSION === "high" && (artistIds.length === 0 || studioIds.length === 0)) {
    console.log("📍 [LOCATION_FACETS] High compression mode: missing artists or studios, returning empty");
    return [];
  }

  // Get artist user IDs
  let artistUserIds: string[] = [];
  if (artistIds.length > 0) {
    const { data: artistProfiles } = await supabase
      .from("artist_profiles")
      .select("userId")
      .in("id", artistIds);

    artistUserIds = artistProfiles?.map((p) => p.userId) || [];
  }

  // BATCH QUERY: Get all locations at once
  const [userLocationsResult, studioLocationsResult] = await Promise.all([
    artistUserIds.length > 0
      ? supabase
          .from("user_locations")
          .select("provinceId, municipalityId")
          .in("userId", artistUserIds)
      : Promise.resolve({ data: [] }),
    studioIds.length > 0
      ? supabase
          .from("studio_locations")
          .select("provinceId, municipalityId")
          .in("studioId", studioIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Collect unique location keys
  const artistLocationKeys = new Set<string>();
  const studioLocationKeys = new Set<string>();

  userLocationsResult.data?.forEach((loc) => {
    if (loc.provinceId && loc.municipalityId) {
      // Ensure IDs are strings
      const provinceId = String(loc.provinceId);
      const municipalityId = String(loc.municipalityId);
      // Use a separator that won't appear in UUIDs
      artistLocationKeys.add(`${provinceId}::${municipalityId}`);
    }
  });

  studioLocationsResult.data?.forEach((loc) => {
    if (loc.provinceId && loc.municipalityId) {
      // Ensure IDs are strings
      const provinceId = String(loc.provinceId);
      const municipalityId = String(loc.municipalityId);
      // Use a separator that won't appear in UUIDs
      studioLocationKeys.add(`${provinceId}::${municipalityId}`);
    }
  });

  // Filter locations based on compression mode
  let locationKeys: Set<string>;
  if (SEARCH_FILTER_COMPRESSION === "high") {
    // High compression: only show locations that have both artists AND studios
    locationKeys = new Set(
      Array.from(artistLocationKeys).filter((key) => studioLocationKeys.has(key))
    );
  } else {
    // Medium compression: show locations that have artists OR studios (current behavior)
    locationKeys = new Set([...artistLocationKeys, ...studioLocationKeys]);
  }

  console.log(`  📍 [LOCATION_FACETS] Collected ${locationKeys.size} unique location keys from ${userLocationsResult.data?.length || 0} user locations and ${studioLocationsResult.data?.length || 0} studio locations`);

  if (locationKeys.size === 0) {
    console.log("📍 [LOCATION_FACETS] No locations found");
    return [];
  }

  // Extract province and municipality IDs (ensure they're strings)
  const allProvinceIds = new Set<string>();
  const allMunicipalityIds = new Set<string>();

  for (const key of locationKeys) {
    // Split on the custom separator
    const [provinceId, municipalityId] = key.split("::");
    allProvinceIds.add(String(provinceId));
    allMunicipalityIds.add(String(municipalityId));
  }

  console.log(`  📍 [LOCATION_FACETS] Found ${locationKeys.size} unique locations, fetching names...`);
  console.log(`  📍 [LOCATION_FACETS] Sample location keys:`, Array.from(locationKeys).slice(0, 5));

  // Batch fetch all provinces and municipalities
  const [provincesResult, municipalitiesResult] = await Promise.all([
    allProvinceIds.size > 0
      ? supabase
          .from("provinces")
          .select("id, name")
          .in("id", Array.from(allProvinceIds))
      : Promise.resolve({ data: [], error: null }),
    allMunicipalityIds.size > 0
      ? supabase
          .from("municipalities")
          .select("id, name")
          .in("id", Array.from(allMunicipalityIds))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (provincesResult.error) {
    console.error(`  📍 [LOCATION_FACETS] Error fetching provinces:`, provincesResult.error);
  }
  if (municipalitiesResult.error) {
    console.error(`  📍 [LOCATION_FACETS] Error fetching municipalities:`, municipalitiesResult.error);
  }

  console.log(`  📍 [LOCATION_FACETS] Fetched ${provincesResult.data?.length || 0} provinces and ${municipalitiesResult.data?.length || 0} municipalities`);

  const provincesMap = new Map(
    (provincesResult.data || []).map((p) => [String(p.id), p.name])
  );
  const municipalitiesMap = new Map(
    (municipalitiesResult.data || []).map((m) => [String(m.id), m.name])
  );

  console.log(`  📍 [LOCATION_FACETS] Created maps:`, {
    provinces: provincesMap.size,
    municipalities: municipalitiesMap.size,
    sampleProvinceIds: Array.from(provincesMap.keys()).slice(0, 3),
    sampleMunicipalityIds: Array.from(municipalitiesMap.keys()).slice(0, 3),
    sampleLocationKeys: Array.from(locationKeys).slice(0, 3),
  });

  // Build location facets
  let matchedCount = 0;
  let unmatchedCount = 0;
  const validFacets: LocationFacet[] = Array.from(locationKeys)
    .map((key) => {
      // Split on the custom separator
      const [provinceId, municipalityId] = key.split("::");
      const provinceName = provincesMap.get(provinceId);
      const municipalityName = municipalitiesMap.get(municipalityId);

      if (provinceName && municipalityName) {
        matchedCount++;
        return {
          id: key,
          name: `${municipalityName}, ${provinceName}`,
          province: provinceName,
          municipality: municipalityName,
          provinceId,
          municipalityId,
        };
      } else {
        unmatchedCount++;
        if (unmatchedCount <= 3) {
          console.warn(`  📍 [LOCATION_FACETS] Missing names for key ${key}:`, {
            provinceId,
            municipalityId,
            hasProvince: !!provinceName,
            hasMunicipality: !!municipalityName,
          });
        }
      }
      return null;
    })
    .filter((facet): facet is LocationFacet => facet !== null);

  console.log("📍 [LOCATION_FACETS] Results:", {
    total: validFacets.length,
    matched: matchedCount,
    unmatched: unmatchedCount,
    sample: validFacets.slice(0, 5).map(f => f.name),
  });
  return validFacets;
}

/**
 * Get all facets (styles, services, locations)
 */
export async function getFacets(params: FacetParams): Promise<Facets> {
  const requestKey = getRequestKey(params);
  
  // Deduplicate: if same request is already in progress, return that promise
  if (pendingFacetRequest && pendingRequestParams === requestKey) {
    return pendingFacetRequest;
  }

  // Clear cache at start of new calculation
  clearBaseIdCache();

  // Create the request promise and mark it as pending
  const facetPromise = (async () => {
    const [styles, services, locations] = await Promise.all([
      getStyleFacets(params),
      getServiceFacets(params),
      getLocationFacets(params),
    ]);

    // Clear cache after calculation completes
    clearBaseIdCache();

    return {
      styles,
      services,
      locations,
    };
  })();

  // Store as pending request
  pendingFacetRequest = facetPromise;
  pendingRequestParams = requestKey;

  try {
    const result = await facetPromise;
    return result;
  } finally {
    // Clear pending request when done
    if (pendingRequestParams === requestKey) {
      pendingFacetRequest = null;
      pendingRequestParams = null;
    }
  }
}

