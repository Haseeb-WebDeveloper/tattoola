import { SVGIcons } from "@/constants/svg";
import { FeedPost } from "@/services/post.service";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  post: FeedPost;
  onPress?: () => void;
  onLikePress?: () => void;
};

function FeedPostCardComponent({ post, onPress, onLikePress }: Props) {
  const cover = post.media[0]?.mediaUrl;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="w-full">
      <View
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: 9 / 19 }}
      >
        {!!cover && (
          <Image
            source={{ uri: cover }}
            className="absolute left-0 right-0 top-0 bottom-0"
            resizeMode="cover"
          />
        )}

        {/* top gradient */}
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 160,
          }}
          pointerEvents="none"
        />

        {/* bottom gradient */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 240,
          }}
          pointerEvents="none"
        />

        {/* Header brand (centered logo) */}
        <View className="absolute top-6 left-0 right-0 px-5 flex-row items-center justify-between">
          <View className="rounded-full items-center justify-center">
            <SVGIcons.Flash className="w-5 h-5" />
          </View>
          <Image
            source={require("../assets/logo/logo-light.png")}
            style={{ width: 110, height: 28 }}
            resizeMode="contain"
          />
          <View style={{ width: 36 }} />
        </View>

        {/* Bottom content */}
        <View className="absolute left-0 right-0 p-5"
        style={{ bottom: 90 }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text
                className="text-white text-[22px] leading-7 font-neueBold"
                numberOfLines={2}
              >
                {post.caption || "Untitled"}
              </Text>
              <View className="flex-row items-center mt-3">
                <Image
                  source={{
                    uri: post.author.avatar || "https://via.placeholder.com/40",
                  }}
                  className="w-9 h-9 rounded-full mr-2"
                />
                <Text className="text-white/90 text-[14px] font-neueMedium">
                  {post.author.firstName} {post.author.lastName || ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onLikePress}
              className="w-12 h-12 rounded-full items-center justify-center"
            >
              {post.isLiked ? (
                <SVGIcons.LikeFilled className="w-6 h-6 text-red-500" />
              ) : (
                <SVGIcons.Like className="w-6 h-6 text-gray-800" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const FeedPostCard = memo(FeedPostCardComponent);
