import {
    getProfileFromCache,
    saveProfileToCache,
    shouldRefreshCache,
} from "@/utils/database";
import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";

// Get current user's primary location for personalized search
export async function getCurrentUserLocation(): Promise<{
  provinceId: string;
  municipalityId: string;
  province: string;
  municipality: string;
} | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return null;
    }

    const { data, error } = await supabase
      .from("user_locations")
      .select(`
        provinceId,
        municipalityId,
        province:provinces(id, name),
        municipality:municipalities(id, name)
      `)
      .eq("userId", session.user.id)
      .eq("isPrimary", true)
      .maybeSingle();

    if (error || !data || !data.province || !data.municipality) {
      return null;
    }

    return {
      provinceId: data.provinceId,
      municipalityId: data.municipalityId,
      province: (data.province as any).name,
      municipality: (data.municipality as any).name,
    };
  } catch (error) {
    console.error("Error fetching user location:", error);
    return null;
  }
}

// Follow helpers co-located for now to avoid a new file import churn
export async function isFollowing(userId: string, targetUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("followerId", userId)
    .eq("followingId", targetUserId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(
  userId: string,
  targetUserId: string
): Promise<{ isFollowing: boolean }> {
  // Check existing relation
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("followerId", userId)
    .eq("followingId", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("followerId", userId)
      .eq("followingId", targetUserId);
    if (error) throw new Error(error.message);
    return { isFollowing: false };
  }

  const { error } = await supabase
    .from("follows")
    .insert({ id: uuidv4(), followerId: userId, followingId: targetUserId });
  if (error) throw new Error(error.message);
  return { isFollowing: true };
}

export type ArtistSelfProfile = {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  artistProfile: {
    id: string;
    businessName?: string;
    bio?: string;
    mainStyleId?: string | null;
    banner: { mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; order: number }[];
  };
  location?: {
    id: string;
    address?: string;
    province: {
      id: string;
      name: string;
      code?: string;
    };
    municipality: {
      id: string;
      name: string;
    };
    isPrimary: boolean;
  };
  favoriteStyles: { id: string; name: string; imageUrl?: string | null; isMain?: boolean }[];
  services: { id: string; name: string; description?: string | null }[];
  collections: Array<{
    id: string;
    name: string;
    isPortfolioCollection: boolean;
    thumbnails: string[]; // up to 4
  }>;
  bodyPartsNotWorkedOn: { id: string; name: string }[];
};

export async function fetchArtistSelfProfile(
  userId: string,
  forceRefresh = false
): Promise<ArtistSelfProfile> {
  // Step 1: Try cache first (unless forceRefresh is true)
  if (!forceRefresh) {
    const cached = await getProfileFromCache(userId);
    if (cached) {
      console.log("📦 Using cached profile for user:", userId);
      
      // Optionally trigger background sync if cache is stale
      shouldRefreshCache(userId).then((shouldRefresh) => {
        if (shouldRefresh) {
          console.log("🔄 Cache is stale, triggering background sync...");
          // Trigger background refresh without awaiting
          fetchArtistSelfProfile(userId, true).catch((err) =>
            console.error("Background sync failed:", err)
          );
        }
      });
      
      return cached;
    }
  }

  console.log("🌐 Fetching profile from Supabase for user:", userId);

  // Step 2: fetch user + artist profile from Supabase
  const userQ = await supabase
    .from("users")
    .select(
      `id,email,username,firstName,lastName,avatar,bio,instagram,tiktok,
       artist_profiles(id,businessName,instagram,website,phone,mainStyleId,bannerType)`
    )
    .eq("id", userId)
    .single();

  if (userQ.error) throw new Error(userQ.error.message);
  const userRow: any = userQ.data;
  const artistProfile = Array.isArray(userRow?.artist_profiles)
    ? userRow.artist_profiles[0]
    : userRow?.artist_profiles;

  if (!artistProfile) {
    // Return a safe empty profile instead of throwing so UI can render gracefully
    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        username: userRow.username,
        firstName: userRow.firstName,
        lastName: userRow.lastName,
        avatar: userRow.avatar,
        instagram: userRow.instagram,
        tiktok: userRow.tiktok,
        website: undefined,
      },
      artistProfile: {
        id: "",
        businessName: undefined,
        bio: undefined,
        mainStyleId: null,
        banner: [],
      },
      location: undefined,
      favoriteStyles: [],
      services: [],
      collections: [],
      bodyPartsNotWorkedOn: [],
    };
  }

  const artistId = artistProfile.id as string;
  const activeBannerType = artistProfile.bannerType || 'FOUR_IMAGES';

  // Step 2: parallel dependent queries (treat errors as empty for resilience)
  const [banner2, favStyles2, services2, collectionsQ, allBodyPartsQ, artistBodyParts2, locationQ] = await Promise.all([
    supabase
      .from("artist_banner_media")
      .select("mediaType,mediaUrl,order")
      .eq("artistId", artistId)
      .eq("bannerType", activeBannerType)
      .order("order", { ascending: true }),
    supabase
      .from("artist_favorite_styles")
      .select("styleId,order, tattoo_styles(id,name,imageUrl)")
      .eq("artistId", artistId)
      .order("order", { ascending: true }),
    supabase
      .from("artist_services")
      .select("serviceId,price,duration, services(id,name,description)")
      .eq("artistId", artistId),
    supabase
      .from("collections")
      .select("id,name,isPortfolioCollection")
      .eq("ownerId", userId)
      .order("createdAt", { ascending: false }),
    supabase
      .from("body_parts")
      .select("id,name")
      .order("name", { ascending: true }),
    supabase
      .from("artist_body_parts")
      .select("bodyPartId")
      .eq("artistId", artistId),
    supabase
      .from("user_locations")
      .select(`
        id,
        address,
        isPrimary,
        provinces(id,name,code),
        municipalities(id,name)
      `)
      .eq("userId", userId)
      .eq("isPrimary", true)
      .maybeSingle(),
  ]);

  // Build collections thumbnails (first 4 post media)
  const collections = (collectionsQ?.data || []) as { id: string; name: string; isPortfolioCollection: boolean }[];
  const thumbsPerCollection: Record<string, string[]> = {};
  if (collections.length > 0) {
    const postsInCollections = await supabase
      .from("collection_posts")
      .select("collectionId, postId")
      .in(
        "collectionId",
        collections.map((c) => c.id)
      );
    if (!postsInCollections.error && postsInCollections.data && postsInCollections.data.length) {
      const postIds = Array.from(new Set(postsInCollections.data.map((r: any) => r.postId)));
      if (postIds.length) {
        const mediaQ = await supabase
          .from("post_media")
          .select("postId, mediaUrl, order")
          .in("postId", postIds)
          .order("order", { ascending: true });
        const byPost: Record<string, { mediaUrl: string; order: number }[]> = {};
        if (!mediaQ.error && mediaQ.data) {
          for (const m of mediaQ.data as any[]) {
            byPost[m.postId] = byPost[m.postId] || [];
            byPost[m.postId].push({ mediaUrl: m.mediaUrl, order: m.order });
          }
        }
        for (const cp of postsInCollections.data as any[]) {
          const first = (byPost[cp.postId] || []).sort((a, b) => a.order - b.order)[0];
          if (first) {
            thumbsPerCollection[cp.collectionId] = thumbsPerCollection[cp.collectionId] || [];
            if (thumbsPerCollection[cp.collectionId].length < 4) {
              thumbsPerCollection[cp.collectionId].push(first.mediaUrl);
            }
          }
        }
      }
    }
  }

  const workedIds = new Set((artistBodyParts2?.data || []).map((r: any) => r.bodyPartId));
  const bodyPartsNotWorkedOn = (allBodyPartsQ?.data || [])
    .filter((bp: any) => !workedIds.has(bp.id))
    .map((bp: any) => ({ id: bp.id, name: bp.name }));

  const favoriteStyles = (favStyles2?.data || []).map((r: any) => ({
    id: r.tattoo_styles?.id,
    name: r.tattoo_styles?.name,
    imageUrl: r.tattoo_styles?.imageUrl,
    isMain: artistProfile.mainStyleId ? r.tattoo_styles?.id === artistProfile.mainStyleId : false,
  }));

  // Place main style first
  favoriteStyles.sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));

  const services = (services2?.data || []).map((r: any) => ({
    id: r.services?.id,
    name: r.services?.name,
    description: r.services?.description,
    price: r?.price,
    duration: r?.duration,
  }));

  const collectionsOut = collections
    .map((c) => ({ id: c.id, name: c.name, isPortfolioCollection: c.isPortfolioCollection, thumbnails: (thumbsPerCollection[c.id] || []).slice(0, 4) }))
    .sort((a, b) => (a.isPortfolioCollection === b.isPortfolioCollection ? 0 : a.isPortfolioCollection ? -1 : 1));

  // Process location data
  const locationData = locationQ?.data as any;
  const location = locationData
    ? {
        id: locationData.id,
        address: locationData.address,
        province: {
          id: locationData.provinces?.id,
          name: locationData.provinces?.name,
          code: locationData.provinces?.code,
        },
        municipality: {
          id: locationData.municipalities?.id,
          name: locationData.municipalities?.name,
        },
        isPrimary: locationData.isPrimary,
      }
    : undefined;

  const profile: ArtistSelfProfile = {
    user: {
      id: userRow.id,
      email: userRow.email,
      username: userRow.username,
      firstName: userRow.firstName,
      lastName: userRow.lastName,
      avatar: userRow.avatar,
      instagram: userRow.instagram,
      tiktok: userRow.tiktok,
      website: artistProfile.website,
    },
    artistProfile: {
      id: artistId,
      businessName: artistProfile.businessName,
      bio: userRow.bio,
      mainStyleId: artistProfile.mainStyleId || null,
      banner: (banner2?.data || []) as any[],
    },
    location,
    favoriteStyles,
    services,
    collections: collectionsOut,
    bodyPartsNotWorkedOn,
  };

  // Step 3: Save to cache for next time
  saveProfileToCache(userId, profile).catch((err) =>
    console.error("Failed to cache profile:", err)
  );

  return profile;
}

/**
 * Force refresh profile from Supabase and update cache
 */
export async function syncProfileToCache(userId: string): Promise<ArtistSelfProfile> {
  return fetchArtistSelfProfile(userId, true);
}

// Following list types
export type FollowingUser = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: "ARTIST" | "TATTOO_LOVER";
  subscriptionPlanType?: "PREMIUM" | "STUDIO" | null;
  location?: {
    municipality?: string;
    province?: string;
  };
};

/**
 * Fetch all users that the current user is following
 * Returns separate arrays for artists and tattoo lovers
 */
export async function fetchFollowingUsers(userId: string): Promise<{
  artists: FollowingUser[];
  tattooLovers: FollowingUser[];
}> {
  // Fetch all follows for the user
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select(`
      followingId,
      following:users!follows_followingId_fkey(
        id,
        username,
        firstName,
        lastName,
        avatar,
        role
      )
    `)
    .eq("followerId", userId);

  if (followsError) throw new Error(followsError.message);
  if (!follows || follows.length === 0) {
    return { artists: [], tattooLovers: [] };
  }

  // Extract user IDs
  const followingUserIds = follows.map((f: any) => f.followingId);

  // Fetch primary locations for all following users
  const { data: locations } = await supabase
    .from("user_locations")
    .select(`
      userId,
      municipalities(name),
      provinces(name,code)
    `)
    .in("userId", followingUserIds)
    .eq("isPrimary", true);

  // Fetch subscriptions for all following users
  const { data: subscriptions } = await supabase
    .from("user_subscriptions")
    .select(`
      userId,
      subscription_plans(type)
    `)
    .in("userId", followingUserIds)
    .eq("status", "ACTIVE");

  // Create lookup maps
  const locationMap = new Map();
  if (locations) {
    locations.forEach((loc: any) => {
      locationMap.set(loc.userId, {
        municipality: loc.municipalities?.name,
        province: loc.provinces?.code || loc.provinces?.name,
      });
    });
  }

  const subscriptionMap = new Map();
  if (subscriptions) {
    subscriptions.forEach((sub: any) => {
      subscriptionMap.set(sub.userId, sub.subscription_plans?.type);
    });
  }

  // Map follows to FollowingUser type
  const followingUsers: FollowingUser[] = follows
    .map((f: any) => {
      const user = f.following;
      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        subscriptionPlanType: subscriptionMap.get(user.id) || null,
        location: locationMap.get(user.id) || undefined,
      };
    })
    .filter(Boolean) as FollowingUser[];

  // Separate artists and tattoo lovers
  const artists = followingUsers.filter(u => u.role === "ARTIST");
  const tattooLovers = followingUsers.filter(u => u.role === "TATTOO_LOVER");

  return { artists, tattooLovers };
}


