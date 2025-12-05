import EditPostModal from "@/components/post/EditPostModal";
import { CustomToast } from "@/components/ui/CustomToast";
import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  FeedPost,
  deletePost,
  fetchPostDetails,
  togglePostLike,
  updatePost,
} from "@/services/post.service";
import { toggleFollow } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Animation values for edit modal
  const bottomSheetTranslateY = useRef(
    new Animated.Value(screenHeight)
  ).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const imageTranslateY = useRef(new Animated.Value(0)).current;

  // Create video players for media items (hooks must be called unconditionally)
  // Create up to 5 players to handle most posts
  // Initialize with URLs if available, otherwise empty string
  const player1 = useVideoPlayer(
    post?.media?.[0]?.mediaType === "VIDEO" ? post.media[0].mediaUrl || "" : "",
    (player) => {
      if (post?.media?.[0]?.mediaType === "VIDEO" && currentMediaIndex === 0) {
        player.loop = true;
        player.muted = true;
        // Small delay for iOS to ensure player is ready
        setTimeout(() => {
          player.play();
        }, 100);
      }
    }
  );
  const player2 = useVideoPlayer(
    post?.media?.[1]?.mediaType === "VIDEO" ? post.media[1].mediaUrl || "" : "",
    (player) => {
      if (post?.media?.[1]?.mediaType === "VIDEO" && currentMediaIndex === 1) {
        player.loop = true;
        player.muted = true;
        setTimeout(() => {
          player.play();
        }, 100);
      }
    }
  );
  const player3 = useVideoPlayer(
    post?.media?.[2]?.mediaType === "VIDEO" ? post.media[2].mediaUrl || "" : "",
    (player) => {
      if (post?.media?.[2]?.mediaType === "VIDEO" && currentMediaIndex === 2) {
        player.loop = true;
        player.muted = true;
        setTimeout(() => {
          player.play();
        }, 100);
      }
    }
  );
  const player4 = useVideoPlayer(
    post?.media?.[3]?.mediaType === "VIDEO" ? post.media[3].mediaUrl || "" : "",
    (player) => {
      if (post?.media?.[3]?.mediaType === "VIDEO" && currentMediaIndex === 3) {
        player.loop = true;
        player.muted = true;
        setTimeout(() => {
          player.play();
        }, 100);
      }
    }
  );
  const player5 = useVideoPlayer(
    post?.media?.[4]?.mediaType === "VIDEO" ? post.media[4].mediaUrl || "" : "",
    (player) => {
      if (post?.media?.[4]?.mediaType === "VIDEO" && currentMediaIndex === 4) {
        player.loop = true;
        player.muted = true;
        setTimeout(() => {
          player.play();
        }, 100);
      }
    }
  );
  const videoPlayers = [player1, player2, player3, player4, player5];

  // Update video players when media or current index changes
  useEffect(() => {
    if (!post?.media) return;

    const updatePlayers = async () => {
      for (
        let index = 0;
        index < post.media.length && index < videoPlayers.length;
        index++
      ) {
        const mediaItem = post.media[index];
        const player = videoPlayers[index];
        if (player && mediaItem.mediaType === "VIDEO") {
          try {
            await player.replaceAsync(mediaItem.mediaUrl);
            player.loop = true;
            player.muted = true;
            // Only autoplay if it's the current visible item
            // Add small delay for iOS to ensure player is ready
            if (index === currentMediaIndex) {
              setTimeout(() => {
                player.play();
              }, 100);
            } else {
              player.pause();
            }
          } catch (error) {
            console.error(`Error loading video ${index}:`, error);
          }
        }
      }
    };

    updatePlayers();
  }, [post?.media, currentMediaIndex, videoPlayers]);

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

  const isOwnPost = user && post && user.id === post.author.id;

  const handleEdit = () => {
    setShowEditModal(true);
    // Animate bottom sheet sliding up and image moving up
    Animated.parallel([
      Animated.timing(bottomSheetTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(imageTranslateY, {
        toValue: -screenHeight * 0.25, // Move image up by 25% of screen height
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseEdit = () => {
    // Animate bottom sheet sliding down and image moving back
    Animated.parallel([
      Animated.timing(bottomSheetTranslateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(imageTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEditModal(false);
    });
  };

  const handleSaveEdit = async (data: {
    caption: string;
    styleId?: string;
    collectionIds: string[];
  }) => {
    if (!post || !user) return;

    try {
      await updatePost(post.id, user.id, {
        caption: data.caption,
        styleId: data.styleId,
        collectionIds: data.collectionIds,
      });

      // Reload post data
      await loadPost();

      // Show success toast
      const toastId = toast.custom(
        <CustomToast
          message="Tattoo details has been updated"
          iconType="success"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!post || !user || !isOwnPost) return;

    setDeleting(true);
    try {
      await deletePost(post.id, user.id);
      // Navigate back after successful deletion
      router.back();
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      setDeleting(false);
      setShowDeleteModal(false);
      // You could show an error toast here
    }
  };

  if (loading) {
    // Skeleton matching post detail layout exactly
    return (
      <View className="relative flex-1 bg-background">
        {/* Header with functional back button */}
        <View className="absolute z-10 top-4 left-4">
          <TouchableOpacity
            onPress={handleBack}
            className="items-center justify-center w-10 h-10 rounded-full bg-foreground/20"
          >
            <SVGIcons.ChevronLeft className="w-5 h-5 text-white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
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
                className="absolute left-0 right-0 flex-row justify-center gap-2 bottom-4"
                style={{ zIndex: 2 }}
              >
                <View className="w-2 h-2 bg-white rounded-full" />
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
                  <View className="w-4/5 h-6 mb-2 rounded bg-foreground/10" />
                  <View className="w-3/5 h-5 rounded bg-foreground/10" />
                </View>
                <View
                  className="rounded bg-foreground/10"
                  style={{ width: s(26), height: s(26) }}
                />
              </View>

              {/* Author info */}
              <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center flex-1">
                  <View
                    className="mr-3 rounded-full bg-foreground/10"
                    style={{ width: s(40), height: s(40) }}
                  />
                  <View className="flex-1">
                    <View className="w-1/2 h-3 mb-1 rounded bg-foreground/10" />
                    <View className="w-1/3 h-3 mb-1 rounded bg-foreground/10" />
                    <View className="w-1/4 h-3 rounded bg-foreground/10" />
                  </View>
                </View>
                <View className="flex-row items-center gap-2 px-4 py-2 border rounded-full border-gray">
                  <View className="w-4 h-4 rounded bg-foreground/10" />
                  <View className="w-12 h-4 rounded bg-foreground/10" />
                </View>
              </View>

              {/* Divider */}
              <View className="h-[0.5px] w-full bg-[#A49A99] mb-6" />

              {/* Likes info */}
              <View className="mb-6">
                <View className="w-1/3 h-4 mb-3 rounded bg-foreground/10" />

                {/* Recent likers skeleton */}
                <View className="flex-col items-start justify-start gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <View key={i} className="flex-row items-center">
                      <View className="w-10 h-10 mr-2 border-2 rounded-full border-primary bg-foreground/10" />
                      <View className="w-24 h-4 rounded bg-foreground/10" />
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
      <View className="items-center justify-center flex-1 px-6 bg-background">
        <Text className="mb-4 text-center text-foreground">
          {error || "Post non trovato"}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="px-6 py-3 rounded-lg bg-primary"
        >
          <Text className="text-white font-neueSemibold">Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="relative flex-1"
      style={{ backgroundColor: showEditModal ? "#0F0202" : "#000000" }}
    >
      {/* Header with back button */}
      {!showEditModal && (
        <View className="absolute z-10 top-4 left-4">
          <TouchableOpacity
            onPress={handleBack}
            className="items-center justify-center w-10 h-10 rounded-full bg-foreground/20"
          >
            <SVGIcons.ChevronLeft className="w-5 h-5 text-white" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Media Carousel */}
        <Animated.View
          className="bg-[#230808]"
          style={{
            transform: [{ translateY: imageTranslateY }],
          }}
        >
          <View
            className="relative w-full bg-[#230808] rounded-b-[40px] overflow-hidden"
            style={{ height: (screenWidth * 16) / 9 }}
          >
            <FlatList
              data={post.media}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
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
                className="absolute left-0 right-0 flex-row justify-center gap-2 bottom-4"
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
        </Animated.View>

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
                  className="mb-2 text-foreground font-neueBold"
                >
                  {String(post.caption || "Nessuna descrizione")}
                </ScaledText>

                {/* Style tag */}
                {/* {post.style && (
                  <View className="inline-flex self-start px-3 py-1 border rounded-full border-gray max-w-fit">
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
                className="z-10 items-center"
              >
                {post.isLiked ? (
                  <SVGIcons.LikeFilled width={s(26)} height={s(26)} />
                ) : (
                  <SVGIcons.Like width={s(26)} height={s(26)} />
                )}
              </TouchableOpacity>
            </View>

            {/* Author info (clickable -> navigate to user profile) */}
            {post.author && (
              <View className="z-10 flex-row items-center justify-between mb-8">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    post.author?.id &&
                    router.push(`/user/${post.author.id}` as any)
                  }
                  className="flex-row items-center flex-1"
                >
                  <Image
                    source={{
                      uri:
                        post.author?.avatar ||
                        `https://api.dicebear.com/7.x/initials/png?seed=${post.author?.firstName?.[0] || post.author?.username?.[0] || "u"}`,
                    }}
                    className="mr-3 rounded-full"
                    style={{ width: s(40), height: s(40) }}
                  />
                  <View className="justify-center flex-1">
                    <ScaledText
                      variant="11"
                      className="text-foreground font-neueMedium"
                    >
                      {(() => {
                        const name =
                          `${post.author?.firstName || ""} ${post.author?.lastName || ""}`.trim();
                        return name || "User";
                      })()}
                    </ScaledText>
                    {post.author?.username ? (
                      <ScaledText
                        variant="11"
                        className="text-gray font-neueLight"
                      >
                        {`@${post.author.username}`}
                      </ScaledText>
                    ) : null}
                    {getLocationString() ? (
                      <ScaledText
                        variant="11"
                        className="text-gray font-neueLight"
                      >
                        {getLocationString()}
                      </ScaledText>
                    ) : null}
                  </View>
                </TouchableOpacity>

                {/* Only show follow button if not viewing own post */}
                {user && post.author && user.id !== post.author.id && (
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
                )}
              </View>
            )}

            {/* Divider */}
            <View className="h-[0.5px] w-full bg-[#A49A99] mb-6" />

            {/* Likes info */}
            <View className="mb-6">
              <ScaledText
                variant="sm"
                className="mb-3 text-foreground font-montserratSemibold"
              >
                {`Piace a ${String(post.likesCount || 0)} persone`}
              </ScaledText>

              {/* Recent likers */}
              {post.likes && post.likes.length > 0 && (
                <View className="flex-col items-start justify-start gap-3">
                  {post.likes.slice(0, 6).map((like) => (
                    <View key={like.id} className="flex-row items-center">
                      <Image
                        source={{
                          uri:
                            like?.avatar ||
                            `https://api.dicebear.com/7.x/initials/png?seed=${like?.username?.[0] || "u"}`,
                        }}
                        className="w-10 h-10 mr-2 border-2 rounded-full border-primary"
                      />
                      {like.username && (
                        <ScaledText
                          variant="md"
                          className="text-foreground font-montserratSemibold"
                        >
                          {`@${like.username}`}
                        </ScaledText>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Edit and Delete buttons - only show for own posts */}
            {isOwnPost && (
              <View className="flex-row items-center justify-between px-4 pb-6">
                <TouchableOpacity
                  onPress={handleEdit}
                  className="flex-row items-center justify-center border rounded-full"
                  style={{
                    borderColor: "#D9D9D9",
                    paddingVertical: mvs(5.919),
                    paddingHorizontal: s(18),
                    gap: s(5),
                  }}
                >
                  <SVGIcons.Edit width={s(14)} height={s(14)} />
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-white font-montserratSemibold"
                    style={{ fontSize: s(12) }}
                  >
                    Edit
                  </ScaledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(true)}
                  className="flex-row items-center justify-center rounded-full"
                  style={{
                    paddingVertical: mvs(5.919),
                    paddingHorizontal: s(18),
                    gap: s(5),
                  }}
                >
                  <SVGIcons.Trash width={s(14)} height={s(14)} />
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="font-montserratSemibold"
                    style={{
                      fontSize: s(12),
                      color: "#AE0E0E",
                    }}
                  >
                    Delete
                  </ScaledText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !deleting && setShowDeleteModal(false)}
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl max-w-[90vw]"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(28),
            }}
          >
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(6) }}
            >
              Eliminare il post?
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-center text-background font-montserratSemibold"
              style={{ marginBottom: mvs(20) }}
            >
              Questa azione non può essere annullata. Il post verrà eliminato
              definitivamente.
            </ScaledText>
            <View
              className="flex-row justify-center"
              style={{ columnGap: s(10) }}
            >
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                className="flex-row items-center justify-center rounded-full border-primary"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  borderWidth: s(1),
                  opacity: deleting ? 0.6 : 1,
                  gap: s(4),
                }}
              >
                <SVGIcons.DeletePrimary width={s(16)} height={s(16)} />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-primary font-montserratSemibold"
                >
                  {deleting ? "Eliminazione..." : "Elimina"}
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => !deleting && setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-row items-center justify-center rounded-full"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratSemibold"
                >
                  Annulla
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Post Bottom Sheet */}
      {post && showEditModal && (
        <>
          {/* Overlay */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              opacity: overlayOpacity,
              zIndex: 100,
            }}
            pointerEvents={showEditModal ? "auto" : "none"}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={handleCloseEdit}
            />
          </Animated.View>

          {/* Header - Fixed at top */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,

              paddingTop: s(20),
              paddingBottom: s(16),
              paddingHorizontal: s(16),
              zIndex: 102,
              opacity: overlayOpacity,
            }}
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={handleCloseEdit}>
                <View
                  className="rounded-full bg-white/10"
                  style={{
                    width: s(35),
                    height: s(35),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SVGIcons.Close width={s(14)} height={s(14)} />
                </View>
              </TouchableOpacity>
              <ScaledText
                variant="lg"
                className="text-white font-neueMedium"
                style={{ fontSize: s(16) }}
              >
                Edit tattoo details
              </ScaledText>
              <View style={{ width: s(35) }} />
            </View>
          </Animated.View>

          {/* Bottom Sheet - Form */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: screenHeight * 0.65,
              backgroundColor: "#0F0202",
              paddingTop: s(20),

              transform: [{ translateY: bottomSheetTranslateY }],
              zIndex: 101,
            }}
          >
            <EditPostModal
              visible={showEditModal}
              post={{
                id: post.id,
                caption: post.caption,
                style: post.style,
                media: post.media,
              }}
              onClose={handleCloseEdit}
              onSave={async (data) => {
                await handleSaveEdit(data);
                handleCloseEdit();
              }}
              isBottomSheet={true}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}
