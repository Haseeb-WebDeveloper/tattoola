import { SEARCH_RESULTS_PER_PAGE } from "@/constants/limits";
import type {
    ArtistSearchResult,
    SearchFilters,
    StudioSearchResult,
} from "@/types/search";
import { supabase } from "@/utils/supabase";

type SearchArtistsParams = {
  filters: SearchFilters;
  page?: number;
};

type SearchStudiosParams = {
  filters: SearchFilters;
  page?: number;
};

export async function searchArtists({
  filters,
  page = 0,
}: SearchArtistsParams): Promise<{
  data: ArtistSearchResult[];
  hasMore: boolean;
  error?: string;
}> {
  try {
    // Build the query
    let query = supabase
      .from("artist_profiles")
      .select(
        `
        id,
        userId,
        businessName,
        yearsExperience,
        isStudioOwner,
        portfolioComplete,
        user:users!inner(
          id,
          username,
          avatar,
          isVerified,
          locations:user_locations(
            provinceId,
            municipalityId,
            address,
            isPrimary,
            province:provinces(name),
            municipality:municipalities(name)
          ),
          subscriptions:user_subscriptions!user_subscriptions_userId_fkey(
            status,
            endDate,
            plan:subscription_plans(name, type)
          )
        ),
        styles:artist_styles(
          order,
          isFavorite,
          style:tattoo_styles(id, name)
        ),
        services:artist_services(
          isActive,
          serviceId
        ),
        bannerMedia:artist_banner_media(
          mediaUrl,
          mediaType,
          order
        )
      `
      )
      // .eq("portfolioComplete", true)
      .order("createdAt", { ascending: false });

    // Apply style filter
    if (filters.styleIds.length > 0) {
      query = query.in("styles.style.id", filters.styleIds);
    }

    // Apply service filter
    if (filters.serviceIds.length > 0) {
      query = query
        .in("services.serviceId", filters.serviceIds)
        .eq("services.isActive", true);
    }

    // Apply location filter using inner join to filter parent artists
    if (filters.provinceId || filters.municipalityId) {
      let locationQuery = supabase
        .from("user_locations")
        .select("userId");
      
      if (filters.provinceId) {
        locationQuery = locationQuery.eq("provinceId", filters.provinceId);
      }
      if (filters.municipalityId) {
        locationQuery = locationQuery.eq("municipalityId", filters.municipalityId);
      }
      
      const { data: userIds } = await locationQuery;
      
      if (userIds && userIds.length > 0) {
        query = query.in("userId", userIds.map(ul => ul.userId));
      } else {
        // No artists match the location filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply pagination (Supabase ranges are inclusive, so we subtract 1)
    const from = page * SEARCH_RESULTS_PER_PAGE;
    const to = from + SEARCH_RESULTS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error("Error searching artists:", error);
      return { data: [], hasMore: false, error: error.message };
    }

    // Transform the data and filter to only include artists with active subscriptions
    const artists: ArtistSearchResult[] = (data || [])
      .map((artist: any) => {
        const primaryLocation = artist.user?.locations?.find(
          (loc: any) => loc.isPrimary
        );
        const activeSubscription = artist.user?.subscriptions?.find(
          (sub: any) =>
            sub.status === "ACTIVE" &&
            (!sub.endDate || new Date(sub.endDate) >= new Date())
        );

        // Only include artists with active subscriptions
        if (!activeSubscription) {
          return null;
        }

        return {
          id: artist.id,
          userId: artist.userId,
          user: {
            username: artist.user?.username || "",
            avatar: artist.user?.avatar || null,
          },
          businessName: artist.businessName,
          yearsExperience: artist.yearsExperience,
          isStudioOwner: artist.isStudioOwner,
          location: primaryLocation
            ? {
                province: primaryLocation.province?.name || "",
                municipality: primaryLocation.municipality?.name || "",
                address: primaryLocation.address,
              }
            : null,
          styles:
            artist.styles
              ?.sort((a: any, b: any) => {
                // Sort by isFavorite first (favorites first), then by order
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.order - b.order;
              })
              .slice(0, 2)
              .map((fs: any) => ({
                id: fs.style?.id || "",
                name: fs.style?.name || "",
              })) || [],
          bannerMedia:
            artist.bannerMedia
              ?.sort((a: any, b: any) => a.order - b.order)
              .slice(0, 4)
              .map((bm: any) => ({
                mediaUrl: bm.mediaUrl,
                mediaType: bm.mediaType,
                order: bm.order,
              })) || [],
          subscription: activeSubscription
            ? {
                plan: {
                  name: activeSubscription.plan?.name || "",
                  type: activeSubscription.plan?.type || "",
                },
              }
            : null,
          isVerified: artist.user?.isVerified || false,
        };
      })
      .filter((artist): artist is ArtistSearchResult => artist !== null);

    return {
      data: artists,
      hasMore: (data?.length || 0) === SEARCH_RESULTS_PER_PAGE,
    };
  } catch (error: any) {
    console.error("Unexpected error searching artists:", error);
    return { data: [], hasMore: false, error: error.message };
  }
}

export async function searchStudios({
  filters,
  page = 0,
}: SearchStudiosParams): Promise<{
  data: StudioSearchResult[];
  hasMore: boolean;
  error?: string;
}> {
  try {
    // Build the query
    let query = supabase
      .from("studios")
      .select(
        `
        id,
        name,
        slug,
        logo,
        description,
        isActive,
        isCompleted,
        locations:studio_locations(
          provinceId,
          municipalityId,
          address,
          isPrimary,
          province:provinces(name),
          municipality:municipalities(name)
        ),
        styles:studio_styles(
          order,
          style:tattoo_styles(id, name)
        ),
        services:studio_services(
          isActive,
          serviceId
        ),
        bannerMedia:studio_banner_media(
          mediaUrl,
          mediaType,
          order
        ),
        owner:artist_profiles(
          user:users(
            username,
            subscriptions:user_subscriptions!user_subscriptions_userId_fkey(
              status,
              endDate,
              plan:subscription_plans(name, type)
            )
          )
        )
      `
      )
      .eq("isCompleted", true)
      .eq("isActive", true)
      .order("createdAt", { ascending: false });

    // Apply style filter
    if (filters.styleIds.length > 0) {
      query = query.in("styles.style.id", filters.styleIds);
    }

    // Apply service filter
    if (filters.serviceIds.length > 0) {
      query = query
        .in("services.serviceId", filters.serviceIds)
        .eq("services.isActive", true);
    }

    // Apply location filter using inner join to filter parent studios
    if (filters.provinceId || filters.municipalityId) {
      let locationQuery = supabase
        .from("studio_locations")
        .select("studioId");
      
      if (filters.provinceId) {
        locationQuery = locationQuery.eq("provinceId", filters.provinceId);
      }
      if (filters.municipalityId) {
        locationQuery = locationQuery.eq("municipalityId", filters.municipalityId);
      }
      
      const { data: studioIds } = await locationQuery;
      
      if (studioIds && studioIds.length > 0) {
        query = query.in("id", studioIds.map(sl => sl.studioId));
      } else {
        // No studios match the location filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply pagination (Supabase ranges are inclusive, so we subtract 1)
    const from = page * SEARCH_RESULTS_PER_PAGE;
    const to = from + SEARCH_RESULTS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error("Error searching studios:", error);
      return { data: [], hasMore: false, error: error.message };
    }

    // Transform the data
    const studios: StudioSearchResult[] = (data || []).map((studio: any) => {
      const activeSubscription = studio.owner?.user?.subscriptions?.find(
        (sub: any) =>
          sub.status === "ACTIVE" &&
          (!sub.endDate || new Date(sub.endDate) >= new Date())
      );

      return {
        id: studio.id,
        name: studio.name,
        slug: studio.slug,
        logo: studio.logo,
        description: studio.description,
        ownerName: studio.owner?.user?.username || "",
        locations:
          studio.locations?.map((loc: any) => ({
            province: loc.province?.name || "",
            municipality: loc.municipality?.name || "",
            address: loc.address,
          })) || [],
        styles:
          studio.styles
            ?.sort((a: any, b: any) => a.order - b.order)
            .slice(0, 2)
            .map((ss: any) => ({
              id: ss.style?.id || "",
              name: ss.style?.name || "",
            })) || [],
        bannerMedia:
          studio.bannerMedia
            ?.sort((a: any, b: any) => a.order - b.order)
            .slice(0, 4)
            .map((bm: any) => ({
              mediaUrl: bm.mediaUrl,
              mediaType: bm.mediaType,
              order: bm.order,
            })) || [],
        subscription: activeSubscription
          ? {
              plan: {
                name: activeSubscription.plan?.name || "",
                type: activeSubscription.plan?.type || "",
              },
            }
          : null,
      };
    });

    return {
      data: studios,
      hasMore: (data?.length || 0) === SEARCH_RESULTS_PER_PAGE,
    };
  } catch (error: any) {
    console.error("Unexpected error searching studios:", error);
    return { data: [], hasMore: false, error: error.message };
  }
}

export async function searchAll({
  filters,
  page = 0,
}: {
  filters: SearchFilters;
  page?: number;
}): Promise<{
  artists: ArtistSearchResult[];
  studios: StudioSearchResult[];
  hasMore: boolean;
  error?: string;
}> {
  try {
    const [artistsResult, studiosResult] = await Promise.all([
      searchArtists({ filters, page }),
      searchStudios({ filters, page }),
    ]);

    return {
      artists: artistsResult.data,
      studios: studiosResult.data,
      hasMore: artistsResult.hasMore || studiosResult.hasMore,
      error: artistsResult.error || studiosResult.error,
    };
  } catch (error: any) {
    console.error("Unexpected error in searchAll:", error);
    return {
      artists: [],
      studios: [],
      hasMore: false,
      error: error.message,
    };
  }
}

