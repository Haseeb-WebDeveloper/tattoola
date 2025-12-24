import { BannerCard } from "@/components/BannerCard";
import {
  CollectionBannerCard,
  CollectionBannerOverlay,
} from "@/components/CollectionBannerCard";
import { FeedPostCard, FeedPostOverlay } from "@/components/FeedPostCard";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { FeedEntry } from "@/services/feed.service";
import { prefetchUserProfile } from "@/services/prefetch.service";
import {
  fetchArtistProfileSummary,
  fetchUserSummaryCached,
} from "@/services/profile.service";
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
  // Track currently visible collection banner ID for overlay
  const [currentCollectionId, setCurrentCollectionId] = useState<
    string | null
  >(null);
  // Track if current visible item is a banner/collection (to hide post overlay)
  const [isCurrentBanner, setIsCurrentBanner] = useState(false);
  
  // Store last known IDs to restore when screen regains focus
  const lastPostIdRef = useRef<string | null>(null);
  const lastCollectionIdRef = useRef<string | null>(null);
  const lastIsBannerRef = useRef<boolean>(false);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        const entry = viewableItems[0].item as FeedEntry;
        if (entry.kind === "post") {
          const postId = entry.post.id;
          setCurrentPostId(postId);
          setCurrentCollectionId(null);
          setIsCurrentBanner(false);
          // Store for restoration
          lastPostIdRef.current = postId;
          lastCollectionIdRef.current = null;
          lastIsBannerRef.current = false;
        } else if (entry.kind === "collectionBanner") {
          const collectionId = entry.collection?.id ?? null;
          setCurrentPostId(null);
          setCurrentCollectionId(collectionId);
          setIsCurrentBanner(true);
          // Store for restoration
          lastPostIdRef.current = null;
          lastCollectionIdRef.current = collectionId;
          lastIsBannerRef.current = true;
        } else {
          setCurrentPostId(null);
          setCurrentCollectionId(null);
          setIsCurrentBanner(true);
          // Store for restoration
          lastPostIdRef.current = null;
          lastCollectionIdRef.current = null;
          lastIsBannerRef.current = true;
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
          : firstEntry.kind === "banner"
          ? `banner-${firstEntry.banner?.id ?? "unknown"}`
          : `collection-${firstEntry.collection?.id ?? "unknown"}`;

      // Only initialize if this is a new feed (first entry changed or not initialized)
      if (lastFirstEntryId.current !== firstEntryId) {
        if (firstEntry.kind === "post") {
          const postId = firstEntry.post.id;
          setCurrentPostId(postId);
          setCurrentCollectionId(null);
          setIsCurrentBanner(false);
          // Store for restoration
          lastPostIdRef.current = postId;
          lastCollectionIdRef.current = null;
          lastIsBannerRef.current = false;
        } else if (firstEntry.kind === "collectionBanner") {
          const collectionId = firstEntry.collection?.id ?? null;
          setCurrentPostId(null);
          setCurrentCollectionId(collectionId);
          setIsCurrentBanner(true);
          // Store for restoration
          lastPostIdRef.current = null;
          lastCollectionIdRef.current = collectionId;
          lastIsBannerRef.current = true;
        } else {
          setCurrentPostId(null);
          setCurrentCollectionId(null);
          setIsCurrentBanner(true);
          // Store for restoration
          lastPostIdRef.current = null;
          lastCollectionIdRef.current = null;
          lastIsBannerRef.current = true;
        }
        lastFirstEntryId.current = firstEntryId;
      }
    }
  }, [feedEntries]);

  // Pause all videos when screen loses focus (navigating away)
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - restore last known state immediately (if any)
      if (lastPostIdRef.current !== null) {
        setCurrentPostId(lastPostIdRef.current);
        setCurrentCollectionId(null);
        setIsCurrentBanner(false);
      } else if (lastCollectionIdRef.current !== null) {
        setCurrentPostId(null);
        setCurrentCollectionId(lastCollectionIdRef.current);
        setIsCurrentBanner(true);
      } else if (lastIsBannerRef.current) {
        setCurrentPostId(null);
        setCurrentCollectionId(null);
        setIsCurrentBanner(true);
      }

      return () => {
        // Screen is blurred - pause all videos by setting currentPostId to null
        // This makes all FeedPostCards have isVisible=false, pausing their videos
        // Don't clear the refs - we'll restore from them when screen regains focus
        setCurrentPostId(null);
        setCurrentCollectionId(null);
        setIsCurrentBanner(false);
      };
    }, [feedEntries])
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

  // Get current collection from store (always up-to-date)
  const currentCollection =
    currentCollectionId != null
      ? (() => {
          const entry = feedEntries.find(
            (e) =>
              e.kind === "collectionBanner" &&
              e.collection?.id === currentCollectionId
          ) as Extract<FeedEntry, { kind: "collectionBanner" }> | undefined;
          return entry ? entry.collection : null;
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
              : item.kind === "banner"
              ? `banner-${item.banner.id}-${item.position}-${index}`
              : `collection-${item.collection?.id}-${item.position}-${index}`
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
            if (entry.kind === "banner" && !entry.banner) return null;
            if (entry.kind === "collectionBanner" && !entry.collection) return null;
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
                ) : entry.kind === "banner" ? (
                  // Banner card with grayscale background and colored overlay
                  <BannerCard
                    banner={entry.banner}
                    onPress={() => {
                      const cleaned = entry.banner?.redirectUrl?.replace(
                        /^\/?/,
                        ""
                      );
                      const path = `/${cleaned}`;
                      router.push(path as any);
                    }}
                  />
                ) : (
                  <CollectionBannerCard
                    collection={entry.collection}
                    onPress={() =>
                      router.push({
                        pathname: `/collections/${entry.collection?.id}`,
                        params: {
                          name: entry.collection?.name,
                        },
                      } as any)
                    }
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
          onAuthorPress={async () => {
            const author = currentPost.author;
            
            // Build initialUser from available data
            const initialUser: UserSummary = {
              id: author.id,
              username: author.username,
              firstName: author.firstName ?? null,
              lastName: author.lastName ?? null,
              avatar: author.avatar ?? null,
            };

            // Fetch user summary to get role (cached, fast)
            const userSummary = await fetchUserSummaryCached(author.id).catch(() => null);
            
            // If user is an artist, fetch artist profile summary
            let initialArtist = null;
            if (userSummary?.role === "ARTIST") {
              const artistSummary = await fetchArtistProfileSummary(author.id).catch(() => null);
              if (artistSummary) {
                initialArtist = artistSummary;
              }
              // Merge location data from summary if available
              if (userSummary.city || userSummary.province) {
                initialUser.city = userSummary.city;
                initialUser.province = userSummary.province;
              }
              if (userSummary.role) {
                initialUser.role = userSummary.role;
              }
            }

            // Prefetch full profile in background
            prefetchUserProfile(author.id).catch(() => {
              // Ignore prefetch errors
            });

            // Navigate with initial params for instant rendering
            router.push({
              pathname: `/user/${author.id}`,
              params: {
                initialUser: JSON.stringify(initialUser),
                ...(initialArtist && {
                  initialArtist: JSON.stringify(initialArtist),
                }),
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

      {/* Collection banner overlay - above gradients, at screen level */}
      {currentCollection && isCurrentBanner && (
        <CollectionBannerOverlay
          collection={currentCollection}
          onPress={() =>
            router.push({
              pathname: `/collections/${currentCollection.id}`,
              params: {
                name: currentCollection.name,
              },
            } as any)
          }
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
        <SVGIcons.LogoLight height={s(50)} width={s(90)} />
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
