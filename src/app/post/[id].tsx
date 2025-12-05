import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  FeedPost,
  fetchPostDetails,
  togglePostLike,
} from "@/services/post.service";
import { cloudinaryService } from "@/services/cloudinary.service";
import { toggleFollow } from "@/services/profile.service";
import { s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface PostDetail {
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
}

// Convert FeedPost to partial PostDetail for instant render
function convertFeedPostToPartialDetail(feedPost: FeedPost): PostDetail {
  return {
    id: feedPost.id,
    caption: feedPost.caption,
    thumbnailUrl: feedPost.media?.[0]?.mediaUrl,
    likesCount: feedPost.likesCount,
    commentsCount: feedPost.commentsCount,
    createdAt: feedPost.createdAt,
    media: feedPost.media,
    style: feedPost.style
      ? { ...feedPost.style, imageUrl: undefined }
      : undefined,
    author: {
      ...feedPost.author,
      municipality: undefined,
      province: undefined,
    },
    isLiked: feedPost.isLiked,
    isFollowingAuthor: false, // Will be fetched
    likes: [], // Will be fetched
  };
}

export default function PostDetailScreen() {
  const { id, initialData } = useLocalSearchParams<{
    id: string;
    initialData?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();

  // Parse initial data from feed (if available) for instant render
  const parsedInitial = useMemo(() => {
    if (!initialData) return null;
    try {
      const feedPost = JSON.parse(initialData) as FeedPost;
      return convertFeedPostToPartialDetail(feedPost);
    } catch {
      return null;
    }
  }, [initialData]);

  // If we have initial data, show content immediately (no loading state)
  const [loading, setLoading] = useState(!parsedInitial);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostDetail | null>(parsedInitial);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Track content and viewport width for horizontal scroll control
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  
  // Only allow bouncing if content exceeds viewport (iOS only)
  const shouldBounce = contentWidth > viewportWidth && Platform.OS === "ios";

  // Create video players for media items (hooks must be called unconditionally)
  // Initialize with URLs from post media if available, otherwise empty string
  // Transform video URLs to MP4/H.264/AAC for iOS compatibility
  const videoUrl1 = post?.media?.[0]?.mediaType === "VIDEO" 
    ? cloudinaryService.getIOSCompatibleVideoUrl(post.media[0].mediaUrl || "") 
    : "";
  const videoUrl2 = post?.media?.[1]?.mediaType === "VIDEO" 
    ? cloudinaryService.getIOSCompatibleVideoUrl(post.media[1].mediaUrl || "") 
    : "";
  const videoUrl3 = post?.media?.[2]?.mediaType === "VIDEO" 
    ? cloudinaryService.getIOSCompatibleVideoUrl(post.media[2].mediaUrl || "") 
    : "";
  const videoUrl4 = post?.media?.[3]?.mediaType === "VIDEO" 
    ? cloudinaryService.getIOSCompatibleVideoUrl(post.media[3].mediaUrl || "") 
    : "";
  const videoUrl5 = post?.media?.[4]?.mediaType === "VIDEO" 
    ? cloudinaryService.getIOSCompatibleVideoUrl(post.media[4].mediaUrl || "") 
    : "";

  const player1 = useVideoPlayer(videoUrl1, (player) => {
    if (videoUrl1) {
      player.loop = true;
      player.muted = false;
      // Only autoplay if it's the current visible item
      if (currentMediaIndex === 0) {
        player.play();
      }
    }
  });
  const player2 = useVideoPlayer(videoUrl2, (player) => {
    if (videoUrl2) {
      player.loop = true;
      player.muted = false;
      if (currentMediaIndex === 1) {
        player.play();
      }
    }
  });
  const player3 = useVideoPlayer(videoUrl3, (player) => {
    if (videoUrl3) {
      player.loop = true;
      player.muted = false;
      if (currentMediaIndex === 2) {
        player.play();
      }
    }
  });
  const player4 = useVideoPlayer(videoUrl4, (player) => {
    if (videoUrl4) {
      player.loop = true;
      player.muted = false;
      if (currentMediaIndex === 3) {
        player.play();
      }
    }
  });
  const player5 = useVideoPlayer(videoUrl5, (player) => {
    if (videoUrl5) {
      player.loop = true;
      player.muted = false;
      if (currentMediaIndex === 4) {
        player.play();
      }
    }
  });
  const videoPlayers = [player1, player2, player3, player4, player5];

  // Update video players when current index changes (for autoplay control)
  // This ensures the correct video plays when user swipes
  useEffect(() => {
    if (!post?.media) return;
    
    post.media.forEach((mediaItem, index) => {
      if (index >= videoPlayers.length) return;
      const player = videoPlayers[index];
      if (player && mediaItem.mediaType === "VIDEO") {
        try {
          // Only autoplay if it's the current visible item
          if (index === currentMediaIndex) {
            player.loop = true;
            player.muted = false;
            player.play();
          } else {
            player.pause();
          }
        } catch (error) {
          // Player might be released, ignore
        }
      }
    });
  }, [currentMediaIndex, post?.media, videoPlayers]);

  const loadPost = useCallback(async () => {
    if (!id || !user) return;

    try {
      // Only show loading if we don't have initial data
      if (!parsedInitial) {
        setLoading(true);
      }
      const data = await fetchPostDetails(id, user.id);
      setPost(data);
    } catch (err: any) {
      // Only show error if we don't have initial data to display
      if (!parsedInitial) {
        setError(err.message || "Impossibile caricare il post");
      }
      console.error("Failed to load post details:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user, parsedInitial]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleBack = () => {
    router.back();
  };

  const handleLike = async () => {
    if (!post || !user) return;

    const previous = post;
    const optimistic: PostDetail = {
      ...previous,
      isLiked: !previous.isLiked,
      likesCount: previous.isLiked
        ? Math.max(previous.likesCount - 1, 0)
        : previous.likesCount + 1,
    };
    setPost(optimistic);

    try {
      const result = await togglePostLike(previous.id, user.id);
      setPost((curr) =>
        curr
          ? { ...curr, isLiked: result.isLiked, likesCount: result.likesCount }
          : curr
      );
    } catch (err: any) {
      setPost(previous);
      console.error("Failed to toggle like:", err);
    }
  };

  const handleFollow = async () => {
    if (!post || !user) return;
    const previous = post;
    const optimistic: PostDetail = {
      ...previous,
      isFollowingAuthor: !previous.isFollowingAuthor,
    };
    setPost(optimistic);

    try {
      const result = await toggleFollow(user.id, previous.author.id);
      setPost((curr) =>
        curr ? { ...curr, isFollowingAuthor: result.isFollowing } : curr
      );
    } catch (err) {
      setPost(previous);
      console.error("Failed to toggle follow:", err);
    }
  };

  const getLocationString = () => {
    if (!post?.author) return "";
    const parts = [];
    if (post.author.municipality) parts.push(post.author.municipality);
    if (post.author.province) parts.push(`(${post.author.province})`);
    return parts.join(" ");
  };

  if (loading) {
    // Skeleton matching post detail layout exactly
    return (
      <View className="flex-1 bg-background relative">
        {/* Header with functional back button */}
        <View className="absolute top-4 left-4 z-10">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.ChevronLeft className="w-5 h-5 text-white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Media Carousel skeleton */}
          <View className="bg-[#230808]">
            <View
              className="relative w-full  rounded-b-[40px] overflow-hidden"
              style={{ height: (screenWidth * 16) / 9 }}
            >
              {/* Image placeholder */}
              <View className="w-full h-full bg-foreground/10" />

              {/* Top fade gradient */}
              <LinearGradient
                colors={["rgba(0,0,0,0.6)", "transparent"]}
                locations={[0, 1]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 140,
                  zIndex: 1,
                }}
                pointerEvents="none"
                className="rounded-b-[40px]"
              />

              {/* Bottom fade gradient */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                locations={[0, 1]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 180,
                  zIndex: 1,
                  borderBottomLeftRadius: 30,
                  borderBottomRightRadius: 30,
                }}
                pointerEvents="none"
              />

              {/* Carousel indicator placeholder */}
              <View
                className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2"
                style={{ zIndex: 2 }}
              >
                <View className="w-2 h-2 rounded-full bg-white" />
                <View className="w-2 h-2 rounded-full bg-white/50" />
                <View className="w-2 h-2 rounded-full bg-white/50" />
              </View>
            </View>
          </View>

          <LinearGradient
            colors={["rgba(35,8,8,1)", "transparent"]}
            locations={[0, 1]}
            pointerEvents="box-none"
          >
            {/* Content below media */}
            <View className="px-4 py-4">
              {/* Caption and like button */}
              <View className="flex-row items-start justify-between mb-6">
                <View className="flex-1 mr-4">
                  <View className="h-6 bg-foreground/10 rounded w-4/5 mb-2" />
                  <View className="h-5 bg-foreground/10 rounded w-3/5" />
                </View>
                <View
                  className="bg-foreground/10 rounded"
                  style={{ width: s(26), height: s(26) }}
                />
              </View>

              {/* Author info */}
              <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center flex-1">
                  <View
                    className="rounded-full mr-3 bg-foreground/10"
                    style={{ width: s(40), height: s(40) }}
                  />
                  <View className="flex-1">
                    <View className="h-3 bg-foreground/10 rounded w-1/2 mb-1" />
                    <View className="h-3 bg-foreground/10 rounded w-1/3 mb-1" />
                    <View className="h-3 bg-foreground/10 rounded w-1/4" />
                  </View>
                </View>
                <View className="border border-gray rounded-full px-4 py-2 flex-row items-center gap-2">
                  <View className="w-4 h-4 bg-foreground/10 rounded" />
                  <View className="h-4 bg-foreground/10 rounded w-12" />
                </View>
              </View>

              {/* Divider */}
              <View className="h-[0.5px] w-full bg-[#A49A99] mb-6" />

              {/* Likes info */}
              <View className="mb-6">
                <View className="h-4 bg-foreground/10 rounded w-1/3 mb-3" />

                {/* Recent likers skeleton */}
                <View className="flex-col items-start justify-start gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <View key={i} className="flex-row items-center">
                      <View className="w-10 h-10 border-2 border-primary rounded-full mr-2 bg-foreground/10" />
                      <View className="h-4 bg-foreground/10 rounded w-24" />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-center mb-4">
          {error || "Post non trovato"}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-neueSemibold">Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background relative">
      {/* Header with back button */}
      <View className="absolute top-4 left-4 z-10">
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-foreground/20 items-center justify-center"
        >
          <SVGIcons.ChevronLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Media Carousel */}
        <View className="bg-[#230808]">
          <View
            className="relative w-full bg-[#230808] rounded-b-[40px] overflow-hidden"
            style={{ height: (screenWidth * 16) / 9 }}
          >
            <FlatList
              data={post.media}
              horizontal
              pagingEnabled
              scrollEnabled={post.media.length > 1}
              showsHorizontalScrollIndicator={false}
              bounces={shouldBounce}
              onContentSizeChange={(width) => {
                setContentWidth(width);
              }}
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setViewportWidth(width);
              }}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / screenWidth
                );
                setCurrentMediaIndex(index);
              }}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => {
                const isVideo = item.mediaType === "VIDEO";
                const player = videoPlayers[index];

                return (
                  <View style={{ width: screenWidth }}>
                    {isVideo && player ? (
                      <VideoView
                        player={player}
                        style={{
                          width: screenWidth,
                          height: (screenWidth * 16) / 9,
                        }}
                        contentFit="cover"
                        nativeControls={false}
                      />
                    ) : (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={{
                          width: screenWidth,
                          height: (screenWidth * 16) / 9,
                        }}
                        resizeMode="cover"
                        className="bg-primary"
                      />
                    )}
                  </View>
                );
              }}
            />

            {/* Top fade gradient for header/back contrast */}
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent"]}
              locations={[0, 1]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 140,
                zIndex: 1,
              }}
              pointerEvents="none"
              className="rounded-b-[40px]"
            />

            {/* Bottom fade gradient for caption/indicators contrast */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              locations={[0, 1]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 180,
                zIndex: 1,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
              }}
              pointerEvents="none"
            />

            {/* Carousel indicators */}
            {post.media.length > 1 && (
              <View
                className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2"
                style={{ zIndex: 2 }}
              >
                {post.media.map((_, index) => (
                  <View
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentMediaIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <LinearGradient
          colors={["rgba(35,8,8,1)", "transparent"]}
          locations={[0, 1]}
          pointerEvents="box-none"
        >
          {/* Content below media */}
          <View className="px-4 py-4">
            {/* Caption and like button */}
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-1 mr-4">
                <ScaledText
                  variant="lg"
                  className="text-foreground mb-2 font-neueBold"
                >
                  {post.caption || "Nessuna descrizione"}
                </ScaledText>

                {/* Style tag */}
                {/* {post.style && (
                  <View className="inline-flex self-start rounded-full px-3 py-1 border border-gray max-w-fit">
                    <ScaledText
                      variant="sm"
                      className="text-gray font-neueLight"
                    >
                      {post.style.name}
                    </ScaledText>
                  </View>
                )} */}
              </View>

              <TouchableOpacity
                onPress={handleLike}
                className="items-center z-10"
              >
                {post.isLiked ? (
                  <SVGIcons.LikeFilled width={s(26)} height={s(26)} />
                ) : (
                  <SVGIcons.Like width={s(26)} height={s(26)} />
                )}
              </TouchableOpacity>
            </View>

            {/* Author info (clickable -> navigate to user profile) */}
            <View className="flex-row items-center justify-between mb-8 z-10">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/user/${post.author.id}` as any)}
                className="flex-row items-center flex-1"
              >
                <Image
                  source={{
                    uri:
                      post.author.avatar ||
                      `https://api.dicebear.com/7.x/initials/png?seed=${post.author.firstName?.[0] || post.author.username?.[0] || "u"}`,
                  }}
                  className="rounded-full mr-3"
                  style={{ width: s(40), height: s(40) }}
                />
                <View className="flex-1 justify-center">
                  <ScaledText
                    variant="11"
                    className="text-foreground font-neueMedium"
                  >
                    {post.author.firstName} {post.author.lastName}
                  </ScaledText>
                  <ScaledText variant="11" className="text-gray font-neueLight">
                    @{post.author.username}
                  </ScaledText>
                  {getLocationString() && (
                    <ScaledText
                      variant="11"
                      className="text-gray font-neueLight"
                    >
                      {getLocationString()}
                    </ScaledText>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFollow}
                className={`border rounded-full px-4 py-2 flex-row items-center gap-2 ${post.isFollowingAuthor ? "border-primary bg-primary/10" : "border-gray"}`}
              >
                <SVGIcons.Follow className="w-4 h-4" />
                <ScaledText
                  variant="sm"
                  className="text-foreground font-montserratSemibold"
                >
                  {post.isFollowingAuthor ? "Seguito" : "Segui"}
                </ScaledText>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="h-[0.5px] w-full bg-[#A49A99] mb-6" />

            {/* Likes info */}
            <View className="mb-6">
              <ScaledText
                variant="sm"
                className="text-foreground font-montserratSemibold mb-3"
              >
                Piace a {post.likesCount} persone
              </ScaledText>

              {/* Recent likers */}
              {post.likes.length > 0 && (
                <View className="flex-col items-start justify-start gap-3">
                  {post.likes.slice(0, 6).map((like) => (
                    <View key={like.id} className="flex-row items-center">
                      <Image
                        source={{
                          uri:
                            like.avatar ||
                            `https://api.dicebear.com/7.x/initials/png?seed=${like.username?.[0] || "u"}`,
                        }}
                        className="w-10 h-10 border-2 border-primary rounded-full mr-2"
                      />
                      <ScaledText
                        variant="md"
                        className="text-foreground font-montserratSemibold"
                      >
                        @{like.username}
                      </ScaledText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}
