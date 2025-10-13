import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchPostDetails, togglePostLike } from "@/services/post.service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView from 'react-native-pager-view';

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
  likes: {
    id: string;
    username: string;
    avatar?: string;
  }[];
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);

  const loadPost = useCallback(async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const data = await fetchPostDetails(id, user.id);
      setPost(data);
    } catch (err: any) {
      setError(err.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

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
        curr ? { ...curr, isLiked: result.isLiked, likesCount: result.likesCount } : curr
      );
    } catch (err: any) {
      setPost(previous);
      console.error("Failed to toggle like:", err);
    }
  };

  const handleFollow = () => {
    // TODO: Implement follow functionality
    console.log("Follow user:", post?.author.id);
  };

  // Auto slide like Instagram
  useEffect(() => {
    if (!post || post.media.length <= 1) return;
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = null;
    }
    autoSlideTimer.current = setInterval(() => {
      setCurrentMediaIndex((prev) => {
        const next = post.media.length > 0 ? (prev + 1) % post.media.length : 0;
        if (pagerRef.current) {
          try {
            pagerRef.current.setPage(next);
          } catch {}
        }
        return next;
      });
    }, 3500);
    return () => {
      if (autoSlideTimer.current) {
        clearInterval(autoSlideTimer.current);
        autoSlideTimer.current = null;
      }
    };
  }, [post?.id, post?.media?.length]);

  const getLocationString = () => {
    if (!post?.author) return "";
    const parts = [];
    if (post.author.municipality) parts.push(post.author.municipality);
    if (post.author.province) parts.push(`(${post.author.province})`);
    return parts.join(" ");
  };

  if (loading) {
    // Skeleton matching post detail layout
    return (
      <View className="flex-1 bg-background relative">
        {/* Header back btn */}
        <View className="absolute top-4 left-4 z-10">
          <View className="w-10 h-10 rounded-full bg-foreground/20" />
        </View>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Media skeleton */}
          <View className="aspect-[9/16] w-full bg-foreground/10" />

          <View className="px-4 py-4">
            {/* Caption row */}
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 mr-4">
                <View className="h-5 bg-foreground/10 rounded w-3/4 mb-2" />
                <View className="h-6 bg-foreground/10 rounded w-24" />
              </View>
              <View className="w-8 h-8 rounded-full bg-foreground/10" />
            </View>

            {/* Author info */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full mr-3 bg-foreground/10" />
                <View className="flex-1">
                  <View className="h-4 bg-foreground/10 rounded w-1/2 mb-1" />
                  <View className="h-4 bg-foreground/10 rounded w-1/3 mb-1" />
                  <View className="h-4 bg-foreground/10 rounded w-1/4" />
                </View>
              </View>
              <View className="rounded-lg px-4 py-2 w-20 h-9 bg-foreground/10" />
            </View>

            {/* Likes info */}
            <View className="mb-6">
              <View className="h-4 bg-foreground/10 rounded w-1/3 mb-3" />
              <View className="flex-row flex-wrap gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full mr-2 bg-foreground/10" />
                    <View className="h-4 bg-foreground/10 rounded w-16" />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-center mb-4">
          {error || "Post not found"}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentMedia = post.media[currentMediaIndex];

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
      {/* --- Everything scrolls together now --- */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Media Carousel */}
        <View className="relative aspect-[9/16] w-full bg-black">
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageSelected={(e) => setCurrentMediaIndex(e.nativeEvent.position)}
          >
            {post.media.map((m) => (
              <View key={m.id}>
                <Image
                  source={{ uri: m.mediaUrl }}
                  className="w-full h-full aspect-[9/16]"
                  resizeMode="cover"
                />
              </View>
            ))}
          </PagerView>

          {/* Fade gradient at bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.1)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 80,
            }}
            pointerEvents="none"
            className=" z-10"
          />

          {/* Swipeable; arrows removed for Instagram-like feel */}

          {/* Carousel indicators */}
          {post.media.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
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
        {/* Content below media */}
        <View className="px-4 py-4">
          {/* Caption and like button */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-foreground text-lg font-medium mb-2">
                {post.caption || "Dragon x Sunflower sketch with abc.."}
              </Text>

              {/* Style tag */}
              {post.style && (
                <View className="inline-flex self-start rounded-full px-3 py-1 border border-foreground max-w-fit">
                  <Text className="text-foreground text-sm font-medium">
                    {post.style.name}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleLike} className="items-center">
              {post.isLiked ? (
                <SVGIcons.LikeFilled className="w-8 h-8 text-red-500" />
              ) : (
                <SVGIcons.Like className="w-8 h-8 text-gray-400" />
              )}
            </TouchableOpacity>
          </View>

          {/* Author info */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center flex-1">
              <Image
                source={{
                  uri: post.author.avatar || "https://via.placeholder.com/40",
                }}
                className="w-[60px] h-[60px] rounded-full mr-3"
                defaultSource={{ uri: "https://via.placeholder.com/40" }}
              />
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-[12px] font-neueMedium">
                  {post.author.firstName} {post.author.lastName}
                </Text>
                <Text className="text-tat text-sm">
                  @{post.author.username}
                </Text>
                <Text className="text-tat text-sm">
                  {getLocationString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleFollow}
              className="border border-gray  rounded-full px-4 py-2 flex-row items-center gap-2"
            >
              <SVGIcons.Person className="w-4 h-4" />
              <Text className="text-foreground font-medium">Segui</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="h-[0.2px] w-full bg-[#A49A99] mb-6" />

          {/* Likes info */}
          <View className="mb-6">
            <Text className="text-foreground font-medium mb-3">
              Piace a {post.likesCount} persone
            </Text>

            {/* Recent likers */}
            {post.likes.length > 0 && (
              <View className="flex-row flex-wrap gap-3">
                {post.likes.slice(0, 6).map((like) => (
                  <View key={like.id} className="flex-row items-center">
                    <Image
                      source={{
                        uri: like.avatar || "https://via.placeholder.com/24",
                      }}
                      className="w-10 h-10 border-2 border-primary rounded-full mr-2"
                    />
                    <Text className="text-tat text-[12px] font-neueMedium">
                      @{like.username}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
