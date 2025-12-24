import { supabase } from '@/utils/supabase';

export interface ProvinceRow { id: string; name: string; imageUrl?: string | null; }
export interface MunicipalityRow { id: string; name: string; provinceId: string; imageUrl?: string | null; }

let provincesCache: ProvinceRow[] | null = null;
const municipalitiesCache = new Map<string, MunicipalityRow[]>();

export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    // If it's a Google imgres URL, extract the real image URL from the imgurl param
    if (url.includes('/imgres') && url.includes('imgurl=')) {
      const u = new URL(url);
      const raw = u.searchParams.get('imgurl');
      if (raw) {
        const decoded = decodeURIComponent(raw);
        if (/^https?:\/\//i.test(decoded)) return decoded;
      }
    }
    // Otherwise return as-is if it looks like http(s)
    if (/^https?:\/\//i.test(url)) return url;
  } catch (_) {}
  return undefined;
}

export async function getProvinces(): Promise<ProvinceRow[]> {
  if (provincesCache) return provincesCache;
  const { data, error } = await supabase
    .from('provinces')
    .select('id,name,imageUrl')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  provincesCache = (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    imageUrl: normalizeImageUrl(p.imageUrl),
  }));
  return provincesCache;
}

export async function getMunicipalities(provinceId: string): Promise<MunicipalityRow[]> {
  if (municipalitiesCache.has(provinceId)) return municipalitiesCache.get(provinceId)!;
  const { data, error } = await supabase
    .from('municipalities')
    .select('id,name,provinceId,imageUrl')
    .eq('provinceId', provinceId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    provinceId: m.provinceId,
    imageUrl: normalizeImageUrl(m.imageUrl),
  }));
  municipalitiesCache.set(provinceId, rows);
  return rows;
}

export function buildGoogleMapsUrl(
  municipalityName: string,
  provinceName: string,
  address?: string | null
): string {
  // If address is provided, use it; otherwise fallback to municipality, province
  const query = address
    ? encodeURIComponent(`${address}, ${municipalityName}, ${provinceName}`)
    : encodeURIComponent(`${municipalityName}, ${provinceName}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export interface ProvinceWithCount extends ProvinceRow {
  artistCount: number;
  studioCount: number;
  totalCount: number;
}

/**
 * Get provinces with artist and studio counts (only active subscriptions)
 * Returns provinces sorted by total count (artists + studios) descending
 */
export async function getProvincesWithCounts(): Promise<ProvinceWithCount[]> {
  try {
    // Get all active provinces
    const { data: provincesData, error: provincesError } = await supabase
      .from('provinces')
      .select('id, name, imageUrl')
      .eq('isActive', true);

    if (provincesError) {
      console.error('📍 [LOCATION_SERVICE] Error loading provinces:', provincesError);
      return [];
    }

    if (!provincesData || provincesData.length === 0) {
      return [];
    }

    const provinceIds = provincesData.map((p) => p.id);

    // Initialize province counts map
    const provinceCounts = new Map<
      string,
      { artistCount: number; studioCount: number }
    >();
    provincesData.forEach((p) => {
      provinceCounts.set(p.id, { artistCount: 0, studioCount: 0 });
    });

    // Get all artists with active subscriptions
    const { data: allArtists } = await supabase
      .from('artist_profiles')
      .select('id, userId')
      .limit(10000);

    let activeArtistUserIds: string[] = [];
    if (allArtists && allArtists.length > 0) {
      // Filter by active subscriptions
      const userIds = allArtists.map((a) => a.userId);
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('userId')
        .in('userId', userIds)
        .eq('status', 'ACTIVE')
        .or(`endDate.is.null,endDate.gte.${new Date().toISOString()}`);

      const activeUserIds = new Set(
        subscriptions?.map((s) => s.userId) || []
      );
      activeArtistUserIds = allArtists
        .filter((a) => activeUserIds.has(a.userId))
        .map((a) => a.userId);
    }

    // Count artists per province via user_locations
    if (activeArtistUserIds.length > 0) {
      const { data: userLocations } = await supabase
        .from('user_locations')
        .select('provinceId, userId')
        .in('provinceId', provinceIds)
        .in('userId', activeArtistUserIds);

      if (userLocations) {
        const artistCountsByProvince = new Map<string, Set<string>>();
        userLocations.forEach((loc) => {
          if (!artistCountsByProvince.has(loc.provinceId)) {
            artistCountsByProvince.set(loc.provinceId, new Set());
          }
          artistCountsByProvince.get(loc.provinceId)?.add(loc.userId);
        });

        artistCountsByProvince.forEach((userIds, provinceId) => {
          const counts = provinceCounts.get(provinceId);
          if (counts) {
            counts.artistCount = userIds.size;
          }
        });
      }
    }

    // Get all active studios (completed and active)
    const { data: allStudios } = await supabase
      .from('studios')
      .select('id, ownerId')
      .eq('isCompleted', true)
      .eq('isActive', true)
      .limit(10000);

    if (allStudios && allStudios.length > 0) {
      // Get owner profiles
      const ownerIds = allStudios.map((s) => s.ownerId);
      const { data: ownerProfiles } = await supabase
        .from('artist_profiles')
        .select('id, userId')
        .in('id', ownerIds);

      if (ownerProfiles && ownerProfiles.length > 0) {
        const ownerUserIds = ownerProfiles.map((p) => p.userId);
        const { data: ownerSubscriptions } = await supabase
          .from('user_subscriptions')
          .select('userId')
          .in('userId', ownerUserIds)
          .eq('status', 'ACTIVE')
          .or(`endDate.is.null,endDate.gte.${new Date().toISOString()}`);

        const activeOwnerUserIds = new Set(
          ownerSubscriptions?.map((s) => s.userId) || []
        );

        const artistIdToUserId = new Map(
          ownerProfiles.map((p) => [p.id, p.userId] as const)
        );

        const activeStudioIds = allStudios
          .filter((s) => {
            const ownerUserId = artistIdToUserId.get(s.ownerId);
            return ownerUserId && activeOwnerUserIds.has(ownerUserId);
          })
          .map((s) => s.id);

        // Count studios per province via studio_locations
        if (activeStudioIds.length > 0) {
          const { data: studioLocations } = await supabase
            .from('studio_locations')
            .select('provinceId, studioId')
            .in('provinceId', provinceIds)
            .in('studioId', activeStudioIds);

          if (studioLocations) {
            const studioCountsByProvince = new Map<string, Set<string>>();
            studioLocations.forEach((loc) => {
              if (!studioCountsByProvince.has(loc.provinceId)) {
                studioCountsByProvince.set(loc.provinceId, new Set());
              }
              studioCountsByProvince.get(loc.provinceId)?.add(loc.studioId);
            });

            studioCountsByProvince.forEach((studioIds, provinceId) => {
              const counts = provinceCounts.get(provinceId);
              if (counts) {
                counts.studioCount = studioIds.size;
              }
            });
          }
        }
      }
    }

    // Build result array with counts
    const provincesWithCounts: ProvinceWithCount[] = provincesData.map(
      (p) => {
        const counts = provinceCounts.get(p.id) || {
          artistCount: 0,
          studioCount: 0,
        };
        return {
          id: p.id,
          name: p.name,
          imageUrl: normalizeImageUrl(p.imageUrl),
          artistCount: counts.artistCount,
          studioCount: counts.studioCount,
          totalCount: counts.artistCount + counts.studioCount,
        };
      }
    );

    // Sort by total count descending, then by name ascending as tiebreaker
    provincesWithCounts.sort((a, b) => {
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return a.name.localeCompare(b.name);
    });

    return provincesWithCounts;
  } catch (error) {
    console.error(
      '📍 [LOCATION_SERVICE] Exception getting provinces with counts:',
      error
    );
    return [];
  }
}


