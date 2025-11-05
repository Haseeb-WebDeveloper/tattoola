import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { FeedPost } from "@/services/post.service";
import { useTabBarStore } from "@/stores/tabBarStore";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { memo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  post: FeedPost;
  onPress?: () => void;
  onLikePress?: () => void;
  onAuthorPress?: () => void;
};

function FeedPostCardComponent({ post, onPress, onLikePress, onAuthorPress }: Props) {
  const cover = post.media[0]?.mediaUrl;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarStore((state) => state.tabBarHeight);

  // Use measured tab bar height only. Avoid adding safe area again to prevent double counting on 3-button Android.
  // If tab bar hasn't been measured yet, use a sensible default height.
  const bottomPosition = tabBarHeight > 0 ? tabBarHeight : mvs(119);

  console.log("bottomPosition from FeedPostCard", bottomPosition);
  console.log("tabBarHeight from FeedPostCard", tabBarHeight);
  console.log("insets.bottom from FeedPostCard", insets.bottom);
  console.log("post.author.id from FeedPostCard", post.author.id);

  // Default behavior: If onAuthorPress is not passed, fallback to router.push as before
  const handleAuthorPress = () => {
    if (onAuthorPress) {
      onAuthorPress();
    } else {
      router.push(`/user/${post.author.id}` as any);
    }
  };

  return (
    <View className="w-full h-[100svh]">
      <View
        className="relative w-full overflow-hidden h-full"
        // style={{ aspectRatio: 9 / 19 }}
      >
        {/* Background media press area (post open). Placed first so bottom content sits above and captures its own touches. */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        >
          {!!cover && (
            <Image
              source={{ uri: cover }}
              className="absolute left-0 right-0 top-0 bottom-0"
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>

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
            bottom: bottomPosition + mvs(40),
            paddingHorizontal: s(20),
          }}
        >
          <View
            className="flex-row items-start justify-between"
            style={{ gap: s(16) }}
          >
            <View className="flex-1" style={{ width: "100%" }}>
              <View
                className="flex-row items-center justify-start"
                style={{ gap: s(12) }}
              >
                <ScaledText
                  variant="18"
                  className="text-foreground leading-7 font-neueBold"
                  numberOfLines={1}
                >
                  {post.caption || "Untitled"}
                </ScaledText>
                <View
                  className=" flex items-center justify-center"
                  style={{
                    width: s(24),
                    height: s(24),
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: s(50),
                  }}
                >
                  <SVGIcons.ChevronRight width={s(12)} height={s(12)} />
                </View>
              </View>
              <TouchableOpacity
                onPress={handleAuthorPress}
                className="flex-row items-center"
                style={{ marginTop: mvs(12), width: "100%" }}
              >
                <Image
                  source={{
                    uri: post.author.avatar || "https://via.placeholder.com/40",
                  }}
                  className="rounded-full"
                  style={{
                    width: s(19),
                    height: s(19),
                    marginRight: s(4),
                  }}
                />
                <ScaledText
                  variant="md"
                  className="text-foreground font-montserratMedium"
                >
                  {post.author.firstName} {post.author.lastName || ""}
                </ScaledText>
              </TouchableOpacity>
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
    </View>
  );
}

export const FeedPostCard = memo(FeedPostCardComponent);
