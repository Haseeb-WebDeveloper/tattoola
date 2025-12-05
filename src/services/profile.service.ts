import { ArtistSelfProfileInterface } from "@/types/artist";
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return null;
    }

    const { data, error } = await supabase
      .from("user_locations")
      .select(
        `
        provinceId,
        municipalityId,
        province:provinces(id, name),
        municipality:municipalities(id, name)
      `
      )
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
export async function isFollowing(
  userId: string,
  targetUserId: string
): Promise<boolean> {
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

export async function fetchArtistSelfProfile(
  userId: string,
  forceRefresh = false
): Promise<ArtistSelfProfileInterface> {
  // Step 1: Try cache first (unless forceRefresh is true)
  if (!forceRefresh) {
    const cached = await getProfileFromCache(userId);
    if (cached) {
      const cachedWorkArrangement = (cached as ArtistSelfProfileInterface)?.artistProfile?.workArrangement;

      // If cached profile is missing workArrangement, force refresh to get it
      if (cachedWorkArrangement === undefined) {
        // Force refresh to get workArrangement from database
        return await fetchArtistSelfProfile(userId, true);
      }

      // Optionally trigger background sync if cache is stale
      shouldRefreshCache(userId).then((shouldRefresh) => {
        if (shouldRefresh) {
          // Trigger background refresh without awaiting
          fetchArtistSelfProfile(userId, true).catch((err) =>
            console.error("Background sync failed:", err)
          );
        }
      });

      return cached;
    }
  }

  // Step 2: fetch user + artist profile from Supabase
  // First, let's verify workArrangement exists by querying artist_profiles directly
  const { data: directProfileCheck, error: directError } = await supabase
    .from("artist_profiles")
    .select("id, workArrangement, businessName")
    .eq("userId", userId)
    .single();
  
  const userQ = await supabase
    .from("users")
    .select(
      `id,email,username,firstName,lastName,avatar,bio,instagram,tiktok,
       artist_profiles(id,businessName,instagram,website,phone,bannerType,workArrangement)`
    )
    .eq("id", userId)
    .single();

  if (userQ.error) {
    console.error("❌ Error fetching user profile:", userQ.error);
    throw new Error(userQ.error.message);
  }
  
  const userRow: any = userQ.data;
  
  const artistProfile = Array.isArray(userRow?.artist_profiles)
    ? userRow.artist_profiles[0]
    : userRow?.artist_profiles;
  
  if (!artistProfile?.workArrangement && directProfileCheck?.workArrangement) {
    artistProfile.workArrangement = directProfileCheck.workArrangement;
  }

  if (!artistProfile) {
    // Return a safe empty profile instead of throwing so UI can render gracefully
    const emptyProfile: ArtistSelfProfileInterface = {
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
        workArrangement: undefined,
        banner: [],
      } as ArtistSelfProfileInterface["artistProfile"],
      location: undefined,
      favoriteStyles: [],
      services: [],
      collections: [],
      bodyPartsNotWorkedOn: [],
    };
    return emptyProfile;
  }

  const artistId = artistProfile.id as string;
  const activeBannerType = artistProfile.bannerType || "FOUR_IMAGES";

  // Step 2: parallel dependent queries (treat errors as empty for resilience)
  const [
    banner2,
    favStyles2,
    services2,
    collectionsQ,
    allBodyPartsQ,
    artistBodyParts2,
    locationQ,
  ] = await Promise.all([
    supabase
      .from("artist_banner_media")
      .select("mediaType,mediaUrl,order")
      .eq("artistId", artistId)
      .eq("bannerType", activeBannerType)
      .order("order", { ascending: true }),
    supabase
      .from("artist_styles")
      .select("styleId,order, isFavorite, tattoo_styles(id,name,imageUrl)")
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
      .select(
        `
        id,
        address,
        isPrimary,
        provinces(id,name,code),
        municipalities(id,name)
      `
      )
      .eq("userId", userId)
      .eq("isPrimary", true)
      .maybeSingle(),
  ]);

  // Build collections thumbnails (first 4 post media)
  const collections = (collectionsQ?.data || []) as {
    id: string;
    name: string;
    isPortfolioCollection: boolean;
  }[];
  const thumbsPerCollection: Record<string, string[]> = {};
  if (collections.length > 0) {
    const postsInCollections = await supabase
      .from("collection_posts")
      .select("collectionId, postId")
      .in(
        "collectionId",
        collections.map((c) => c.id)
      );
    if (
      !postsInCollections.error &&
      postsInCollections.data &&
      postsInCollections.data.length
    ) {
      const postIds = Array.from(
        new Set(postsInCollections.data.map((r: any) => r.postId))
      );
      if (postIds.length) {
        const mediaQ = await supabase
          .from("post_media")
          .select("postId, mediaUrl, order")
          .in("postId", postIds)
          .order("order", { ascending: true });
        const byPost: Record<string, { mediaUrl: string; order: number }[]> =
          {};
        if (!mediaQ.error && mediaQ.data) {
          for (const m of mediaQ.data as any[]) {
            byPost[m.postId] = byPost[m.postId] || [];
            byPost[m.postId].push({ mediaUrl: m.mediaUrl, order: m.order });
          }
        }
        for (const cp of postsInCollections.data as any[]) {
          const first = (byPost[cp.postId] || []).sort(
            (a, b) => a.order - b.order
          )[0];
          if (first) {
            thumbsPerCollection[cp.collectionId] =
              thumbsPerCollection[cp.collectionId] || [];
            if (thumbsPerCollection[cp.collectionId].length < 4) {
              thumbsPerCollection[cp.collectionId].push(first.mediaUrl);
            }
          }
        }
      }
    }
  }

  const workedIds = new Set(
    (artistBodyParts2?.data || []).map((r: any) => r.bodyPartId)
  );
  const bodyPartsNotWorkedOn = (allBodyPartsQ?.data || [])
    .filter((bp: any) => !workedIds.has(bp.id))
    .map((bp: any) => ({ id: bp.id, name: bp.name }));

  // Return all styles with isFavorite flag (not just favorites)
  const allStyles = (favStyles2?.data || []).map((r: any) => ({
    id: r.tattoo_styles?.id,
    name: r.tattoo_styles?.name,
    imageUrl: r.tattoo_styles?.imageUrl,
    isFavorite: r.isFavorite || false,
  }));

  const services = (services2?.data || []).map((r: any) => ({
    id: r.services?.id,
    name: r.services?.name,
    description: r.services?.description,
    price: r?.price,
    duration: r?.duration,
  }));

  const collectionsOut = collections
    .map((c) => ({
      id: c.id,
      name: c.name,
      isPortfolioCollection: c.isPortfolioCollection,
      thumbnails: (thumbsPerCollection[c.id] || []).slice(0, 4),
    }))
    .sort((a, b) =>
      a.isPortfolioCollection === b.isPortfolioCollection
        ? 0
        : a.isPortfolioCollection
          ? -1
          : 1
    );

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

  const profile: ArtistSelfProfileInterface = {
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
      workArrangement: (artistProfile.workArrangement || undefined) as "STUDIO_OWNER" | "STUDIO_EMPLOYEE" | "FREELANCE" | undefined,
      banner: (banner2?.data || []) as any[],
    } as ArtistSelfProfileInterface["artistProfile"],
    location,
    favoriteStyles: allStyles,
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
export async function syncProfileToCache(
  userId: string
): Promise<ArtistSelfProfileInterface> {
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
    .select(
      `
      followingId,
      following:users!follows_followingId_fkey(
        id,
        username,
        firstName,
        lastName,
        avatar,
        role
      )
    `
    )
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
    .select(
      `
      userId,
      municipalities(name),
      provinces(name,code)
    `
    )
    .in("userId", followingUserIds)
    .eq("isPrimary", true);

  // Fetch subscriptions for all following users
  const { data: subscriptions } = await supabase
    .from("user_subscriptions")
    .select(
      `
      userId,
      subscription_plans(type)
    `
    )
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
  const artists = followingUsers.filter((u) => u.role === "ARTIST");
  const tattooLovers = followingUsers.filter((u) => u.role === "TATTOO_LOVER");

  return { artists, tattooLovers };
}

// ===== TATTOO LOVER PROFILE =====

export type TattooLoverSelfProfile = {
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    instagram?: string;
    tiktok?: string;
  };
  location?: {
    province: {
      name: string;
    };
    municipality: {
      name: string;
    };
  };
  favoriteStyles: { id: string; name: string }[];
  posts: {
    id: string;
    thumbnailUrl?: string;
    caption?: string;
    createdAt: string;
    media: {
      id: string;
      mediaType: "IMAGE" | "VIDEO";
      mediaUrl: string;
      order: number;
    }[];
  }[];
  likedPosts: {
    id: string;
    thumbnailUrl?: string;
    caption?: string;
    createdAt: string;
    media: {
      id: string;
      mediaType: "IMAGE" | "VIDEO";
      mediaUrl: string;
      order: number;
    }[];
  }[];
  followedArtists: FollowingUser[];
  followedTattooLovers: FollowingUser[];
};

/**
 * Fetch tattoo lover's own profile
 * Includes basic user info, location, favorite styles, and their posts
 */
export async function fetchTattooLoverSelfProfile(
  userId: string,
  forceRefresh = false
): Promise<TattooLoverSelfProfile> {
  // Step 1: Try cache first (unless forceRefresh is true)
  if (!forceRefresh) {
    const cached = await getProfileFromCache(userId);
    if (cached) {
      console.log("📦 Using cached tattoo lover profile for user:", userId);
      shouldRefreshCache(userId).then((shouldRefresh) => {
        if (shouldRefresh) {
          console.log(
            "🔄 Cache is stale (tattoo lover), triggering background sync..."
          );
          fetchTattooLoverSelfProfile(userId, true).catch((err) =>
            console.error("Background sync failed (tattoo lover):", err)
          );
        }
      });
      return cached as TattooLoverSelfProfile;
    }
  }

  console.log(
    "🌐 Fetching tattoo lover profile from Supabase for user:",
    userId
  );

  // Fetch user basic info
  const userQ = await supabase
    .from("users")
    .select("id, username, firstName, lastName, avatar, instagram, tiktok")
    .eq("id", userId)
    .single();

  if (userQ.error) throw new Error(userQ.error.message);
  const userRow: any = userQ.data;

  // Fetch location, favorite styles, posts, liked posts, and followed artists in parallel
  const [locationQ, favStylesQ, postsQ, likedPostsQ, followsQ] =
    await Promise.all([
      supabase
        .from("user_locations")
        .select(
          `
        id,
        provinces(name),
        municipalities(name)
      `
        )
        .eq("userId", userId)
        .eq("isPrimary", true)
        .maybeSingle(),
      supabase
        .from("user_favorite_styles")
        .select("styleId, order, tattoo_styles(id, name)")
        .eq("userId", userId)
        .order("order", { ascending: true }),
      supabase
        .from("posts")
        .select("id, caption, thumbnailUrl, createdAt")
        .eq("authorId", userId)
        .eq("isActive", true)
        .order("createdAt", { ascending: false }),
      supabase
        .from("post_likes")
        .select(
          `
        postId,
        createdAt,
        posts(id, caption, thumbnailUrl, createdAt, isActive)
      `
        )
        .eq("userId", userId)
        .order("createdAt", { ascending: false }),
      supabase
        .from("follows")
        .select(
          `
        followingId,
        users:followingId (
          id,
          username,
          firstName,
          lastName,
          avatar,
          role
        )
      `
        )
        .eq("followerId", userId)
        .order("createdAt", { ascending: false }),
    ]);

  // Process location
  const locationData = locationQ?.data as any;
  const location = locationData
    ? {
        province: {
          name: locationData.provinces?.name || "",
        },
        municipality: {
          name: locationData.municipalities?.name || "",
        },
      }
    : undefined;

  // Process favorite styles
  const favoriteStyles = (favStylesQ?.data || []).map((r: any) => ({
    id: r.tattoo_styles?.id,
    name: r.tattoo_styles?.name,
  }));

  // Process posts and fetch their media
  const posts = postsQ?.data || [];
  let postsWithMedia: TattooLoverSelfProfile["posts"] = [];

  if (posts.length > 0) {
    const postIds = posts.map((p: any) => p.id);
    const mediaQ = await supabase
      .from("post_media")
      .select("id, postId, mediaType, mediaUrl, order")
      .in("postId", postIds)
      .order("order", { ascending: true });

    const mediaByPost: Record<string, any[]> = {};
    if (!mediaQ.error && mediaQ.data) {
      for (const m of mediaQ.data as any[]) {
        mediaByPost[m.postId] = mediaByPost[m.postId] || [];
        mediaByPost[m.postId].push({
          id: m.id,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          order: m.order,
        });
      }
    }

    postsWithMedia = posts.map((p: any) => ({
      id: p.id,
      thumbnailUrl: p.thumbnailUrl,
      caption: p.caption,
      createdAt: p.createdAt,
      media: mediaByPost[p.id] || [],
    }));
  }

  // Process liked posts and fetch their media
  const likedPostsData = (likedPostsQ?.data || [])
    .map((like: any) => like.posts)
    .filter((post: any) => post && post.isActive); // Only include active posts

  let likedPostsWithMedia: TattooLoverSelfProfile["likedPosts"] = [];

  if (likedPostsData.length > 0) {
    const likedPostIds = likedPostsData.map((p: any) => p.id);
    const likedMediaQ = await supabase
      .from("post_media")
      .select("id, postId, mediaType, mediaUrl, order")
      .in("postId", likedPostIds)
      .order("order", { ascending: true });

    const likedMediaByPost: Record<string, any[]> = {};
    if (!likedMediaQ.error && likedMediaQ.data) {
      for (const m of likedMediaQ.data as any[]) {
        likedMediaByPost[m.postId] = likedMediaByPost[m.postId] || [];
        likedMediaByPost[m.postId].push({
          id: m.id,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          order: m.order,
        });
      }
    }

    likedPostsWithMedia = likedPostsData.map((p: any) => ({
      id: p.id,
      thumbnailUrl: p.thumbnailUrl,
      caption: p.caption,
      createdAt: p.createdAt,
      media: likedMediaByPost[p.id] || [],
    }));
  }

  // Process followed users - separate artists and tattoo lovers
  const followedUsersData = (followsQ?.data || [])
    .map((follow: any) => follow.users)
    .filter((user: any) => user);

  const followedArtistsData = followedUsersData.filter(
    (user: any) => user.role === "ARTIST"
  );
  const followedTattooLoversData = followedUsersData.filter(
    (user: any) => user.role === "TATTOO_LOVER"
  );

  // Get full user details with location and subscription
  let followedArtists: FollowingUser[] = [];
  let followedTattooLovers: FollowingUser[] = [];

  const allFollowedIds = followedUsersData.map((u: any) => u.id);

  if (allFollowedIds.length > 0) {
    // Fetch locations and subscriptions for all followed users
    const [locationsQ, subscriptionsQ] = await Promise.all([
      supabase
        .from("user_locations")
        .select(
          `
          userId,
          provinces(name),
          municipalities(name)
        `
        )
        .in("userId", allFollowedIds)
        .eq("isPrimary", true),
      supabase
        .from("user_subscriptions")
        .select(
          `
          userId,
          planId,
          status,
          subscription_plans(type)
        `
        )
        .in("userId", allFollowedIds)
        .eq("status", "ACTIVE"),
    ]);

    const locationsByUserId: Record<string, any> = {};
    if (locationsQ.data) {
      for (const loc of locationsQ.data as any[]) {
        locationsByUserId[loc.userId] = {
          province: loc.provinces?.name,
          municipality: loc.municipalities?.name,
        };
      }
    }

    const subscriptionsByUserId: Record<string, string> = {};
    if (subscriptionsQ.data) {
      for (const sub of subscriptionsQ.data as any[]) {
        subscriptionsByUserId[sub.userId] = sub.subscription_plans?.type;
      }
    }

    // Map artists
    followedArtists = followedArtistsData.map((user: any) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      location: locationsByUserId[user.id],
      subscriptionPlanType: subscriptionsByUserId[user.id] as
        | "PREMIUM"
        | "STUDIO"
        | undefined,
    }));

    // Map tattoo lovers
    followedTattooLovers = followedTattooLoversData.map((user: any) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      location: locationsByUserId[user.id],
      subscriptionPlanType: subscriptionsByUserId[user.id] as
        | "PREMIUM"
        | "STUDIO"
        | undefined,
    }));
  }

  const profileTL: TattooLoverSelfProfile = {
    user: {
      id: userRow.id,
      username: userRow.username,
      firstName: userRow.firstName,
      lastName: userRow.lastName,
      avatar: userRow.avatar,
      instagram: userRow.instagram,
      tiktok: userRow.tiktok,
    },
    location,
    favoriteStyles,
    posts: postsWithMedia,
    likedPosts: likedPostsWithMedia,
    followedArtists,
    followedTattooLovers,
  };

  // Save to cache for next time (fire-and-forget)
  saveProfileToCache(userId, profileTL).catch((err) =>
    console.error("Failed to cache tattoo lover profile:", err)
  );

  return profileTL;
}

// ===== OTHER USER PROFILES (for viewing other users) =====

export type TattooLoverProfile = {
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    instagram?: string;
    tiktok?: string;
    isPublic: boolean;
  };
  location?: {
    province: {
      name: string;
    };
    municipality: {
      name: string;
    };
  };
  favoriteStyles: { id: string; name: string }[];
  posts: {
    id: string;
    thumbnailUrl?: string;
    caption?: string;
    createdAt: string;
    media: {
      id: string;
      mediaType: "IMAGE" | "VIDEO";
      mediaUrl: string;
      order: number;
    }[];
  }[];
  likedPosts: {
    id: string;
    thumbnailUrl?: string;
    caption?: string;
    createdAt: string;
    media: {
      id: string;
      mediaType: "IMAGE" | "VIDEO";
      mediaUrl: string;
      order: number;
    }[];
  }[];
  followedArtists: FollowingUser[];
  followedTattooLovers: FollowingUser[];
  isFollowing?: boolean;
};

/**
 * Fetch another tattoo lover's profile (not self)
 * Respects privacy settings - only shows posts/liked/followed if user is public
 */
export async function fetchTattooLoverProfile(
  userId: string,
  viewerId?: string
): Promise<TattooLoverProfile> {
  console.log(
    "🌐 Fetching tattoo lover profile for:",
    userId,
    "viewer:",
    viewerId
  );

  // Fetch basic user info including isPublic
  const userQ = await supabase
    .from("users")
    .select(
      "id, username, firstName, lastName, avatar, instagram, tiktok, isPublic"
    )
    .eq("id", userId)
    .single();

  if (userQ.error) throw new Error(userQ.error.message);
  const userRow: any = userQ.data;

  // Check if viewer is following this user
  let isFollowingUser = false;
  if (viewerId) {
    isFollowingUser = await isFollowing(viewerId, userId);
  }

  // Fetch location and favorite styles (always visible)
  const [locationQ, favStylesQ] = await Promise.all([
    supabase
      .from("user_locations")
      .select(
        `
        id,
        provinces(name),
        municipalities(name)
      `
      )
      .eq("userId", userId)
      .eq("isPrimary", true)
      .maybeSingle(),
    supabase
      .from("user_favorite_styles")
      .select("styleId, order, tattoo_styles(id, name)")
      .eq("userId", userId)
      .order("order", { ascending: true }),
  ]);

  // Process location
  const locationData = locationQ?.data as any;
  const location = locationData
    ? {
        province: {
          name: locationData.provinces?.name || "",
        },
        municipality: {
          name: locationData.municipalities?.name || "",
        },
      }
    : undefined;

  // Process favorite styles
  const favoriteStyles = (favStylesQ?.data || []).map((r: any) => ({
    id: r.tattoo_styles?.id,
    name: r.tattoo_styles?.name,
  }));

  // If profile is private, return early with empty arrays for posts/liked/followed
  if (!userRow.isPublic) {
    return {
      user: {
        id: userRow.id,
        username: userRow.username,
        firstName: userRow.firstName,
        lastName: userRow.lastName,
        avatar: userRow.avatar,
        instagram: userRow.instagram,
        tiktok: userRow.tiktok,
        isPublic: userRow.isPublic,
      },
      location,
      favoriteStyles,
      posts: [],
      likedPosts: [],
      followedArtists: [],
      followedTattooLovers: [],
      isFollowing: isFollowingUser,
    };
  }

  // If public, fetch posts, liked posts, and followed users
  const [postsQ, likedPostsQ, followsQ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, caption, thumbnailUrl, createdAt")
      .eq("authorId", userId)
      .eq("isActive", true)
      .order("createdAt", { ascending: false }),
    supabase
      .from("post_likes")
      .select(
        `
        postId,
        createdAt,
        posts(id, caption, thumbnailUrl, createdAt, isActive)
      `
      )
      .eq("userId", userId)
      .order("createdAt", { ascending: false }),
    supabase
      .from("follows")
      .select(
        `
        followingId,
        users:followingId (
          id,
          username,
          firstName,
          lastName,
          avatar,
          role
        )
      `
      )
      .eq("followerId", userId)
      .order("createdAt", { ascending: false }),
  ]);

  // Process posts with media
  const posts = postsQ?.data || [];
  let postsWithMedia: TattooLoverProfile["posts"] = [];

  if (posts.length > 0) {
    const postIds = posts.map((p: any) => p.id);
    const mediaQ = await supabase
      .from("post_media")
      .select("id, postId, mediaType, mediaUrl, order")
      .in("postId", postIds)
      .order("order", { ascending: true });

    const mediaByPost: Record<string, any[]> = {};
    if (!mediaQ.error && mediaQ.data) {
      for (const m of mediaQ.data as any[]) {
        mediaByPost[m.postId] = mediaByPost[m.postId] || [];
        mediaByPost[m.postId].push({
          id: m.id,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          order: m.order,
        });
      }
    }

    postsWithMedia = posts.map((p: any) => ({
      id: p.id,
      thumbnailUrl: p.thumbnailUrl,
      caption: p.caption,
      createdAt: p.createdAt,
      media: mediaByPost[p.id] || [],
    }));
  }

  // Process liked posts
  const likedPostsData = (likedPostsQ?.data || [])
    .map((like: any) => like.posts)
    .filter((post: any) => post && post.isActive);

  let likedPostsWithMedia: TattooLoverProfile["likedPosts"] = [];

  if (likedPostsData.length > 0) {
    const likedPostIds = likedPostsData.map((p: any) => p.id);
    const likedMediaQ = await supabase
      .from("post_media")
      .select("id, postId, mediaType, mediaUrl, order")
      .in("postId", likedPostIds)
      .order("order", { ascending: true });

    const likedMediaByPost: Record<string, any[]> = {};
    if (!likedMediaQ.error && likedMediaQ.data) {
      for (const m of likedMediaQ.data as any[]) {
        likedMediaByPost[m.postId] = likedMediaByPost[m.postId] || [];
        likedMediaByPost[m.postId].push({
          id: m.id,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          order: m.order,
        });
      }
    }

    likedPostsWithMedia = likedPostsData.map((p: any) => ({
      id: p.id,
      thumbnailUrl: p.thumbnailUrl,
      caption: p.caption,
      createdAt: p.createdAt,
      media: likedMediaByPost[p.id] || [],
    }));
  }

  // Process followed users
  const followedUsersData = (followsQ?.data || [])
    .map((follow: any) => follow.users)
    .filter((user: any) => user);

  const followedArtistsData = followedUsersData.filter(
    (user: any) => user.role === "ARTIST"
  );
  const followedTattooLoversData = followedUsersData.filter(
    (user: any) => user.role === "TATTOO_LOVER"
  );

  let followedArtists: FollowingUser[] = [];
  let followedTattooLovers: FollowingUser[] = [];

  const allFollowedIds = followedUsersData.map((u: any) => u.id);

  if (allFollowedIds.length > 0) {
    const [locationsQ, subscriptionsQ] = await Promise.all([
      supabase
        .from("user_locations")
        .select(
          `
          userId,
          provinces(name),
          municipalities(name)
        `
        )
        .in("userId", allFollowedIds)
        .eq("isPrimary", true),
      supabase
        .from("user_subscriptions")
        .select(
          `
          userId,
          planId,
          status,
          subscription_plans(type)
        `
        )
        .in("userId", allFollowedIds)
        .eq("status", "ACTIVE"),
    ]);

    const locationsByUserId: Record<string, any> = {};
    if (locationsQ.data) {
      for (const loc of locationsQ.data as any[]) {
        locationsByUserId[loc.userId] = {
          province: loc.provinces?.name,
          municipality: loc.municipalities?.name,
        };
      }
    }

    const subscriptionsByUserId: Record<string, string> = {};
    if (subscriptionsQ.data) {
      for (const sub of subscriptionsQ.data as any[]) {
        subscriptionsByUserId[sub.userId] = sub.subscription_plans?.type;
      }
    }

    followedArtists = followedArtistsData.map((user: any) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      location: locationsByUserId[user.id],
      subscriptionPlanType: subscriptionsByUserId[user.id] as
        | "PREMIUM"
        | "STUDIO"
        | undefined,
    }));

    followedTattooLovers = followedTattooLoversData.map((user: any) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      location: locationsByUserId[user.id],
      subscriptionPlanType: subscriptionsByUserId[user.id] as
        | "PREMIUM"
        | "STUDIO"
        | undefined,
    }));
  }

  return {
    user: {
      id: userRow.id,
      username: userRow.username,
      firstName: userRow.firstName,
      lastName: userRow.lastName,
      avatar: userRow.avatar,
      instagram: userRow.instagram,
      tiktok: userRow.tiktok,
      isPublic: userRow.isPublic,
    },
    location,
    favoriteStyles,
    posts: postsWithMedia,
    likedPosts: likedPostsWithMedia,
    followedArtists,
    followedTattooLovers,
    isFollowing: isFollowingUser,
  };
}

/**
 * Fetch another artist's profile (not self)
 * Similar to fetchArtistSelfProfile but for viewing other artists
 */
export async function fetchArtistProfile(
  userId: string,
  viewerId?: string
): Promise<ArtistSelfProfileInterface & { isFollowing?: boolean }> {
  console.log("🌐 Fetching artist profile for:", userId, "viewer:", viewerId);

  // Check if viewer is following this artist
  let isFollowingArtist = false;
  if (viewerId) {
    isFollowingArtist = await isFollowing(viewerId, userId);
  }

  // Reuse the existing fetchArtistSelfProfile function
  const profile = await fetchArtistSelfProfile(userId, false);

  return {
    ...profile,
    isFollowing: isFollowingArtist,
  };
}
