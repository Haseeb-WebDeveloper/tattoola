import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

interface TattooPostsGridProps {
  posts: {
    id: string;
    thumbnailUrl?: string;
    caption?: string;
    media: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO" }[];
  }[];
}

export const TattooPostsGrid: React.FC<TattooPostsGridProps> = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-tat-foreground"
        style={{ paddingVertical: mvs(60), minHeight: mvs(253) }}
      >
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-gray text-center font-neueLight"
        >
          No tattoos yet
        </ScaledText>
      </View>
    );
  }

  // Split posts into two columns for masonry layout
  const leftColumn: typeof posts = [];
  const rightColumn: typeof posts = [];

  posts.forEach((post, index) => {
    if (index % 2 === 0) {
      leftColumn.push(post);
    } else {
      rightColumn.push(post);
    }
  });

  return (
    <View
      className="flex-row bg-tat-foreground "
      style={{
        paddingHorizontal: s(16),
        paddingVertical: mvs(16),
        gap: s(16),
      }}
    >
      {/* Left Column */}
      <View className="flex-1" style={{ gap: s(16) }}>
        {leftColumn.map((post) => (
          <PostGridItem key={post.id} post={post} />
        ))}
      </View>

      {/* Right Column */}
      <View className="flex-1" style={{ gap: s(16) }}>
        {rightColumn.map((post) => (
          <PostGridItem key={post.id} post={post} />
        ))}
      </View>
    </View>
  );
};

interface PostGridItemProps {
  post: {
    id: string;
    thumbnailUrl?: string;
    caption?: string;
    media: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO" }[];
  };
}

const PostGridItem: React.FC<PostGridItemProps> = ({ post }) => {
  // Use first media item or thumbnail
  const imageUrl = post.media?.[0]?.mediaUrl || post.thumbnailUrl;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => router.push(`/post/${post.id}` as any)}
      className="rounded-xl overflow-hidden"
      style={{
        height: s(253),
        borderRadius: s(12),
      }}
    >
      {/* Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />
      ) : (
        <View className="bg-gray/30 w-full h-full" />
      )}

      {/* Gradient Overlay with Caption */}
      {post.caption && (
        <LinearGradient
          colors={["rgba(17, 17, 17, 0)", "rgba(17, 17, 17, 1)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: s(48),
            paddingBottom: s(8),
            paddingHorizontal: s(8),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-normal"
            style={{ fontSize: s(13), lineHeight: s(18) }}
            numberOfLines={2}
          >
            {post.caption}
          </ScaledText>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

