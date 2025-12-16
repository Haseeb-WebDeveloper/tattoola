import { BannerCard } from "@/components/BannerCard";
import { FeedPostCard, FeedPostOverlay } from "@/components/FeedPostCard";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { FeedEntry } from "@/services/feed.service";
import { prefetchUserProfile } from "@/services/prefetch.service";
import { useAuthRequiredStore } from "@/stores/authRequiredStore";
import { useChatInboxStore } from "@/stores/chatInboxStore";
import { useFeedStore } from "@/stores/feedStore";
import { UserSummary } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewToken,
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
    // Load feed for both anonymous and authenticated users
    loadInitial(user?.id || null);

    // Only start realtime for authenticated users
    if (user?.id) {
      startRealtime(user.id);
      return () => stopRealtime();
    }
  }, [user?.id]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) loadMore(user?.id || null);
  }, [user?.id, hasMore, isLoading]);

  const onRefresh = useCallback(() => {
    refresh(user?.id || null);
  }, [user?.id]);

  // Track currently visible post ID for overlay
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  // Track if current visible item is a banner (to hide overlay)
  const [isCurrentBanner, setIsCurrentBanner] = useState(false);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        const entry = viewableItems[0].item as FeedEntry;
        if (entry.kind === "post") {
          setCurrentPostId(entry.post.id);
          setIsCurrentBanner(false);
        } else {
          setCurrentPostId(null);
          setIsCurrentBanner(true);
        }
      }
    }
  ).current;

  // Set initial post ID when feed first loads or refreshes
  const lastFirstEntryId = useRef<string | null>(null);
  useEffect(() => {
    if (feedEntries.length > 0) {
      const firstEntry = feedEntries[0];
      const firstEntryId =
        firstEntry.kind === "post"
          ? firstEntry.post.id
          : `banner-${firstEntry.banner.id}`;

      // Only initialize if this is a new feed (first entry changed or not initialized)
      if (lastFirstEntryId.current !== firstEntryId) {
        if (firstEntry.kind === "post") {
          setCurrentPostId(firstEntry.post.id);
          setIsCurrentBanner(false);
        } else {
          setCurrentPostId(null);
          setIsCurrentBanner(true);
        }
        lastFirstEntryId.current = firstEntryId;
      }
    }
  }, [feedEntries]);

  // Pause all videos when screen loses focus (navigating away)
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - onViewableItemsChanged will handle setting currentPostId
      return () => {
        // Screen is blurred - pause all videos by setting currentPostId to null
        // This makes all FeedPostCards have isVisible=false, pausing their videos
        setCurrentPostId(null);
        setIsCurrentBanner(false);
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
      {/* <TouchableOpacity
        onPress={() =>
          router.push("/user/23377731-a5cf-4d99-8de7-61f952c177a7")
        }
        className="p-4 rounded-full bg-foreground text-background"
      >
        <Text>Artist</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => logout()}
        className="p-4 rounded-full bg-foreground text-background"
      >
        <Text>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/user-registration/step-3")}
        className="p-4 rounded-full bg-foreground text-background"
      >
        <Text>User registration</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/artist-registration/step-3")}
        className="p-4 rounded-full bg-foreground text-background"
      >
        <Text>Artist registration</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/artist-registration/step-13")}
        className="p-4 rounded-full bg-foreground text-background"
      >
        <Text>Plan subscription</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/(studio-invitation)/accept?token=021f4d87-75cb-4ebb-bd87-0c61fb7f0e25")}
        className="p-4 rounded-full bg-foreground text-background"
      >
        <Text>Studio invitation accept</Text>
      </TouchableOpacity> */}

      {/* FlatList container - scrollable content */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={feedEntries}
          keyExtractor={(item, index) =>
            item.kind === "post"
              ? `post-${item.post.id}-${item.position}-${index}`
              : `banner-${item.banner.id}-${item.position}-${index}`
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
                  // Banner card with grayscale background and colored overlay
                  <BannerCard
                    banner={entry.banner}
                    onPress={() => {
                      const cleaned = entry.banner.redirectUrl.replace(
                        /^\/?/,
                        ""
                      );
                      const path = `/${cleaned}`;
                      router.push(path as any);
                    }}
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

      {/* Bottom content overlay - above gradients, at screen level. Only show for posts, not banners */}
      {currentPost && !isCurrentBanner && (
        <FeedPostOverlay
          post={currentPost}
          onAuthorPress={() => {
            const author = currentPost.author;
            const initialUser: UserSummary = {
              id: author.id,
              username: author.username,
              firstName: author.firstName ?? null,
              lastName: author.lastName ?? null,
              avatar: author.avatar ?? null,
            };

            prefetchUserProfile(author.id).catch(() => {
              // Ignore prefetch errors
            });
            router.push({
              pathname: `/user/${author.id}`,
              params: {
                initialUser: JSON.stringify(initialUser),
              },
            } as any);
          }}
          onLikePress={() => {
            console.log("onLikePress", currentPost.id, user?.id);
            if (!user?.id) {
              useAuthRequiredStore.getState().show("Sign in to like tattoos");
              return;
            }
            toggleLikeOptimistic(currentPost.id, user.id);
          }}
        />
      )}

      {/* Header brand (centered logo) - above gradients */}
      <View
        className="absolute top-0 left-0 right-0 flex-row items-center justify-between"
        style={{
          paddingTop: mvs(20),
          paddingHorizontal: s(16),
          zIndex: 30,
          elevation: 30,
        }}
      >
        <View
          className="items-center justify-center rounded-full"
          style={{ width: s(20), height: s(20) }}
        >
          {/* <SVGIcons.Flash  /> */}
        </View>
        <SVGIcons.LogoLight />
        <TouchableOpacity
          onPress={() => router.push("/(auth)/help" as any)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="items-center justify-center"
          style={{ width: s(20), height: s(20) }}
        >
          <SVGIcons.HelpQuestion width={s(24)} height={s(24)} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
