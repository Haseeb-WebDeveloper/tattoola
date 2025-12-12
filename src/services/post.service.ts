import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { cloudinaryService } from "@/services/cloudinary.service";
import {
  findOrGetTuttiCollection,
  isPreferitiCollection,
  isTuttiCollection,
} from "@/utils/collection.utils";

export type PostDetail = {
  id: string;
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
  styles?: {
    id: string;
    name: string;
    imageUrl?: string;
  }[];
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    municipality?: string;
    province?: string;
  };
  isLiked: boolean;
  isFollowingAuthor: boolean;
  likes: {
    id: string;
    username: string;
    avatar?: string;
  }[];
};

export type FeedPost = {
  id: string;
  caption?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  style?: { id: string; name: string };
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  media: {
    id: string;
    mediaType: "IMAGE" | "VIDEO";
    mediaUrl: string;
    order: number;
  }[];
};

export type FeedPage = {
  items: FeedPost[];
  nextCursor?: { createdAt: string; id: string } | null;
};

/**
 * Fetch a page of feed posts using cursor-based pagination (createdAt DESC, id DESC)
 */
export async function fetchFeedPage(args: {
  userId?: string | null;
  limit?: number;
  cursor?: { createdAt: string; id: string } | null;
}): Promise<FeedPage> {
  const { userId, limit = 6, cursor } = args;
  const isAnonymous = !userId;

  // Base query
  let query = supabase
    .from("posts")
    .select(
      `
      id,caption,thumbnailUrl,likesCount,commentsCount,createdAt,authorId,styleId,
      users!posts_authorId_fkey(id,username,firstName,lastName,avatar),
      post_media(id,mediaType,mediaUrl,order)
    `
    )
    .order("createdAt", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1); // over-fetch by 1 to compute next cursor

  if (cursor) {
    // createdAt < cursor.createdAt OR (createdAt = cursor.createdAt AND id < cursor.id)
    // PostgREST: or('and(createdAt.eq.XXXX,id.lt.YYYY),createdAt.lt.XXXX')
    const createdAt = cursor.createdAt;
    const id = cursor.id;
    // @ts-ignore - PostgREST filter string
    query = query.or(
      `and(createdAt.eq.${createdAt},id.lt.${id}),createdAt.lt.${createdAt}`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data || []) as any[];

  // Determine next cursor
  let nextCursor: FeedPage["nextCursor"] = null;
  let itemsRows = rows;
  if (rows.length > limit) {
    const last = rows[limit - 1];
    nextCursor = { createdAt: last.createdAt, id: last.id };
    itemsRows = rows.slice(0, limit);
  }

  // Collect all style IDs and fetch styles separately
  const allStyleIds = new Set<string>();
  itemsRows.forEach((r) => {
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

  // Get likes for current user for these posts in one query
  const postIds = itemsRows.map((r) => r.id);
  let likedMap: Record<string, boolean> = {};
  if (!isAnonymous && postIds.length > 0) {
    const { data: likesRows } = await supabase
      .from("post_likes")
      .select("postId")
      .eq("userId", userId)
      .in("postId", postIds);
    (likesRows || []).forEach((lr: any) => {
      likedMap[lr.postId] = true;
    });
  }

  const items: FeedPost[] = itemsRows.map((r: any) => {
    // Get first style from array (for backward compatibility with FeedPost type)
    const styleIds = r.styleId || [];
    const firstStyleId =
      Array.isArray(styleIds) && styleIds.length > 0 ? styleIds[0] : null;
    const firstStyle = firstStyleId ? stylesMap[firstStyleId] : undefined;

    return {
      id: r.id,
      caption: r.caption,
      createdAt: r.createdAt,
      likesCount: r.likesCount,
      commentsCount: r.commentsCount,
      isLiked: !!likedMap[r.id],
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

  return { items, nextCursor };
}

/**
 * Fetch detailed post information
 */
export async function fetchPostDetails(
  postId: string,
  userId?: string | null
): Promise<PostDetail> {
  const isAnonymous = !userId;
  
  // Fetch post with all related data
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
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
    `
    )
    .eq("id", postId)
    .single();

  if (postError) throw new Error(postError.message);

  const authorId = (post as any).users.id;

  // Fetch styles from styleId array in posts table
  let styles = [];
  const styleIdValue = (post as any).styleId;

  // Handle both array and string (for backward compatibility during migration)
  let styleIds: string[] = [];
  if (styleIdValue) {
    if (Array.isArray(styleIdValue)) {
      styleIds = styleIdValue;
    } else if (typeof styleIdValue === "string" && styleIdValue.trim() !== "") {
      // Old format: single string, convert to array
      styleIds = [styleIdValue];
    }
  }

  if (styleIds.length > 0) {
    // Fetch style details for all style IDs
    const { data: styleData, error: styleError } = await supabase
      .from("tattoo_styles")
      .select("id, name, imageUrl")
      .in("id", styleIds);

    if (!styleError && styleData) {
      // Maintain order from styleId array
      styles = styleIds
        .map((styleId: string) => {
          const style = styleData.find((s: any) => s.id === styleId);
          return style
            ? {
                id: style.id,
                name: style.name,
                imageUrl: style.imageUrl,
              }
            : null;
        })
        .filter(Boolean);
    }
  }

  // Run parallel queries - skip like/follow checks for anonymous users
  const queries = [
    // Fetch author's location (always public)
    supabase
      .from("user_locations")
      .select(
        `
        municipalities(name),
        provinces(name)
      `
      )
      .eq("userId", authorId)
      .eq("isPrimary", true)
      .maybeSingle(),
  ];

  // Only check likes and follows if user is authenticated
  if (!isAnonymous) {
    queries.push(
      // Check if current user liked this post
      supabase
        .from("post_likes")
        .select("id")
        .eq("postId", postId)
        .eq("userId", userId)
        .maybeSingle(),

      // Fetch recent likes (first 10)
      supabase
        .from("post_likes")
        .select(
          `
        id,
        users!post_likes_userId_fkey(id,username,avatar)
      `
        )
        .eq("postId", postId)
        .order("createdAt", { ascending: false })
        .limit(10),

      // Check follow state (does viewer follow author?)
      supabase
        .from("follows")
        .select("id")
        .eq("followerId", userId)
        .eq("followingId", authorId)
        .maybeSingle()
    );
  } else {
    // For anonymous users, just fetch likes list (no auth check)
    queries.push(
      Promise.resolve({ data: null }), // like check placeholder
      supabase
        .from("post_likes")
        .select(
          `
        id,
        users!post_likes_userId_fkey(id,username,avatar)
      `
        )
        .eq("postId", postId)
        .order("createdAt", { ascending: false })
        .limit(10),
      Promise.resolve({ data: null }) // follow check placeholder
    );
  }

  const [locationResult, likeResult, likesResult, followResult] =
    await Promise.all(queries);

  const locationData = locationResult.data;
  const likeData = likeResult.data;
  const likesData = likesResult.data;
  const followData = followResult.data;

  const likes = (likesData || []).map((like: any) => ({
    id: like.id,
    username: like.users.username,
    avatar: like.users.avatar,
  }));

  const author = (post as any).users;
  // Use first style for backward compatibility (single style field)
  const primaryStyle = styles.length > 0 ? styles[0] : undefined;

  return {
    id: (post as any).id,
    caption: (post as any).caption,
    thumbnailUrl: (post as any).thumbnailUrl,
    likesCount: (post as any).likesCount,
    commentsCount: (post as any).commentsCount,
    createdAt: (post as any).createdAt,
    media: ((post as any).post_media || []).sort(
      (a: any, b: any) => a.order - b.order
    ),
    style: primaryStyle, // Keep single style for backward compatibility
    styles: styles, // Add multiple styles array
    author: {
      id: author.id,
      username: author.username,
      firstName: author.firstName,
      lastName: author.lastName,
      avatar: author.avatar,
      municipality: (locationData as any)?.municipalities?.name,
      province: (locationData as any)?.provinces?.name,
    },
    isLiked: !!likeData,
    isFollowingAuthor: !!followData,
    likes,
  };
}

/**
 * Toggle like on a post
 */
export async function togglePostLike(
  postId: string,
  userId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from("post_likes")
    .select("id")
    .eq("postId", postId)
    .eq("userId", userId)
    .maybeSingle();

  if (existingLike) {
    // Unlike the post
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("postId", postId)
      .eq("userId", userId);
    if (deleteError) throw new Error(deleteError.message);

    // Decrement likesCount
    const { data: currentPost } = await supabase
      .from("posts")
      .select("likesCount")
      .eq("id", postId)
      .single();
    const newLikesCount = Math.max((currentPost?.likesCount || 0) - 1, 0);
    const { error: updateError } = await supabase
      .from("posts")
      .update({ likesCount: newLikesCount })
      .eq("id", postId);
    if (updateError) throw new Error(updateError.message);

    return { isLiked: false, likesCount: newLikesCount };
  }

  // Like the post (client-generated id to satisfy NOT NULL)
  const newId = uuidv4();
  const { error: insertError } = await supabase
    .from("post_likes")
    .insert({ id: newId, postId, userId });
  if (insertError) throw new Error(insertError.message);

  // Increment likesCount
  const { data: currentPost } = await supabase
    .from("posts")
    .select("likesCount")
    .eq("id", postId)
    .single();
  const newLikesCount = (currentPost?.likesCount || 0) + 1;
  const { error: updateError } = await supabase
    .from("posts")
    .update({ likesCount: newLikesCount })
    .eq("id", postId);
  if (updateError) throw new Error(updateError.message);

  return { isLiked: true, likesCount: newLikesCount };
}

export async function createPost(args: {
  caption?: string;
  styleId?: string[]; // Array of style IDs (1-3 styles)
  authorId: string;
  thumbnailUrl?: string;
}): Promise<{ id: string }> {
  const newId = uuidv4();
  const nowIso = new Date().toISOString();

  // Use styleId array directly
  const styleIdsToSave = args.styleId || [];

  const { error } = await supabase
    .from("posts")
    .insert({
      id: newId,
      authorId: args.authorId,
      caption: args.caption,
      styleId: styleIdsToSave,
      thumbnailUrl: args.thumbnailUrl,
      updatedAt: nowIso,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: newId };
}

export async function addPostMedia(
  postId: string,
  media: Array<{
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    order: number;
  }>
): Promise<void> {
  if (!media.length) return;
  const rows = media.map((m) => ({
    id: uuidv4(),
    postId,
    mediaUrl: m.mediaUrl,
    mediaType: m.mediaType,
    order: m.order,
  }));
  const { error } = await supabase.from("post_media").insert(rows);
  if (error) throw new Error(error.message);
}

export async function addPostToCollection(
  postId: string,
  collectionId: string
): Promise<void> {
  const { error } = await supabase.from("collection_posts").insert({
    id: uuidv4(),
    collectionId,
    postId,
    addedAt: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function createPostWithMediaAndCollection(args: {
  caption?: string;
  styleId?: string[]; // Array of style IDs (1-3 styles)
  media: Array<{
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    order: number;
  }>;
  collectionId?: string;
}): Promise<{ postId: string }> {
  try {
    const { data: session } = await supabase.auth.getUser();
    const authorId = session.user?.id;
    if (!authorId) throw new Error("Not authenticated");

    // Extract thumbnail from first media item
    // If first media is VIDEO, generate thumbnail URL from video
    // Otherwise, use first IMAGE as thumbnail
    let thumbnailUrl: string | undefined;
    const firstMedia = args.media[0];

    if (firstMedia?.mediaType === "VIDEO") {
      // Generate thumbnail URL from video using Cloudinary
      thumbnailUrl = cloudinaryService.getVideoThumbnailFromUrl(
        firstMedia.mediaUrl
      );
    } else {
      // Fall back to finding first image media item
      const firstImage =
        args.media.find((m) => m.mediaType === "IMAGE" && m.order === 0) ||
        args.media.find((m) => m.mediaType === "IMAGE");
      thumbnailUrl = firstImage?.mediaUrl;
    }

    const { id: postId } = await createPost({
      caption: args.caption,
      styleId: args.styleId || [],
      authorId,
      thumbnailUrl,
    });

    await addPostMedia(postId, args.media);

    // Check if the collection is "tutti" to avoid adding twice
    let isTuttiCollectionCheck = false;
    if (args.collectionId) {
      isTuttiCollectionCheck = await isTuttiCollection(args.collectionId);

      // Add post to the specified collection
      await addPostToCollection(postId, args.collectionId);
      console.log(
        "[createPostWithMediaAndCollection] addedToCollection",
        args.collectionId
      );
    }

    // Always add to "tutti" collection (unless it's already the tutti collection)
    // All posts should be in tutti, regardless of what other collections they're in
    if (!isTuttiCollectionCheck) {
      try {
        const tuttiCollectionId = await findOrGetTuttiCollection(authorId);
        if (tuttiCollectionId) {
          // Check if post is already in tutti to avoid duplicates
          const { data: existingTuttiPost } = await supabase
            .from("collection_posts")
            .select("id")
            .eq("collectionId", tuttiCollectionId)
            .eq("postId", postId)
            .maybeSingle();

          if (!existingTuttiPost) {
            await addPostToCollection(postId, tuttiCollectionId);
            console.log(
              "[createPostWithMediaAndCollection] added to tutti collection"
            );
          } else {
            console.log(
              "[createPostWithMediaAndCollection] post already in tutti collection"
            );
          }
        } else {
          console.warn(
            "[createPostWithMediaAndCollection] tutti collection not found for user"
          );
        }
      } catch (e) {
        // Don't fail post creation if tutti collection logic fails
        console.error(
          "[createPostWithMediaAndCollection] error adding to tutti:",
          e
        );
      }
    }

    return { postId };
  } catch (e) {
    console.error("[createPostWithMediaAndCollection] error", e);
    throw e;
  }
}

export type LikedPost = {
  id: string;
  caption?: string;
  thumbnailUrl?: string;
  createdAt: string;
  media: {
    id: string;
    mediaType: "IMAGE" | "VIDEO";
    mediaUrl: string;
    order: number;
  }[];
};

/**
 * Fetch all posts liked by the user
 */
export async function fetchLikedPosts(
  userId: string,
  styleId?: string | null
): Promise<LikedPost[]> {
  // Build query
  let query = supabase
    .from("post_likes")
    .select(
      `
      postId,
      createdAt,
      posts!post_likes_postId_fkey(
        id,
        caption,
        thumbnailUrl,
        createdAt,
        styleId,
        post_media(id,mediaType,mediaUrl,order)
      )
    `
    )
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  const { data: likes, error: likesError } = await query;

  if (likesError) throw new Error(likesError.message);
  if (!likes || likes.length === 0) return [];

  // Transform the data and filter by styleId if provided
  const likedPosts: LikedPost[] = likes
    .map((like: any) => {
      const post = like.posts;
      if (!post) return null;

      // Filter by styleId if provided
      if (styleId && post.styleId !== styleId) return null;

      return {
        id: post.id,
        caption: post.caption,
        thumbnailUrl: post.thumbnailUrl,
        createdAt: post.createdAt,
        media: (post.post_media || []).sort(
          (a: any, b: any) => a.order - b.order
        ),
      };
    })
    .filter(Boolean) as LikedPost[];

  return likedPosts;
}

/**
 * Delete a post
 */
export async function deletePost(
  postId: string,
  authorId: string
): Promise<void> {
  // Verify the user is the author
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("authorId")
    .eq("id", postId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!post || post.authorId !== authorId) {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  // Delete the post (cascade will handle related records)
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (deleteError) throw new Error(deleteError.message);
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string,
  authorId: string,
  updates: {
    caption?: string;
    styleId?: string[]; // Array of style IDs (1-3 styles)
    collectionIds?: string[];
  }
): Promise<void> {
  // Verify the user is the author
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("authorId")
    .eq("id", postId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!post || post.authorId !== authorId) {
    throw new Error("Unauthorized: You can only update your own posts");
  }

  // Update post fields
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };
  if (updates.caption !== undefined) {
    updateData.caption = updates.caption;
  }

  // Handle styles - save styleId array directly
  if (updates.styleId !== undefined) {
    // Ensure it's always an array (empty array if no styles)
    updateData.styleId = Array.isArray(updates.styleId) ? updates.styleId : [];
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update(updateData)
    .eq("id", postId);

  if (updateError) throw new Error(updateError.message);

  // Update collections if provided
  if (updates.collectionIds !== undefined) {
    console.log(
      `Updating collections for post ${postId}:`,
      updates.collectionIds
    );

    // Remove post from all collections first
    const { error: deleteError } = await supabase
      .from("collection_posts")
      .delete()
      .eq("postId", postId);

    if (deleteError) {
      console.error("Error deleting collection_posts:", deleteError);
      throw new Error(deleteError.message);
    }

    console.log(
      `Removed post from all collections. Now adding to ${updates.collectionIds.length} collection(s)`
    );

    // Add post to selected collections
    if (updates.collectionIds.length > 0) {
      // Remove duplicates just in case
      const uniqueCollectionIds = Array.from(new Set(updates.collectionIds));

      const { error: insertError } = await supabase
        .from("collection_posts")
        .insert(
          uniqueCollectionIds.map((collectionId) => ({
            id: uuidv4(),
            collectionId,
            postId,
            addedAt: new Date().toISOString(),
          }))
        );

      if (insertError) {
        console.error("Error inserting collection_posts:", insertError);
        throw new Error(insertError.message);
      }

      console.log(
        `Successfully added post to ${uniqueCollectionIds.length} collection(s):`,
        uniqueCollectionIds
      );
    } else {
      console.log("No collections selected, post removed from all collections");
    }
  }
}
