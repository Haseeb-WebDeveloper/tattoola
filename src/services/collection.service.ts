import type { ArtistSearchResult } from "@/types/search";
import { isSystemCollection } from "@/utils/collection.utils";
import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";

// Simple in-memory cache for collection artists
const collectionArtistsCache = new Map<
  string,
  { data: ArtistSearchResult[]; timestamp: number }
>();

function setCachedCollectionArtists(
  collectionId: string,
  data: ArtistSearchResult[]
): void {
  collectionArtistsCache.set(collectionId, { data, timestamp: Date.now() });
}

export async function fetchCollectionArtists(
  collectionId: string
): Promise<ArtistSearchResult[]> {
  if (!collectionId) return [];

  const { data, error } = await supabase
    .from("collection_artists")
    .select(
      `
      artist:artist_profiles(
        id,
        userId,
        businessName,
        yearsExperience,
        workArrangement,
        user:users(
          username,
          avatar,
          firstName,
          lastName,
          isVerified,
          locations:user_locations(
            provinceId,
            municipalityId,
            address,
            isPrimary,
            province:provinces(name,code),
            municipality:municipalities(name)
          ),
          subscriptions:user_subscriptions!user_subscriptions_userId_fkey(
            status,
            endDate,
            plan:subscription_plans(name, type)
          )
        ),
        bannerMedia:artist_banner_media(
          mediaUrl,
          mediaType,
          order
        ),
        styles:artist_styles(
          style:tattoo_styles(id, name, imageUrl)
        ),
        services:artist_services(
          serviceId,
          services:services(id, name)
        )
      )
    `
    )
    .eq("collectionId", collectionId);

  if (error) {
    console.error(
      "[collection.service] error fetching collection artists",
      error
    );
    return [];
  }

  const rows = (data || []) as any[];

  const artists: ArtistSearchResult[] = rows
    .map((row) => {
      const artist = row.artist;
      if (!artist) return null;

      const primaryLocation = artist.user?.locations?.find(
        (loc: any) => loc.isPrimary
      );

      const resolveProvinceLabel = (loc: any | null | undefined): string => {
        if (!loc?.province) return "";
        const provName = loc.province?.name || "";
        const provCode = (loc.province as any)?.code;
        if (!provName && !provCode) return "";
        return provCode ? `${provName} (${provCode})` : provName;
      };

      const location = primaryLocation
        ? {
            province: resolveProvinceLabel(primaryLocation),
            municipality: primaryLocation.municipality?.name || "",
            address: null,
          }
        : null;

      const activeSubscription = artist.user?.subscriptions?.find(
        (sub: any) =>
          sub.status === "ACTIVE" &&
          (!sub.endDate || new Date(sub.endDate) >= new Date())
      );

      const mapped: ArtistSearchResult = {
        id: artist.id,
        userId: artist.userId,
        user: {
          username: artist.user?.username ?? "",
          avatar: artist.user?.avatar ?? null,
          firstName: artist.user?.firstName ?? null,
          lastName: artist.user?.lastName ?? null,
        },
        businessName: artist.businessName ?? null,
        yearsExperience: artist.yearsExperience ?? null,
        isStudioOwner: artist.workArrangement === "STUDIO_OWNER",
        workArrangement: artist.workArrangement ?? null,
        location,
        styles:
          (artist.styles || []).map((s: any) => ({
            id: s.style?.id,
            name: s.style?.name,
            imageUrl: s.style?.imageUrl ?? null,
          })) ?? [],
        services:
          (artist.services || [])
            .filter((srv: any) => !!srv.services?.id)
            .map((srv: any) => ({
              id: srv.services.id,
              name: srv.services.name,
            })) ?? [],
        bannerMedia: (artist.bannerMedia || []).map((b: any) => ({
          mediaUrl: b.mediaUrl,
          mediaType: b.mediaType,
          order: b.order,
        })),
        subscription: activeSubscription
          ? {
              plan: {
                name: activeSubscription.plan?.name || "",
                type: activeSubscription.plan?.type || "",
              },
            }
          : null,
        isVerified: !!artist.user?.isVerified,
      };

      return mapped;
    })
    .filter(Boolean) as ArtistSearchResult[];

  // Cache the result (used only as a best-effort optimization, but
  // we always return fresh data above so admin updates are reflected
  // immediately when re-opening the collection).
  setCachedCollectionArtists(collectionId, artists);

  return artists;
}

export type CollectionPost = {
  id: string;
  postId: string;
  caption?: string;
  thumbnailUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  media: {
    id: string;
    mediaType: "IMAGE" | "VIDEO";
    mediaUrl: string;
    order: number;
  }[];
  style?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    municipality?: string;
    province?: string;
  };
};

export type CollectionDetails = {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  isPortfolioCollection: boolean;
  ownerId: string;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
  posts: CollectionPost[];
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    municipality?: string;
    province?: string;
  };
};

/**
 * Fetch collection details with posts
 */
export async function fetchCollectionDetails(
  collectionId: string
): Promise<CollectionDetails> {
  // Fetch collection basic info
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select(
      `
      id,
      name,
      description,
      isPrivate,
      isPortfolioCollection,
      ownerId,
      createdAt,
      updatedAt
    `
    )
    .eq("id", collectionId)
    .single();

  if (collectionError) throw new Error(collectionError.message);

  // Fetch collection owner data
  const { data: owner, error: ownerError } = await supabase
    .from("users")
    .select(
      `
      id,
      username,
      firstName,
      lastName,
      avatar
    `
    )
    .eq("id", collection.ownerId)
    .single();

  if (ownerError) throw new Error(ownerError.message);

  // Fetch posts in collection with all related data
  const { data: collectionPosts, error: postsError } = await supabase
    .from("collection_posts")
    .select(
      `
      postId,
      posts!inner(
        id,
        caption,
        thumbnailUrl,
        likesCount,
        commentsCount,
        createdAt,
        authorId,
        styleId,
        users!posts_authorId_fkey(id,username,firstName,lastName,avatar),
        post_media(id,mediaType,mediaUrl,order)
      )
    `
    )
    .eq("collectionId", collectionId)
    .order("addedAt", { ascending: true });

  if (postsError) throw new Error(postsError.message);

  // Fetch location data for all users (owner + post authors)
  const userIds = [
    collection.ownerId,
    ...(collectionPosts || []).map((cp: any) => cp.posts.authorId),
  ];
  const uniqueUserIds = Array.from(new Set(userIds));

  const { data: locationsData } = await supabase
    .from("user_locations")
    .select(
      `
      userId,
      municipalities(name),
      provinces(name)
    `
    )
    .in("userId", uniqueUserIds)
    .eq("isPrimary", true);

  // Create a map of userId to location data
  const locationMap = new Map();
  (locationsData || []).forEach((loc: any) => {
    locationMap.set(loc.userId, {
      municipality: loc.municipalities?.name,
      province: loc.provinces?.name,
    });
  });

  // Collect all style IDs and fetch styles separately
  const allStyleIds = new Set<string>();
  (collectionPosts || []).forEach((cp: any) => {
    const styleIds = cp.posts?.styleId || [];
    if (Array.isArray(styleIds)) {
      styleIds.forEach((id: string) => allStyleIds.add(id));
    }
  });

  // Fetch all styles in one query
  let stylesMap: Record<
    string,
    { id: string; name: string; imageUrl?: string }
  > = {};
  if (allStyleIds.size > 0) {
    const { data: stylesData } = await supabase
      .from("tattoo_styles")
      .select("id, name, imageUrl")
      .in("id", Array.from(allStyleIds));

    if (stylesData) {
      stylesData.forEach((style: any) => {
        stylesMap[style.id] = {
          id: style.id,
          name: style.name,
          imageUrl: style.imageUrl,
        };
      });
    }
  }

  const posts: CollectionPost[] = (collectionPosts || []).map((cp: any) => {
    const authorLocation = locationMap.get(cp.posts.authorId) || {};

    // Get first style from array (for backward compatibility)
    const styleIds = cp.posts?.styleId || [];
    const firstStyleId =
      Array.isArray(styleIds) && styleIds.length > 0 ? styleIds[0] : null;
    const firstStyle = firstStyleId ? stylesMap[firstStyleId] : undefined;

    return {
      id: cp.postId,
      postId: cp.postId,
      caption: cp.posts.caption,
      thumbnailUrl: cp.posts.thumbnailUrl,
      likesCount: cp.posts.likesCount,
      commentsCount: cp.posts.commentsCount,
      createdAt: cp.posts.createdAt,
      media: (cp.posts.post_media || []).sort(
        (a: any, b: any) => a.order - b.order
      ),
      style: firstStyle,
      author: {
        id: cp.posts.users.id,
        username: cp.posts.users.username,
        firstName: cp.posts.users.firstName,
        lastName: cp.posts.users.lastName,
        avatar: cp.posts.users.avatar,
        municipality: authorLocation.municipality,
        province: authorLocation.province,
      },
    };
  });

  const ownerLocation = locationMap.get(collection.ownerId) || {};

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isPrivate: collection.isPrivate,
    isPortfolioCollection: collection.isPortfolioCollection,
    ownerId: collection.ownerId,
    postsCount: posts.length,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    posts,
    author: {
      id: owner.id,
      username: owner.username,
      firstName: owner.firstName,
      lastName: owner.lastName,
      avatar: owner.avatar,
      municipality: ownerLocation.municipality,
      province: ownerLocation.province,
    },
  };
}

/**
 * Update collection name
 */
export async function updateCollectionName(
  collectionId: string,
  name: string
): Promise<void> {
  // First, check if this is a system collection
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("name")
    .eq("id", collectionId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  // Prevent editing system collections
  if (collection && isSystemCollection(collection.name)) {
    throw new Error(
      "Non puoi modificare il nome di questa collezione di sistema"
    );
  }

  const { error } = await supabase
    .from("collections")
    .update({ name, updatedAt: new Date().toISOString() })
    .eq("id", collectionId);

  if (error) throw new Error(error.message);
}

/**
 * Remove post from collection
 */
export async function removePostFromCollection(
  collectionId: string,
  postId: string
): Promise<void> {
  const { error } = await supabase
    .from("collection_posts")
    .delete()
    .eq("collectionId", collectionId)
    .eq("postId", postId);

  if (error) throw new Error(error.message);
}

/**
 * Reorder posts in collection
 */
export async function reorderCollectionPosts(
  collectionId: string,
  postIds: string[]
): Promise<void> {
  // Remove duplicates from postIds array
  const uniquePostIds = Array.from(new Set(postIds));

  if (uniquePostIds.length !== postIds.length) {
    console.warn(
      `Removed ${postIds.length - uniquePostIds.length} duplicate postIds before reordering`
    );
  }

  // Since we don't have an order field in collection_posts, we'll delete and re-insert
  // This is not ideal for performance but works for now
  const { error: deleteError } = await supabase
    .from("collection_posts")
    .delete()
    .eq("collectionId", collectionId);

  if (deleteError) throw new Error(deleteError.message);

  if (uniquePostIds.length > 0) {
    const { error: insertError } = await supabase
      .from("collection_posts")
      .insert(
        uniquePostIds.map((postId, index) => ({
          id: uuidv4(), // Generate UUID for the id field
          collectionId,
          postId,
          addedAt: new Date(Date.now() + index * 1000).toISOString(), // Add small delay to maintain order
        }))
      );

    if (insertError) throw new Error(insertError.message);
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  ownerId: string,
  name: string
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("collections")
    .insert({
      id: uuidv4(), // Generate UUID for the id field
      ownerId,
      name,
      isPrivate: false,
      isPortfolioCollection: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch user's posts
 */
export async function fetchUserPosts(
  userId: string
): Promise<Array<{ id: string; caption?: string; thumbnailUrl?: string }>> {
  const { data, error } = await supabase
    .from("posts")
    .select("id,caption,thumbnailUrl")
    .eq("authorId", userId)
    .order("createdAt", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Add posts to collection
 */
export async function addPostsToCollection(
  collectionId: string,
  postIds: string[]
): Promise<void> {
  const { error } = await supabase.from("collection_posts").insert(
    postIds.map((postId) => ({
      id: uuidv4(), // Generate UUID for the id field
      collectionId,
      postId,
      addedAt: new Date().toISOString(),
    }))
  );

  if (error) throw new Error(error.message);
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  // First, check if this is a system collection
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("name")
    .eq("id", collectionId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  // Prevent deleting system collections
  if (collection && isSystemCollection(collection.name)) {
    throw new Error("Non puoi eliminare questa collezione di sistema");
  }

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  if (error) throw new Error(error.message);
}
