import { FeedPostCard } from '@/components/FeedPostCard';
import { useAuth } from '@/providers/AuthProvider';
import { useFeedStore } from '@/stores/feedStore';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const posts = useFeedStore((s) => s.posts);
  const isLoading = useFeedStore((s) => s.isLoading);
  const isRefreshing = useFeedStore((s) => s.isRefreshing);
  const hasMore = useFeedStore((s) => s.hasMore);
  const loadInitial = useFeedStore((s) => s.loadInitial);
  const loadMore = useFeedStore((s) => s.loadMore);
  const refresh = useFeedStore((s) => s.refresh);
  const toggleLikeOptimistic = useFeedStore((s) => s.toggleLikeOptimistic);

  useEffect(() => {
    if (!user?.id) return;
    loadInitial(user.id);
  }, [user?.id]);

  const handleEndReached = useCallback(() => {
    if (user?.id && hasMore && !isLoading) loadMore(user.id);
  }, [user?.id, hasMore, isLoading]);

  const onRefresh = useCallback(() => {
    if (user?.id) refresh(user.id);
  }, [user?.id]);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={handleEndReached}
        renderItem={({ item }) => (
          <View className="">
            <FeedPostCard
              post={item}
              onPress={() => router.push(`/post/${item.id}` as any)}
              onLikePress={() => user?.id && toggleLikeOptimistic(item.id, user.id)}
            />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#fff" />}
      />
    </View>
  );
}
