import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { FeedPost } from "@/services/post.service";
import { useTabBarStore } from "@/stores/tabBarStore";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  post: FeedPost;
  onPress?: () => void;
  onLikePress?: () => void;
};

function FeedPostCardComponent({ post, onPress, onLikePress }: Props) {
  const cover = post.media[0]?.mediaUrl;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarStore((state) => state.tabBarHeight);

  // Use measured tab bar height + safe area bottom
  // If tab bar hasn't been measured yet, use a sensible default
  const bottomPosition = tabBarHeight > 0 ? tabBarHeight + insets.bottom : mvs(119) + insets.bottom;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="w-full h-[100svh]"
    >
      <View
        className="relative w-full overflow-hidden h-full"
        // style={{ aspectRatio: 9 / 19 }}
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
            height: mvs(160),
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
            height: mvs(240),
          }}
          pointerEvents="none"
        />

        {/* Bottom content */}
        <View
          className="absolute left-0 right-0"
          style={{ 
            bottom: bottomPosition,
            paddingHorizontal: s(20),
          }}
        >
          <View
            className="flex-row items-start justify-between"
            style={{ gap: s(16) }}
          >
            <View className="flex-1" style={{ width: "100%" }}>
              <ScaledText
                variant="20"
                className="text-white leading-7 font-neueBold"
                numberOfLines={2}
              >
                {post.caption || "Untitled"}
              </ScaledText>
              <View
                className="flex-row items-center"
                style={{ marginTop: mvs(12) }}
              >
                <Image
                  source={{
                    uri: post.author.avatar || "https://via.placeholder.com/40",
                  }}
                  className="rounded-full"
                  style={{
                    width: s(36),
                    height: s(36),
                    marginRight: s(8),
                  }}
                />
                <ScaledText
                  variant="11"
                  className="text-white/90 font-neueMedium"
                >
                  {post.author.firstName} {post.author.lastName || ""}
                </ScaledText>
              </View>
            </View>
            <TouchableOpacity
              onPress={onLikePress}
              className="rounded-full items-center justify-center"
              style={{
                width: s(48),
                height: s(48),
              }}
            >
              {post.isLiked ? (
                <SVGIcons.LikeFilled
                  width={s(24)}
                  height={s(24)}
                  className="text-red-500"
                />
              ) : (
                <SVGIcons.Like
                  width={s(24)}
                  height={s(24)}
                  className="text-gray-800"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const FeedPostCard = memo(FeedPostCardComponent);
