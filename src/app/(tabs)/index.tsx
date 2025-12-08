import { FeedPostCard, FeedPostOverlay } from "@/components/FeedPostCard";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { FeedEntry } from "@/services/feed.service";
import { useChatInboxStore } from "@/stores/chatInboxStore";
import { useFeedStore } from "@/stores/feedStore";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import {
  FlatList,
  RefreshControl,
  useWindowDimensions,
  View,
  ViewToken
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const feedEntries = useFeedStore((s) => s.posts);
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

  // Track currently visible post ID for overlay
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        const entry = viewableItems[0].item as FeedEntry;
        if (entry.kind === "post") {
          setCurrentPostId(entry.post.id);
        } else {
          setCurrentPostId(null);
        }
      }
    }
  ).current;

  // Set initial post ID when posts load
  useEffect(() => {
    if (feedEntries.length > 0 && !currentPostId) {
      const firstPostEntry = feedEntries.find((e) => e.kind === "post");
      if (firstPostEntry && firstPostEntry.kind === "post") {
        setCurrentPostId(firstPostEntry.post.id);
      }
    }
  }, [feedEntries, currentPostId]);

  // Pause all videos when screen loses focus (navigating away)
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - onViewableItemsChanged will handle setting currentPostId
      return () => {
        // Screen is blurred - pause all videos by setting currentPostId to null
        // This makes all FeedPostCards have isVisible=false, pausing their videos
        setCurrentPostId(null);
      };
    }, [])
  );

  // Get current post from store (always up-to-date)
  const currentPost =
    currentPostId != null
      ? (() => {
          const entry = feedEntries.find(
            (e) => e.kind === "post" && e.post.id === currentPostId
          ) as Extract<FeedEntry, { kind: "post" }> | undefined;
          return entry ? entry.post : null;
        })()
      : null;

  // console.log("screenHeight from index", screenHeight);
  // console.log("insets from index", insets);

  return (
    <View className="flex-1 bg-background" style={{ overflow: "hidden" }}>
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

      {/* FlatList container - scrollable content */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={feedEntries}
          keyExtractor={(item) =>
            item.kind === "post" ? `post-${item.post.id}` : `banner-${item.banner.id}`
          }
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={handleEndReached}
          pagingEnabled
          decelerationRate={0.97}
          snapToAlignment="start"
          snapToInterval={screenHeight + insets.bottom}
          disableIntervalMomentum
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          // getItemLayout={(_, index) => ({
          //   length: screenHeight,
          //   offset: screenHeight * index,
          //   index,
          // })}
          renderItem={({ item }) => {
            const entry = item as FeedEntry;
            return (
              <View
                className=""
                style={{ height: screenHeight + insets.bottom }}
              >
                {entry.kind === "post" ? (
                  <FeedPostCard
                    post={entry.post}
                    isVisible={currentPostId === entry.post.id}
                    onPress={() =>
                      router.push({
                        pathname: `/post/${entry.post.id}`,
                        params: { initialData: JSON.stringify(entry.post) },
                      } as any)
                    }
                    hideOverlay // Hide bottom content, it's rendered at screen level
                  />
                ) : (
                  // Simple banner representation in the feed
                  <FeedPostCard
                    post={{
                      // Minimal shape to satisfy the card; actual content reads from banner
                      id: entry.banner.id,
                      caption: entry.banner.title,
                      createdAt: "",
                      likesCount: 0,
                      commentsCount: 0,
                      isLiked: false,
                      style: undefined,
                      author: {
                        id: "",
                        username: "",
                        firstName: undefined,
                        lastName: undefined,
                        avatar: entry.banner.thumbnailUrl || undefined,
                      },
                      media: [],
                    }}
                    onPress={() => {
                      const cleaned = entry.banner.redirectUrl.replace(/^\/?/, "");
                      const path = `/${cleaned}`;
                      router.push(path as any);
                    }}
                    hideOverlay
                  />
                )}
              </View>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        />
      </View>

      {/* Fixed overlay layer - gradients */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          elevation: 2,
          pointerEvents: "none",
        }}
      >
        {/* Top gradient - fixed to viewport */}
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: mvs(160),
          }}
          pointerEvents="none"
        />
        {/* Bottom gradient - fixed to viewport */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: mvs(240),
          }}
          pointerEvents="none"
        />
      </View>

      {/* Bottom content overlay - above gradients, at screen level */}
      {currentPost && (
        <FeedPostOverlay
          post={currentPost}
          onAuthorPress={() => router.push(`/user/${currentPost.author.id}` as any)}
          onLikePress={() => {
            console.log("onLikePress", currentPost.id, user?.id);
            if (user?.id) {
              toggleLikeOptimistic(currentPost.id, user.id);
            }
          }}
        />
      )}

      {/* Header brand (centered logo) - above gradients */}
      <View
        className="absolute top-0 left-0 right-0 flex-row items-center justify-between"
        style={{
          paddingTop: mvs(8),
          paddingHorizontal: s(16),
          zIndex: 30,
          elevation: 30,
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
