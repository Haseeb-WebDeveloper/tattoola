import {
    getProfileFromCache,
    saveProfileToCache,
    shouldRefreshCache,
} from "@/utils/database";
import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";

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
    province?: string;
    municipality?: string;
  };
  artistProfile: {
    id: string;
    businessName?: string;
    province?: string;
    municipality?: string;
    bio?: string;
    mainStyleId?: string | null;
    banner: { mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; order: number }[];
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
      `id,email,username,firstName,lastName,avatar,bio,instagram,tiktok,province,municipality,
       artist_profiles(id,businessName,province,municipality,instagram,website,phone,mainStyleId)`
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
        province: userRow.province,
        municipality: userRow.municipality,
      },
      artistProfile: {
        id: "",
        businessName: undefined,
        province: userRow.province,
        municipality: userRow.municipality,
        bio: undefined,
        mainStyleId: null,
        banner: [],
      },
      favoriteStyles: [],
      services: [],
      collections: [],
      bodyPartsNotWorkedOn: [],
    };
  }

  const artistId = artistProfile.id as string;

  // Step 2: parallel dependent queries (treat errors as empty for resilience)
  const [banner2, favStyles2, services2, collectionsQ, allBodyPartsQ, artistBodyParts2] = await Promise.all([
    supabase
      .from("artist_banner_media")
      .select("mediaType,mediaUrl,order")
      .eq("artistId", artistId)
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
      province: userRow.province,
      municipality: userRow.municipality,
    },
    artistProfile: {
      id: artistId,
      businessName: artistProfile.businessName,
      province: artistProfile.province,
      municipality: artistProfile.municipality,
      bio: userRow.bio,
      mainStyleId: artistProfile.mainStyleId || null,
      banner: (banner2?.data || []) as any[],
    },
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


