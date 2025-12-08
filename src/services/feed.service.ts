import { supabase } from "@/utils/supabase";
import { FeedPost } from "./post.service";

export type FeedContentType = "MAGAZINE" | "BANNER" | "ARTIST" | "USER" | "ADMIN_COLLECTION";

export type BannerFeedItem = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  redirectUrl: string;
  size: "SMALL" | "MEDIUM" | "LARGE";
};

export type FeedEntry =
  | {
      kind: "post";
      position: number;
      post: FeedPost;
      groupId?: string;
    }
  | {
      kind: "banner";
      position: number;
      banner: BannerFeedItem;
    };

export type FeedItemsPage = {
  items: FeedEntry[];
  nextOffset: number | null;
};

type RawFeedItem = {
  id: string;
  position: number;
  contentType: FeedContentType;
  bannerId?: string | null;
  artistId?: string | null;
  userId?: string | null;
  collectionId?: string | null;
  postId?: string | null;
  banner?: {
    id: string;
    title: string;
    thumbnailUrl?: string | null;
    redirectUrl: string;
    size: "SMALL" | "MEDIUM" | "LARGE";
  } | null;
};

const FEED_ITEMS_PER_PAGE = 10;

/**
 * Fetch a page of admin-managed feed items and resolve them into concrete feed entries.
 *
 * Notes per content type:
 * - MAGAZINE: currently ignored for MVP (see TODO below).
 * - BANNER: rendered as a banner feed entry with redirectUrl navigation.
 * - ARTIST / USER: expected to have postId; we resolve and render that post.
 * - ADMIN_COLLECTION: expected to have collectionId; we fetch all posts in that collection
 *   and expand them into multiple post entries that share the same position.
 */
export async function fetchFeedItemsPage(args: {
  userId: string;
  offset?: number;
  limit?: number;
}): Promise<FeedItemsPage> {
  const { userId, offset = 0, limit = FEED_ITEMS_PER_PAGE } = args;

  // Fetch raw feed items ordered by position, including joined banner data.
  const { data: rawItems, error } = await supabase
    .from("feed_items")
    .select(
      `
      id,
      position,
      contentType,
      bannerId,
      artistId,
      userId,
      collectionId,
      postId,
      banner:banners(
        id,
        title,
        thumbnailUrl,
        redirectUrl,
        size
      )
    `
    )
    .eq("isActive", true)
    .order("position", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[feed.service] error fetching feed_items", error);
    throw new Error(error.message);
  }

  const items = (rawItems || []) as RawFeedItem[];

  if (!items.length) {
    return { items: [], nextOffset: null };
  }

  // Collect IDs for batch fetching of posts / collections.
  const singlePostIds: string[] = [];
  const collectionIds: string[] = [];

  items.forEach((item) => {
    if (item.contentType === "ARTIST" || item.contentType === "USER") {
      if (item.postId) {
        singlePostIds.push(item.postId);
      }
    } else if (item.contentType === "ADMIN_COLLECTION") {
      if (item.collectionId) {
        collectionIds.push(item.collectionId);
      }
    }
  });

  // Fetch posts for ARTIST / USER.
  let postsById: Record<string, FeedPost> = {};
  if (singlePostIds.length > 0) {
    const { data: postRows, error: postsError } = await supabase
      .from("posts")
      .select(
        `
        id,caption,thumbnailUrl,likesCount,commentsCount,createdAt,authorId,styleId,
        users!posts_authorId_fkey(id,username,firstName,lastName,avatar),
        post_media(id,mediaType,mediaUrl,order)
      `
      )
      .in("id", singlePostIds);

    if (postsError) {
      console.error("[feed.service] error fetching posts for ARTIST/USER feed items", postsError);
    } else {
      const rows = (postRows || []) as any[];
      
      // Collect all style IDs and fetch styles separately
      const allStyleIds = new Set<string>();
      rows.forEach((r) => {
        const styleIds = r.styleId || [];
        if (Array.isArray(styleIds)) {
          styleIds.forEach((id: string) => allStyleIds.add(id));
        }
      });

      // Fetch all styles in one query
      let stylesMap: Record<string, { id: string; name: string }> = {};
      if (allStyleIds.size > 0) {
        const { data: stylesData } = await supabase
          .from("tattoo_styles")
          .select("id, name")
          .in("id", Array.from(allStyleIds));
        
        if (stylesData) {
          stylesData.forEach((style: any) => {
            stylesMap[style.id] = { id: style.id, name: style.name };
          });
        }
      }

      rows.forEach((r) => {
        // Get first style from array (for backward compatibility with FeedPost type)
        const styleIds = r.styleId || [];
        const firstStyleId = Array.isArray(styleIds) && styleIds.length > 0 ? styleIds[0] : null;
        const firstStyle = firstStyleId ? stylesMap[firstStyleId] : undefined;

        postsById[r.id] = {
          id: r.id,
          caption: r.caption,
          createdAt: r.createdAt,
          likesCount: r.likesCount,
          commentsCount: r.commentsCount,
          // For now we don't compute isLiked here (only required for feed overlay / like state);
          // store will still handle optimistic toggling by postId.
          isLiked: false,
          style: firstStyle,
          author: {
            id: r.users.id,
            username: r.users.username,
            firstName: r.users.firstName,
            lastName: r.users.lastName,
            avatar: r.users.avatar,
          },
          media: (r.post_media || []).sort(
            (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
          ),
        };
      });
    }
  }

  // Fetch collection posts for ADMIN_COLLECTION.
  let collectionPostsByCollectionId: Record<string, FeedPost[]> = {};
  if (collectionIds.length > 0) {
    const { data: collectionRows, error: collectionError } = await supabase
      .from("collection_posts")
      .select(
        `
        collectionId,
        posts:posts!collection_posts_postId_fkey(
          id,caption,thumbnailUrl,likesCount,commentsCount,createdAt,authorId,styleId,
          users!posts_authorId_fkey(id,username,firstName,lastName,avatar),
          post_media(id,mediaType,mediaUrl,order)
        )
      `
      )
      .in("collectionId", collectionIds);

    if (collectionError) {
      console.error(
        "[feed.service] error fetching collection_posts for ADMIN_COLLECTION feed items",
        collectionError
      );
    } else {
      const rows = (collectionRows || []) as any[];
      
      // Collect all style IDs from collection posts
      const allCollectionStyleIds = new Set<string>();
      rows.forEach((row) => {
        const post = row.posts;
        if (post && post.styleId) {
          const styleIds = post.styleId || [];
          if (Array.isArray(styleIds)) {
            styleIds.forEach((id: string) => allCollectionStyleIds.add(id));
          }
        }
      });

      // Fetch all styles in one query
      let collectionStylesMap: Record<string, { id: string; name: string }> = {};
      if (allCollectionStyleIds.size > 0) {
        const { data: stylesData } = await supabase
          .from("tattoo_styles")
          .select("id, name")
          .in("id", Array.from(allCollectionStyleIds));
        
        if (stylesData) {
          stylesData.forEach((style: any) => {
            collectionStylesMap[style.id] = { id: style.id, name: style.name };
          });
        }
      }

      rows.forEach((row) => {
        const colId = row.collectionId as string;
        const post = row.posts;
        if (!post) return;
        
        // Get first style from array (for backward compatibility with FeedPost type)
        const styleIds = post.styleId || [];
        const firstStyleId = Array.isArray(styleIds) && styleIds.length > 0 ? styleIds[0] : null;
        const firstStyle = firstStyleId ? collectionStylesMap[firstStyleId] : undefined;

        const mapped: FeedPost = {
          id: post.id,
          caption: post.caption,
          createdAt: post.createdAt,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          isLiked: false,
          style: firstStyle,
          author: {
            id: post.users.id,
            username: post.users.username,
            firstName: post.users.firstName,
            lastName: post.users.lastName,
            avatar: post.users.avatar,
          },
          media: (post.post_media || []).sort(
            (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
          ),
        };
        if (!collectionPostsByCollectionId[colId]) {
          collectionPostsByCollectionId[colId] = [];
        }
        collectionPostsByCollectionId[colId].push(mapped);
      });
    }
  }

  // Build final flattened feed entries, preserving position ordering.
  const feedEntries: FeedEntry[] = [];

  items.forEach((item) => {
    switch (item.contentType) {
      case "MAGAZINE":
        // TODO: handle MAGAZINE feed items after MVP (currently ignored).
        return;
      case "BANNER": {
        if (!item.banner && !item.bannerId) return;
        const bannerSource = item.banner;
        if (!bannerSource) return;
        const banner: BannerFeedItem = {
          id: bannerSource.id,
          title: bannerSource.title,
          thumbnailUrl: bannerSource.thumbnailUrl,
          redirectUrl: bannerSource.redirectUrl,
          size: bannerSource.size,
        };
        feedEntries.push({
          kind: "banner",
          position: item.position,
          banner,
        });
        return;
      }
      case "ARTIST":
      case "USER": {
        if (!item.postId) return;
        const post = postsById[item.postId];
        if (!post) return;
        feedEntries.push({
          kind: "post",
          position: item.position,
          post,
        });
        return;
      }
      case "ADMIN_COLLECTION": {
        if (!item.collectionId) return;
        const posts = collectionPostsByCollectionId[item.collectionId] || [];
        if (!posts.length) return;
        const groupId = `collection:${item.collectionId}`;
        posts.forEach((post) => {
          feedEntries.push({
            kind: "post",
            position: item.position,
            post,
            groupId,
          });
        });
        return;
      }
      default:
        return;
    }
  });

  // Sort entries by position ascending; within same position, keep insertion order.
  feedEntries.sort((a, b) => a.position - b.position);

  const nextOffset =
    items.length < limit ? null : offset + limit;

  return {
    items: feedEntries,
    nextOffset,
  };
}


