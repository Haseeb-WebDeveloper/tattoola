import { FeedPostCard } from "@/components/FeedPostCard";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useChatInboxStore } from "@/stores/chatInboxStore";
import { useFeedStore } from "@/stores/feedStore";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
  Text,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, logout } = useAuth();
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
  const insets = useSafeAreaInsets();

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
      <TouchableOpacity
        onPress={() =>
          router.push("/user/23377731-a5cf-4d99-8de7-61f952c177a7")
        }
        className="bg-foreground text-background p-4 rounded-full"
      >
        <Text>Artist</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => logout()}
        className="bg-foreground text-background p-4 rounded-full"
      >
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/user-registration/step-3")}
        className="bg-foreground text-background p-4 rounded-full"
      >
        <Text>User registration</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/artist-registration/step-3")}
        className="bg-foreground text-background p-4 rounded-full"
      >
        <Text>Artist registration</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/artist-registration/step-13")}
        className="bg-foreground text-background p-4 rounded-full"
      >
        <Text>Plan subscription</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/(studio-invitation)/accept?token=021f4d87-75cb-4ebb-bd87-0c61fb7f0e25")}
        className="bg-foreground text-background p-4 rounded-full"
      >
        <Text>Studio invitation accept</Text>
      </TouchableOpacity>

      {/* <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
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
      /> */}
      {/* Header brand (centered logo) */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-between"
        style={{
          paddingTop: mvs(8),
          paddingHorizontal: s(16),
        }}
      >
        <View
          className="rounded-full items-center justify-center"
          style={{ width: s(20), height: s(20) }}
        >
          {/* <SVGIcons.Flash  /> */}
        </View>
        <SVGIcons.LogoLight />
        <View style={{ width: s(20), height: s(20) }} />
      </View>
    </View>
  );
}
