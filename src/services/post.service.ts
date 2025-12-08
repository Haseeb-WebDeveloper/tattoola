import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { cloudinaryService } from "@/services/cloudinary.service";

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
  userId: string;
  limit?: number;
  cursor?: { createdAt: string; id: string } | null;
}): Promise<FeedPage> {
  const { userId, limit = 6, cursor } = args;

  // Base query
  let query = supabase
    .from("posts")
    .select(
      `
      id,caption,thumbnailUrl,likesCount,commentsCount,createdAt,authorId,styleId,
      tattoo_styles(id,name),
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

  // Get likes for current user for these posts in one query
  const postIds = itemsRows.map((r) => r.id);
  let likedMap: Record<string, boolean> = {};
  if (postIds.length > 0) {
    const { data: likesRows } = await supabase
      .from("post_likes")
      .select("postId")
      .eq("userId", userId)
      .in("postId", postIds);
    (likesRows || []).forEach((lr: any) => {
      likedMap[lr.postId] = true;
    });
  }

  const items: FeedPost[] = itemsRows.map((r: any) => ({
    id: r.id,
    caption: r.caption,
    createdAt: r.createdAt,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    isLiked: !!likedMap[r.id],
    style: r.tattoo_styles
      ? { id: r.tattoo_styles.id, name: r.tattoo_styles.name }
      : undefined,
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
  }));

  return { items, nextCursor };
}

/**
 * Fetch detailed post information
 */
export async function fetchPostDetails(
  postId: string,
  userId: string
): Promise<PostDetail> {
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
      tattoo_styles(id,name,imageUrl),
      users!posts_authorId_fkey(id,username,firstName,lastName,avatar),
      post_media(id,mediaType,mediaUrl,order)
    `
    )
    .eq("id", postId)
    .single();

  if (postError) throw new Error(postError.message);

  const authorId = (post as any).users.id;

  // Fetch post styles from post_styles junction table
  let styles = [];
  try {
    const { data: postStylesData, error: postStylesError } = await supabase
      .from("post_styles")
      .select("styleId, order, tattoo_styles(id, name, imageUrl)")
      .eq("postId", postId)
      .order("order", { ascending: true });

    // If post_styles table exists and has data, use it
    if (!postStylesError && postStylesData && postStylesData.length > 0) {
      styles = postStylesData.map((ps: any) => ({
        id: ps.tattoo_styles?.id || ps.styleId,
        name: ps.tattoo_styles?.name || "",
        imageUrl: ps.tattoo_styles?.imageUrl,
      }));
    } else if ((post as any).tattoo_styles) {
      // Fallback to single style from posts table for backward compatibility
      styles = [
        {
          id: (post as any).tattoo_styles.id,
          name: (post as any).tattoo_styles.name,
          imageUrl: (post as any).tattoo_styles.imageUrl,
        },
      ];
    }
  } catch (err) {
    // If table doesn't exist, fall back to single style from posts table
    console.warn("post_styles table may not exist, using single style:", err);
    if ((post as any).tattoo_styles) {
      styles = [
        {
          id: (post as any).tattoo_styles.id,
          name: (post as any).tattoo_styles.name,
          imageUrl: (post as any).tattoo_styles.imageUrl,
        },
      ];
    }
  }

  // Run all 4 queries in parallel for faster loading
  const [locationResult, likeResult, likesResult, followResult] =
    await Promise.all([
      // Fetch author's location
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
        .maybeSingle(),
    ]);

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
  styleId?: string;
  authorId: string;
  thumbnailUrl?: string;
}): Promise<{ id: string }> {
  const newId = uuidv4();
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .insert({
      id: newId,
      authorId: args.authorId,
      caption: args.caption,
      styleId: args.styleId,
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
  styleId?: string;
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
      thumbnailUrl = cloudinaryService.getVideoThumbnailFromUrl(firstMedia.mediaUrl);
    } else {
      // Fall back to finding first image media item
      const firstImage =
        args.media.find((m) => m.mediaType === "IMAGE" && m.order === 0) ||
        args.media.find((m) => m.mediaType === "IMAGE");
      thumbnailUrl = firstImage?.mediaUrl;
    }

    const { id: postId } = await createPost({
      caption: args.caption,
      styleId: args.styleId,
      authorId,
      thumbnailUrl,
    });
    await addPostMedia(postId, args.media);
    if (args.collectionId) {
      await addPostToCollection(postId, args.collectionId);
      console.log(
        "[createPostWithMediaAndCollection] addedToCollection",
        args.collectionId
      );
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
    styleId?: string; // Keep for backward compatibility
    styleIds?: string[]; // New: support multiple styles
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

  // Handle styles - support both single styleId (backward compat) and multiple styleIds
  if (updates.styleIds !== undefined) {
    // Update multiple styles using post_styles junction table
    // Wrap in try-catch to prevent errors from breaking the save operation
    let postStylesTableExists = true;

    try {
      // Remove post from all styles
      const { error: deleteError } = await supabase
        .from("post_styles")
        .delete()
        .eq("postId", postId);

      // Check if table exists by examining the error
      if (deleteError) {
        const errorMessage = deleteError.message || "";
        const errorCode = deleteError.code || "";
        // Check for common "table doesn't exist" error patterns
        if (
          errorCode === "PGRST205" || // PostgREST: Could not find the table
          errorMessage.includes("Could not find the table") ||
          errorMessage.includes("does not exist") ||
          errorMessage.includes("relation") ||
          errorCode === "42P01" || // PostgreSQL: relation does not exist
          errorCode === "PGRST116" // PostgREST: relation not found
        ) {
          postStylesTableExists = false;
          console.warn(
            "post_styles table does not exist. Only the first style will be saved in posts.styleId field."
          );
        } else {
          // Other error - log it but continue
          console.warn("Error deleting post_styles:", deleteError);
        }
      }

      // Add post to selected styles (only if table exists)
      if (postStylesTableExists && updates.styleIds.length > 0) {
        const { error: insertError } = await supabase
          .from("post_styles")
          .insert(
            updates.styleIds.map((styleId, index) => ({
              id: uuidv4(),
              styleId,
              postId,
              order: index,
              addedAt: new Date().toISOString(),
            }))
          );

        if (insertError) {
          const errorCode = insertError.code || "";
          const errorMessage = insertError.message || "";

          // Check if it's a "table doesn't exist" error
          if (
            errorCode === "PGRST205" ||
            errorMessage.includes("Could not find the table") ||
            errorMessage.includes("does not exist") ||
            errorMessage.includes("relation") ||
            errorCode === "42P01" ||
            errorCode === "PGRST116"
          ) {
            postStylesTableExists = false;
            console.warn(
              "post_styles table does not exist. Only the first style will be saved in posts.styleId field."
            );
          } else {
            // Other error - log it
            console.warn("Error inserting post_styles:", insertError);
          }
        } else {
          console.log(
            `Successfully saved ${updates.styleIds.length} style(s) to post_styles table`
          );
        }
      }
    } catch (err) {
      // If any error occurs with post_styles table, just continue with single styleId
      console.warn(
        "Error with post_styles table, continuing with single styleId:",
        err
      );
      postStylesTableExists = false;
    }

    // Always update the primary styleId field for backward compatibility (use first style)
    // This ensures the post can still be saved even if post_styles table doesn't exist
    if (updates.styleIds.length > 0) {
      updateData.styleId = updates.styleIds[0];
    } else {
      updateData.styleId = null;
    }
  } else if (updates.styleId !== undefined) {
    // Backward compatibility: single styleId
    updateData.styleId = updates.styleId || null;

    // Also try to update post_styles table (if it exists)
    try {
      const { error: deleteError } = await supabase
        .from("post_styles")
        .delete()
        .eq("postId", postId);

      if (deleteError) {
        const errorCode = deleteError.code || "";
        const errorMessage = deleteError.message || "";

        // Only log if it's not a "table doesn't exist" error
        if (
          errorCode !== "PGRST205" &&
          !errorMessage.includes("Could not find the table") &&
          !errorMessage.includes("does not exist") &&
          !errorMessage.includes("relation") &&
          errorCode !== "42P01"
        ) {
          console.warn("Error deleting post_styles:", deleteError);
        }
      }

      if (updates.styleId) {
        const { error: insertError } = await supabase
          .from("post_styles")
          .insert({
            id: uuidv4(),
            styleId: updates.styleId,
            postId,
            order: 0,
            addedAt: new Date().toISOString(),
          });

        if (insertError) {
          const errorCode = insertError.code || "";
          const errorMessage = insertError.message || "";

          // Only log if it's not a "table doesn't exist" error
          if (
            errorCode !== "PGRST205" &&
            !errorMessage.includes("Could not find the table") &&
            !errorMessage.includes("does not exist") &&
            !errorMessage.includes("relation") &&
            errorCode !== "42P01"
          ) {
            console.warn("Error inserting post_styles:", insertError);
          }
        }
      }
    } catch (err) {
      // Silently ignore - table doesn't exist, but we can still save single styleId
      console.warn(
        "post_styles table may not exist, continuing with single styleId:",
        err
      );
    }
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update(updateData)
    .eq("id", postId);

  if (updateError) throw new Error(updateError.message);

  // Update collections if provided
  if (updates.collectionIds !== undefined) {
    // Remove post from all collections
    const { error: deleteError } = await supabase
      .from("collection_posts")
      .delete()
      .eq("postId", postId);

    if (deleteError) throw new Error(deleteError.message);

    // Add post to selected collections
    if (updates.collectionIds.length > 0) {
      const { error: insertError } = await supabase
        .from("collection_posts")
        .insert(
          updates.collectionIds.map((collectionId) => ({
            id: uuidv4(),
            collectionId,
            postId,
            addedAt: new Date().toISOString(),
          }))
        );

      if (insertError) throw new Error(insertError.message);
    }
  }
}
