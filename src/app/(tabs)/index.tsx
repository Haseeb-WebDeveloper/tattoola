import { FeedPostCard } from "@/components/FeedPostCard";
import { SVGIcons } from '@/constants/svg';
import { useAuth } from "@/providers/AuthProvider";
import { useChatInboxStore } from "@/stores/chatInboxStore";
import { useFeedStore } from "@/stores/feedStore";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  View,
  useWindowDimensions,
} from "react-native";

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
  const { height: screenHeight } = useWindowDimensions();
  const startRealtime = useChatInboxStore((s) => s.startRealtime);
  const stopRealtime = useChatInboxStore((s) => s.stopRealtime);

  useEffect(() => {
    if (!user?.id) return;
    loadInitial(user.id);
    // also start presence tracking so others can see we're online
    startRealtime(user.id);
    return () => stopRealtime();
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
        pagingEnabled
        decelerationRate={0.97}
        snapToAlignment="start"
        snapToInterval={screenHeight}
        disableIntervalMomentum
        getItemLayout={(_, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        renderItem={({ item }) => (
          <View className="" style={{ height: screenHeight }}>
            <FeedPostCard
              post={item}
              onPress={() => router.push(`/post/${item.id}` as any)}
              onLikePress={() =>
                user?.id && toggleLikeOptimistic(item.id, user.id)
              }
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />
      {/* Header brand (centered logo) */}
      <View className="absolute top-6 left-0 right-0 px-5 flex-row items-center justify-between">
        <View className="rounded-full items-center justify-center">
          <SVGIcons.Flash className="w-5 h-5" />
        </View>
        <SVGIcons.LogoLight className="w-10 h-10" />
        <View style={{ width: 20 }} className=" h-5" />
      </View>
    </View>
  );
}
