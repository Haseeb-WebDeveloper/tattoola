import { FEED_POSTS_PER_PAGE } from '@/constants/limits';
import { PostDetail, togglePostLike } from '@/services/post.service';
import { FeedEntry, FeedItemsPage, fetchFeedItemsPage } from '@/services/feed.service';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type Cursor = FeedItemsPage['nextOffset'];

interface FeedState {
  posts: FeedEntry[];
  cursor: Cursor;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;

  loadInitial: (userId: string) => Promise<void>;
  loadMore: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  toggleLikeOptimistic: (postId: string, userId: string) => Promise<void>;
  upsertPost: (post: PostDetail) => void;
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
        const page = await fetchFeedItemsPage({ userId, limit: FEED_POSTS_PER_PAGE, offset: 0 });
        set({
          posts: page.items,
          cursor: page.nextOffset ?? null,
          hasMore: page.nextOffset !== null,
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
        const page = await fetchFeedItemsPage({
          userId,
          limit: FEED_POSTS_PER_PAGE,
          offset: cursor ?? 0,
        });
        set((s) => ({
          posts: [...s.posts, ...page.items],
          cursor: page.nextOffset ?? null,
          hasMore: page.nextOffset !== null,
        }));
      } finally {
        set({ isLoading: false });
      }
    },

    refresh: async (userId: string) => {
      if (!userId) return;
      set({ isRefreshing: true });
      try {
        const page = await fetchFeedItemsPage({ userId, limit: FEED_POSTS_PER_PAGE, offset: 0 });
        set({
          posts: page.items,
          cursor: page.nextOffset ?? null,
          hasMore: page.nextOffset !== null,
        });
      } finally {
        set({ isRefreshing: false });
      }
    },

    toggleLikeOptimistic: async (postId: string, userId: string) => {
      const prev = get().posts;
      // Only apply likes to post-type entries
      const idx = prev.findIndex((entry) => entry.kind === 'post' && entry.post.id === postId);
      if (idx === -1) return;
      const target = prev[idx] as Extract<FeedEntry, { kind: 'post' }>;
      const optimisticPost = {
        ...target.post,
        isLiked: !target.post.isLiked,
        likesCount: target.post.isLiked
          ? Math.max(target.post.likesCount - 1, 0)
          : target.post.likesCount + 1,
      };
      const optimisticEntry: FeedEntry = {
        ...target,
        post: optimisticPost,
      };
      set((s) => ({
        posts: [...s.posts.slice(0, idx), optimisticEntry, ...s.posts.slice(idx + 1)],
      }));

      try {
        const res = await togglePostLike(postId, userId);
        set((s) => {
          const i = s.posts.findIndex(
            (entry) => entry.kind === 'post' && entry.post.id === postId,
          );
          if (i === -1) return s as any;
          const current = s.posts[i] as Extract<FeedEntry, { kind: 'post' }>;
          const fixedPost = {
            ...current.post,
            isLiked: res.isLiked,
            likesCount: res.likesCount,
          };
          const fixedEntry: FeedEntry = {
            ...current,
            post: fixedPost,
          };
          return { posts: [...s.posts.slice(0, i), fixedEntry, ...s.posts.slice(i + 1)] } as any;
        });
      } catch (e) {
        // revert
        set({ posts: prev });
      }
    },

    upsertPost: (post) => {
      set((s) => {
        const i = s.posts.findIndex(
          (entry) => entry.kind === 'post' && entry.post.id === post.id,
        );
        // If not found, prepend a new entry at position 0 (will still be sorted by feed service next load)
        if (i === -1) {
          const entry: FeedEntry = {
            kind: 'post',
            position: 0,
            post,
          };
          return { posts: [entry, ...s.posts] } as any;
        }
        const next = [...s.posts];
        const current = next[i] as Extract<FeedEntry, { kind: 'post' }>;
        next[i] = { ...current, post } as FeedEntry;
        return { posts: next } as any;
      });
    },
  }), { name: 'feed-store' })
);


