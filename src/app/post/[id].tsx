import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchPostDetails, togglePostLike } from "@/services/post.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    Image,
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
    
    try {
      const result = await togglePostLike(post.id, user.id);
      setPost(prev => prev ? {
        ...prev,
        isLiked: result.isLiked,
        likesCount: result.likesCount,
      } : null);
    } catch (err: any) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleFollow = () => {
    // TODO: Implement follow functionality
    console.log("Follow user:", post?.author.id);
  };

  const handleMediaSwipe = (direction: 'left' | 'right') => {
    if (!post || post.media.length <= 1) return;
    
    if (direction === 'left') {
      setCurrentMediaIndex(prev => 
        prev < post.media.length - 1 ? prev + 1 : 0
      );
    } else {
      setCurrentMediaIndex(prev => 
        prev > 0 ? prev - 1 : post.media.length - 1
      );
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
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-center mb-4">{error || "Post not found"}</Text>
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
    <View className="flex-1 bg-background">
      {/* Header with back button */}
      <View className="absolute top-12 left-4 z-10">
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
        >
          <SVGIcons.ChevronLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>
      </View>

      {/* Media Carousel */}
      <View className="relative" style={{ height: screenHeight * 0.6 }}>
        <Image
          source={{ uri: currentMedia?.mediaUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* Navigation arrows */}
        {post.media.length > 1 && (
          <>
            <TouchableOpacity
              onPress={() => handleMediaSwipe('right')}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <SVGIcons.ChevronLeft className="w-5 h-5 text-white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleMediaSwipe('left')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <SVGIcons.ChevronRight className="w-5 h-5 text-white" />
            </TouchableOpacity>
          </>
        )}

        {/* Carousel indicators */}
        {post.media.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {post.media.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Caption and like button */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-foreground text-lg font-medium mb-2">
              {post.caption || "Dragon x Sunflower sketch with abc.."}
            </Text>
            
            {/* Style tag */}
            {post.style && (
              <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1 self-start">
                <SVGIcons.Pen2 className="w-3 h-3 text-gray-600 mr-1" />
                <Text className="text-gray-700 text-sm font-medium">{post.style.name}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            onPress={handleLike}
            className="items-center"
          >
            <SVGIcons.HeartFilled 
              className={`w-8 h-8 ${post.isLiked ? 'text-red-500' : 'text-gray-400'}`} 
            />
          </TouchableOpacity>
        </View>

        {/* Author info */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <Image
              source={{ uri: post.author.avatar || "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-base">
                {post.author.firstName} {post.author.lastName}
              </Text>
              <Text className="text-gray-500 text-sm">@{post.author.username}</Text>
              <Text className="text-gray-500 text-sm">{getLocationString()}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleFollow}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex-row items-center"
          >
            <SVGIcons.Person className="w-4 h-4 text-gray-700 mr-1" />
            <Text className="text-gray-700 font-medium">Segui</Text>
          </TouchableOpacity>
        </View>

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
                    source={{ uri: like.avatar || "https://via.placeholder.com/24" }}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <Text className="text-gray-600 text-sm">@{like.username}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
