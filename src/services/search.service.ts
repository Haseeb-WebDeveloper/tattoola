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
        studioAddress,
        yearsExperience,
        isStudioOwner,
        workArrangement,
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

    // Apply style and service filters by querying junction tables first
    let filteredArtistIds: string[] | null = null;

    // Apply style filter - query junction table first
    if (filters.styleIds.length > 0) {
      const { data: artistStyles } = await supabase
        .from("artist_styles")
        .select("artistId")
        .in("styleId", filters.styleIds);
      
      if (artistStyles && artistStyles.length > 0) {
        filteredArtistIds = [...new Set(artistStyles.map(as => as.artistId))];
      } else {
        // No artists match the style filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply service filter - query junction table first
    if (filters.serviceIds.length > 0) {
      const { data: artistServices } = await supabase
        .from("artist_services")
        .select("artistId")
        .in("serviceId", filters.serviceIds)
        .eq("isActive", true);
      
      if (artistServices && artistServices.length > 0) {
        const serviceArtistIds = [...new Set(artistServices.map(as => as.artistId))];
        // If we already filtered by style, intersect the IDs
        if (filteredArtistIds !== null) {
          filteredArtistIds = filteredArtistIds.filter(id => serviceArtistIds.includes(id));
          if (filteredArtistIds.length === 0) {
            return { data: [], hasMore: false };
          }
        } else {
          filteredArtistIds = serviceArtistIds;
        }
      } else {
        // No artists match the service filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply location filter - query to get artist IDs that match location
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
        // Get artist IDs for these users
        const { data: locationArtists } = await supabase
          .from("artist_profiles")
          .select("id")
          .in("userId", userIds.map(ul => ul.userId));
        
        if (locationArtists && locationArtists.length > 0) {
          const locationArtistIds = locationArtists.map(a => a.id);
          // Intersect with style/service filtered IDs if they exist
          if (filteredArtistIds !== null) {
            filteredArtistIds = filteredArtistIds.filter(id => locationArtistIds.includes(id));
            if (filteredArtistIds.length === 0) {
              return { data: [], hasMore: false };
            }
          } else {
            filteredArtistIds = locationArtistIds;
          }
        } else {
          // No artists match the location filter, return empty
          return { data: [], hasMore: false };
        }
      } else {
        // No users match the location filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply the filtered IDs to the main query
    if (filteredArtistIds !== null) {
      query = query.in("id", filteredArtistIds);
    }

    // Apply pagination (Supabase ranges are inclusive, so we subtract 1)
    const from = page * SEARCH_RESULTS_PER_PAGE;
    const to = from + SEARCH_RESULTS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error("[searchArtists] Query error:", error);
      return { data: [], hasMore: false, error: error.message };
    }

    // Transform the data and filter to only include artists with active subscriptions
    // For artists missing businessName or studioAddress, fetch from studio membership as fallback
    const artistsWithFallback = await Promise.all(
      (data || []).map(async (artist: any) => {
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

        // Use businessName and studioAddress from artist profile (already fetched)
        let businessName = artist.businessName;
        let studioAddress = artist.studioAddress;

        // Fallback: If businessName, studioAddress, or workArrangement is missing, query studio membership
        let studioMembershipData: any = null;
        let studioAddressFromStudio: string | null = null; // Store studio address separately for location fallback
        const needsFallback = (!businessName || !studioAddress || !artist.workArrangement);
        if (needsFallback && artist.userId) {
          const { data: studioMembership } = await supabase
            .from("studio_members")
            .select(
              `
              studio:studios(
                id,
                name,
                locations:studio_locations(
                  address,
                  isPrimary
                )
              )
            `
            )
            .eq("userId", artist.userId)
            .eq("status", "ACCEPTED")
            .eq("isActive", true)
            .maybeSingle();

          studioMembershipData = studioMembership;

          // Handle studio as array (Supabase type inference) or single object
          const studio = Array.isArray(studioMembership?.studio) 
            ? studioMembership.studio[0] 
            : studioMembership?.studio;
          
          if (studio) {
            // Only use studio data if artist profile doesn't have it
            if (!businessName && studio.name) {
              businessName = studio.name;
            }
            if (!studioAddress && studio.locations) {
              const locations = Array.isArray(studio.locations) ? studio.locations : [studio.locations];
              const primaryStudioLocation = locations.find(
                (loc: any) => loc.isPrimary
              );
              if (primaryStudioLocation?.address) {
                studioAddress = primaryStudioLocation.address;
              }
            }
            // Always extract studio address for location fallback (even if studioAddress from profile exists)
            if (studio.locations) {
              const locations = Array.isArray(studio.locations) ? studio.locations : [studio.locations];
              const primaryStudioLocation = locations.find(
                (loc: any) => loc.isPrimary
              );
              if (primaryStudioLocation?.address) {
                studioAddressFromStudio = primaryStudioLocation.address;
              }
            }
          }
        } else if (artist.userId) {
          // Even if we don't need fallback for businessName/workArrangement, still check for studio address as location fallback
          const { data: studioMembership } = await supabase
            .from("studio_members")
            .select(
              `
              studio:studios(
                locations:studio_locations(
                  address,
                  isPrimary
                )
              )
            `
            )
            .eq("userId", artist.userId)
            .eq("status", "ACCEPTED")
            .eq("isActive", true)
            .maybeSingle();

          // Handle studio as array (Supabase type inference) or single object
          const studio = Array.isArray(studioMembership?.studio) 
            ? studioMembership.studio[0] 
            : studioMembership?.studio;
          
          if (studio?.locations) {
            const locations = Array.isArray(studio.locations) ? studio.locations : [studio.locations];
            const primaryStudioLocation = locations.find(
              (loc: any) => loc.isPrimary
            );
            if (primaryStudioLocation?.address) {
              studioAddressFromStudio = primaryStudioLocation.address;
            }
          }
        }

        // Get workArrangement from artist profile, fallback to studio membership if needed
        let workArrangement = artist.workArrangement as "STUDIO_OWNER" | "STUDIO_EMPLOYEE" | "FREELANCE" | null;
        
        // Fallback: If workArrangement is missing, try to infer from studio membership
        if (!workArrangement) {
          // If isStudioOwner is true, set to STUDIO_OWNER
          if (artist.isStudioOwner) {
            workArrangement = "STUDIO_OWNER";
          } else if (studioMembershipData || businessName) {
            // If has studio membership or businessName, likely employee
            workArrangement = "STUDIO_EMPLOYEE";
          }
        }

        // Build location object - Priority: studioAddress (profile) > primaryLocation.address > studioAddress (from studio)
        const locationAddress = studioAddress || primaryLocation?.address || studioAddressFromStudio || null;
        
        // Create location object with priority: studioAddress (profile) > primaryLocation > studioAddress (from studio)
        let location = null;
        if (studioAddress) {
          // Priority 1: Use studioAddress from artist profile
          const anyLocation = primaryLocation || artist.user?.locations?.[0];
          location = {
            province: anyLocation?.province?.name || "",
            municipality: anyLocation?.municipality?.name || "",
            address: studioAddress, // Always use studioAddress from profile when available
          };
        } else if (primaryLocation?.address) {
          // Priority 2: Use primaryLocation address if studioAddress from profile is not available
          location = {
            province: primaryLocation.province?.name || "",
            municipality: primaryLocation.municipality?.name || "",
            address: primaryLocation.address,
          };
        } else if (studioAddressFromStudio) {
          // Priority 3: Use studio address from linked studio as fallback
          const anyLocation = primaryLocation || artist.user?.locations?.[0];
          location = {
            province: anyLocation?.province?.name || "",
            municipality: anyLocation?.municipality?.name || "",
            address: studioAddressFromStudio,
          };
        } else if (primaryLocation) {
          // Fallback: Use primaryLocation even without address (for province/municipality)
          location = {
            province: primaryLocation.province?.name || "",
            municipality: primaryLocation.municipality?.name || "",
            address: null,
          };
        }

        return {
          id: artist.id,
          userId: artist.userId,
          user: {
            username: artist.user?.username || "",
            avatar: artist.user?.avatar || null,
          },
          businessName: businessName,
          yearsExperience: artist.yearsExperience,
          isStudioOwner: artist.isStudioOwner,
          workArrangement: workArrangement,
          location: location,
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
    );

    const artists: ArtistSearchResult[] = artistsWithFallback.filter(
      (artist): artist is ArtistSearchResult => artist !== null
    );

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

    // Apply style and service filters by querying junction tables first
    let filteredStudioIds: string[] | null = null;

    // Apply style filter - query junction table first
    if (filters.styleIds.length > 0) {
      const { data: studioStyles } = await supabase
        .from("studio_styles")
        .select("studioId")
        .in("styleId", filters.styleIds);
      
      if (studioStyles && studioStyles.length > 0) {
        filteredStudioIds = [...new Set(studioStyles.map(ss => ss.studioId))];
      } else {
        // No studios match the style filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply service filter - query junction table first
    if (filters.serviceIds.length > 0) {
      const { data: studioServices } = await supabase
        .from("studio_services")
        .select("studioId")
        .in("serviceId", filters.serviceIds)
        .eq("isActive", true);
      
      if (studioServices && studioServices.length > 0) {
        const serviceStudioIds = [...new Set(studioServices.map(ss => ss.studioId))];
        // If we already filtered by style, intersect the IDs
        if (filteredStudioIds !== null) {
          filteredStudioIds = filteredStudioIds.filter(id => serviceStudioIds.includes(id));
          if (filteredStudioIds.length === 0) {
            return { data: [], hasMore: false };
          }
        } else {
          filteredStudioIds = serviceStudioIds;
        }
      } else {
        // No studios match the service filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply location filter - query to get studio IDs that match location
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
        const locationStudioIds = studioIds.map(sl => sl.studioId);
        // Intersect with style/service filtered IDs if they exist
        if (filteredStudioIds !== null) {
          filteredStudioIds = filteredStudioIds.filter(id => locationStudioIds.includes(id));
          if (filteredStudioIds.length === 0) {
            return { data: [], hasMore: false };
          }
        } else {
          filteredStudioIds = locationStudioIds;
        }
      } else {
        // No studios match the location filter, return empty
        return { data: [], hasMore: false };
      }
    }

    // Apply the filtered IDs to the main query
    if (filteredStudioIds !== null) {
      query = query.in("id", filteredStudioIds);
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

