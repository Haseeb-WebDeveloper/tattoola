import { supabase } from "@/utils/supabase";

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
};

/**
 * Fetch collection details with posts
 */
export async function fetchCollectionDetails(collectionId: string): Promise<CollectionDetails> {
  // Fetch collection basic info
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id,name,description,isPrivate,isPortfolioCollection,ownerId,createdAt,updatedAt")
    .eq("id", collectionId)
    .single();

  if (collectionError) throw new Error(collectionError.message);

  // Fetch posts in collection with all related data
  const { data: collectionPosts, error: postsError } = await supabase
    .from("collection_posts")
    .select(`
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
        tattoo_styles(id,name,imageUrl),
        users!posts_authorId_fkey(id,username,firstName,lastName,avatar,municipality,province),
        post_media(id,mediaType,mediaUrl,order)
      )
    `)
    .eq("collectionId", collectionId)
    .order("addedAt", { ascending: true });

  if (postsError) throw new Error(postsError.message);

  const posts: CollectionPost[] = (collectionPosts || []).map((cp: any) => ({
    id: cp.postId,
    postId: cp.postId,
    caption: cp.posts.caption,
    thumbnailUrl: cp.posts.thumbnailUrl,
    likesCount: cp.posts.likesCount,
    commentsCount: cp.posts.commentsCount,
    createdAt: cp.posts.createdAt,
    media: (cp.posts.post_media || []).sort((a: any, b: any) => a.order - b.order),
    style: cp.posts.tattoo_styles ? {
      id: cp.posts.tattoo_styles.id,
      name: cp.posts.tattoo_styles.name,
      imageUrl: cp.posts.tattoo_styles.imageUrl,
    } : undefined,
    author: {
      id: cp.posts.users.id,
      username: cp.posts.users.username,
      firstName: cp.posts.users.firstName,
      lastName: cp.posts.users.lastName,
      avatar: cp.posts.users.avatar,
      municipality: cp.posts.users.municipality,
      province: cp.posts.users.province,
    },
  }));

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
  };
}

/**
 * Update collection name
 */
export async function updateCollectionName(collectionId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("collections")
    .update({ name, updatedAt: new Date().toISOString() })
    .eq("id", collectionId);

  if (error) throw new Error(error.message);
}

/**
 * Remove post from collection
 */
export async function removePostFromCollection(collectionId: string, postId: string): Promise<void> {
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
  // Since we don't have an order field in collection_posts, we'll delete and re-insert
  // This is not ideal for performance but works for now
  const { error: deleteError } = await supabase
    .from("collection_posts")
    .delete()
    .eq("collectionId", collectionId);

  if (deleteError) throw new Error(deleteError.message);

  if (postIds.length > 0) {
    const { error: insertError } = await supabase
      .from("collection_posts")
      .insert(
        postIds.map((postId, index) => ({
          collectionId,
          postId,
          addedAt: new Date(Date.now() + index * 1000).toISOString(), // Add small delay to maintain order
        }))
      );

    if (insertError) throw new Error(insertError.message);
  }
}
