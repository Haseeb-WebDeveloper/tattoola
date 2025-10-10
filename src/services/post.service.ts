import { supabase } from "@/utils/supabase";

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
  likes: {
    id: string;
    username: string;
    avatar?: string;
  }[];
};

/**
 * Fetch detailed post information
 */
export async function fetchPostDetails(postId: string, userId: string): Promise<PostDetail> {
  // Fetch post with all related data
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(`
      id,
      caption,
      thumbnailUrl,
      likesCount,
      commentsCount,
      createdAt,
      authorId,
      styleId,
      tattoo_styles(id,name,imageUrl),
      users!posts_authorId_fkey(id,username,firstName,lastName,avatar,municipality,province),
      post_media(id,mediaType,mediaUrl,order)
    `)
    .eq("id", postId)
    .single();

  if (postError) throw new Error(postError.message);

  // Check if current user liked this post
  const { data: likeData } = await supabase
    .from("post_likes")
    .select("id")
    .eq("postId", postId)
    .eq("userId", userId)
    .single();

  // Fetch recent likes (first 10)
  const { data: likesData } = await supabase
    .from("post_likes")
    .select(`
      id,
      users!post_likes_userId_fkey(id,username,avatar)
    `)
    .eq("postId", postId)
    .order("createdAt", { ascending: false })
    .limit(10);

  const likes = (likesData || []).map((like: any) => ({
    id: like.id,
    username: like.users.username,
    avatar: like.users.avatar,
  }));

  return {
    id: post.id,
    caption: post.caption,
    thumbnailUrl: post.thumbnailUrl,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt,
    media: (post.post_media || []).sort((a: any, b: any) => a.order - b.order),
    style: post.tattoo_styles ? {
      id: post.tattoo_styles.id,
      name: post.tattoo_styles.name,
      imageUrl: post.tattoo_styles.imageUrl,
    } : undefined,
    author: {
      id: post.users.id,
      username: post.users.username,
      firstName: post.users.firstName,
      lastName: post.users.lastName,
      avatar: post.users.avatar,
      municipality: post.users.municipality,
      province: post.users.province,
    },
    isLiked: !!likeData,
    likes,
  };
}

/**
 * Toggle like on a post
 */
export async function togglePostLike(postId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from("post_likes")
    .select("id")
    .eq("postId", postId)
    .eq("userId", userId)
    .single();

  if (existingLike) {
    // Unlike the post
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("postId", postId)
      .eq("userId", userId);

    if (deleteError) throw new Error(deleteError.message);

    // Get current likes count and decrement
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

    return {
      isLiked: false,
      likesCount: newLikesCount,
    };
  } else {
    // Like the post
    const { error: insertError } = await supabase
      .from("post_likes")
      .insert({ postId, userId });

    if (insertError) throw new Error(insertError.message);

    // Get current likes count and increment
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

    return {
      isLiked: true,
      likesCount: newLikesCount,
    };
  }
}
