import type {
    ArtistSearchResult,
    SearchFilters,
    StudioSearchResult,
} from "@/types/search";
import { supabase } from "@/utils/supabase";

const RESULTS_PER_PAGE = 20;

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
        favoriteStyles:artist_favorite_styles(
          order,
          style:tattoo_styles(id, name)
        ),
        services:artist_services(
          isActive,
          serviceId
        ),
        bannerMedia:artist_banner_media(
          mediaUrl,
          order
        )
      `
      )
      .eq("portfolioComplete", true)
      .eq("user.isActive", true)
      .order("createdAt", { ascending: false });

    // Apply style filter
    if (filters.styleIds.length > 0) {
      query = query.in("favoriteStyles.style.id", filters.styleIds);
    }

    // Apply service filter
    if (filters.serviceIds.length > 0) {
      query = query
        .in("services.serviceId", filters.serviceIds)
        .eq("services.isActive", true);
    }

    // Apply location filter
    if (filters.provinceId) {
      query = query.eq("user.locations.provinceId", filters.provinceId);
    }
    if (filters.municipalityId) {
      query = query.eq("user.locations.municipalityId", filters.municipalityId);
    }

    // Apply pagination
    const from = page * RESULTS_PER_PAGE;
    const to = from + RESULTS_PER_PAGE;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error("Error searching artists:", error);
      return { data: [], hasMore: false, error: error.message };
    }

    // Transform the data
    const artists: ArtistSearchResult[] = (data || []).map((artist: any) => {
      const primaryLocation = artist.user?.locations?.find(
        (loc: any) => loc.isPrimary
      );
      const activeSubscription = artist.user?.subscriptions?.find(
        (sub: any) =>
          sub.status === "ACTIVE" &&
          (!sub.endDate || new Date(sub.endDate) >= new Date())
      );

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
          artist.favoriteStyles
            ?.sort((a: any, b: any) => a.order - b.order)
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
    });

    return {
      data: artists,
      hasMore: data?.length === RESULTS_PER_PAGE + 1,
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
          order
        ),
        owner:artist_profiles(
          user:users(
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

    // Apply location filter
    if (filters.provinceId) {
      query = query.eq("locations.provinceId", filters.provinceId);
    }
    if (filters.municipalityId) {
      query = query.eq("locations.municipalityId", filters.municipalityId);
    }

    // Apply pagination
    const from = page * RESULTS_PER_PAGE;
    const to = from + RESULTS_PER_PAGE;
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
      hasMore: data?.length === RESULTS_PER_PAGE + 1,
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

