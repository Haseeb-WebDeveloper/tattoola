import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";

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
  isFollowingAuthor: boolean;
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

  // Check follow state (does viewer follow author?)
  const { data: followData } = await supabase
    .from("follows")
    .select("id")
    .eq("followerId", userId)
    .eq("followingId", (post as any).users.id)
    .maybeSingle();

  const style = (post as any).tattoo_styles;
  const author = (post as any).users;
  return {
    id: (post as any).id,
    caption: (post as any).caption,
    thumbnailUrl: (post as any).thumbnailUrl,
    likesCount: (post as any).likesCount,
    commentsCount: (post as any).commentsCount,
    createdAt: (post as any).createdAt,
    media: ((post as any).post_media || []).sort((a: any, b: any) => a.order - b.order),
    style: style
      ? {
          id: style.id,
          name: style.name,
          imageUrl: style.imageUrl,
        }
      : undefined,
    author: {
      id: author.id,
      username: author.username,
      firstName: author.firstName,
      lastName: author.lastName,
      avatar: author.avatar,
      municipality: author.municipality,
      province: author.province,
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

export async function createPost(args: { caption?: string; styleId?: string; authorId: string }): Promise<{ id: string }> {
  const newId = uuidv4();
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('posts')
    .insert({ id: newId, authorId: args.authorId, caption: args.caption, styleId: args.styleId, updatedAt: nowIso })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { id: newId };
}

export async function addPostMedia(
  postId: string,
  media: Array<{ mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; order: number }>
): Promise<void> {
  if (!media.length) return;
  const rows = media.map((m) => ({ id: uuidv4(), postId, mediaUrl: m.mediaUrl, mediaType: m.mediaType, order: m.order }));
  const { error } = await supabase.from('post_media').insert(rows);
  if (error) throw new Error(error.message);
}

export async function addPostToCollection(postId: string, collectionId: string): Promise<void> {
  const { error } = await supabase
    .from('collection_posts')
    .insert({ id: uuidv4(), collectionId, postId, addedAt: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function createPostWithMediaAndCollection(args: {
  caption?: string;
  styleId?: string;
  media: Array<{ mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; order: number }>;
  collectionId?: string;
}): Promise<{ postId: string }> {
  try {
    const { data: session } = await supabase.auth.getUser();
    const authorId = session.user?.id;
    if (!authorId) throw new Error('Not authenticated');

    console.log('[createPostWithMediaAndCollection] args', args);
    const { id: postId } = await createPost({ caption: args.caption, styleId: args.styleId, authorId });
    console.log('[createPostWithMediaAndCollection] postId', postId);
    await addPostMedia(postId, args.media);
    console.log('[createPostWithMediaAndCollection] mediaCount', args.media.length);
    if (args.collectionId) {
      await addPostToCollection(postId, args.collectionId);
      console.log('[createPostWithMediaAndCollection] addedToCollection', args.collectionId);
    }
    return { postId };
  } catch (e) {
    console.error('[createPostWithMediaAndCollection] error', e);
    throw e;
  }
}