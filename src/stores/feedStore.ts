import { FeedPage, FeedPost, fetchFeedPage, togglePostLike } from '@/services/post.service';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type Cursor = FeedPage['nextCursor'];

interface FeedState {
  posts: FeedPost[];
  cursor: Cursor;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;

  loadInitial: (userId: string) => Promise<void>;
  loadMore: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  toggleLikeOptimistic: (postId: string, userId: string) => Promise<void>;
  upsertPost: (post: FeedPost) => void;
}

export const useFeedStore = create<FeedState>()(
  devtools((set, get) => ({
    posts: [],
    cursor: null,
    isLoading: false,
    isRefreshing: false,
    hasMore: true,

    loadInitial: async (userId: string) => {
      if (!userId) return;
      set({ isLoading: true });
      try {
        const page = await fetchFeedPage({ userId, limit: 6 });
        set({
          posts: page.items,
          cursor: page.nextCursor ?? null,
          hasMore: !!page.nextCursor,
        });
      } finally {
        set({ isLoading: false });
      }
    },

    loadMore: async (userId: string) => {
      const { cursor, isLoading, hasMore } = get();
      if (!userId || isLoading || !hasMore) return;
      set({ isLoading: true });
      try {
        const page = await fetchFeedPage({ userId, limit: 6, cursor });
        set((s) => ({
          posts: [...s.posts, ...page.items],
          cursor: page.nextCursor ?? null,
          hasMore: !!page.nextCursor,
        }));
      } finally {
        set({ isLoading: false });
      }
    },

    refresh: async (userId: string) => {
      if (!userId) return;
      set({ isRefreshing: true });
      try {
        const page = await fetchFeedPage({ userId, limit: 6 });
        set({ posts: page.items, cursor: page.nextCursor ?? null, hasMore: !!page.nextCursor });
      } finally {
        set({ isRefreshing: false });
      }
    },

    toggleLikeOptimistic: async (postId: string, userId: string) => {
      const prev = get().posts;
      const idx = prev.findIndex((p) => p.id === postId);
      if (idx === -1) return;
      const target = prev[idx];
      const optimistic: FeedPost = {
        ...target,
        isLiked: !target.isLiked,
        likesCount: target.isLiked ? Math.max(target.likesCount - 1, 0) : target.likesCount + 1,
      };
      set((s) => ({ posts: [...s.posts.slice(0, idx), optimistic, ...s.posts.slice(idx + 1)] }));

      try {
        const res = await togglePostLike(postId, userId);
        set((s) => {
          const i = s.posts.findIndex((p) => p.id === postId);
          if (i === -1) return s as any;
          const fixed = { ...s.posts[i], isLiked: res.isLiked, likesCount: res.likesCount };
          return { posts: [...s.posts.slice(0, i), fixed, ...s.posts.slice(i + 1)] } as any;
        });
      } catch (e) {
        // revert
        set({ posts: prev });
      }
    },

    upsertPost: (post: FeedPost) => {
      set((s) => {
        const i = s.posts.findIndex((p) => p.id === post.id);
        if (i === -1) return { posts: [post, ...s.posts] } as any;
        const next = [...s.posts];
        next[i] = post;
        return { posts: next } as any;
      });
    },
  }), { name: 'feed-store' })
);


