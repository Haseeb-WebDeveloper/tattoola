import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { FeedPost } from "@/services/post.service";
import { useTabBarStore } from "@/stores/tabBarStore";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { memo, useEffect } from "react";
import { Image, TouchableOpacity, View } from "react-native";

type Props = {
  post: FeedPost;
  onPress?: () => void;
  onLikePress?: () => void;
  onAuthorPress?: () => void;
  hideOverlay?: boolean;
};

type OverlayProps = {
  post: FeedPost;
  onLikePress?: () => void;
  onAuthorPress?: () => void;
};

// Separate overlay component rendered at screen level (above gradients)
function FeedPostOverlayComponent({
  post,
  onLikePress,
  onAuthorPress,
}: OverlayProps) {
  const tabBarHeight = useTabBarStore((state) => state.tabBarHeight);
  const bottomPosition = tabBarHeight > 0 ? tabBarHeight : mvs(119);

  const handleAuthorPress = () => {
    if (onAuthorPress) {
      onAuthorPress();
    } else {
      router.push(`/user/${post.author.id}` as any);
    }
  };

  const handlePostPress = () => {
    router.push(`/post/${post.id}` as any);
  };

  return (
    <View
      className="absolute left-0 right-0"
      style={{
        bottom: bottomPosition,
        paddingHorizontal: s(20),
        zIndex: 10,
        elevation: 10,
      }}
      pointerEvents="box-none"
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
            {!!post.caption && (
              <ScaledText
                variant="18"
                className="leading-7 text-foreground font-neueBold"
                numberOfLines={1}
              >
                {post.caption}
              </ScaledText>
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePostPress}
              className="flex items-center justify-center"
              style={{
                width: s(24),
                height: s(24),
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: s(50),
              }}
            >
              <SVGIcons.ChevronRight width={s(12)} height={s(12)} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleAuthorPress}
            className="flex-row items-center"
            style={{ marginTop: mvs(12), width: "100%" }}
          >
            <Image
              source={{
                uri:
                  post.author.avatar ||
                  `https://api.dicebear.com/7.x/initials/png?seed=${post.author.firstName?.[0] || post.author.username?.[0] || "u"}`,
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
          activeOpacity={1}
          onPress={onLikePress}
          className="items-center justify-center rounded-full"
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
  );
}

export const FeedPostOverlay = memo(FeedPostOverlayComponent);

// Card component - only shows image, bottom content rendered at screen level
function FeedPostCardComponent({
  post,
  onPress,
  onLikePress,
  onAuthorPress,
  hideOverlay,
}: Props) {
  const cover = post.media[0]?.mediaUrl;
  const tabBarHeight = useTabBarStore((state) => state.tabBarHeight);
  const bottomPosition = tabBarHeight > 0 ? tabBarHeight : mvs(119);

  // Prefetch all post images for instant loading when navigating to detail
  useEffect(() => {
    post.media.forEach((m) => {
      if (m.mediaUrl) {
        Image.prefetch(m.mediaUrl).catch(() => {
          // Silently ignore prefetch errors
        });
      }
    });
    // Also prefetch author avatar
    if (post.author.avatar) {
      Image.prefetch(post.author.avatar).catch(() => {});
    }
  }, [post.id]);

  const handleAuthorPress = () => {
    if (onAuthorPress) {
      onAuthorPress();
    } else {
      router.push(`/user/${post.author.id}` as any);
    }
  };

  return (
    <View className="w-full h-[100svh] ">
      <View className="relative w-full h-full overflow-hidden">
        {/* Background media press area (post open) */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        >
          {!!cover && (
            <Image
              source={{ uri: cover }}
              className="absolute top-0 bottom-0 left-0 right-0"
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>

        {/* Bottom content - only shown when not using screen-level overlay */}
        {!hideOverlay && (
          <View
            className="absolute left-0 right-0"
            style={{
              bottom: bottomPosition + mvs(40),
              paddingHorizontal: s(20),
              zIndex: 10,
              elevation: 10,
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
                  {post.caption && (
                    <ScaledText
                      variant="18"
                      className="leading-7 text-foreground font-neueBold"
                      numberOfLines={1}
                    >
                      {post.caption}
                    </ScaledText>
                  )}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onPress}
                    className="flex items-center justify-center"
                    style={{
                      width: s(24),
                      height: s(24),
                      backgroundColor: "rgba(0,0,0,0.3)",
                      borderRadius: s(50),
                    }}
                  >
                    <SVGIcons.ChevronRight width={s(12)} height={s(12)} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleAuthorPress}
                  className="flex-row items-center"
                  style={{ marginTop: mvs(12), width: "100%" }}
                >
                  <Image
                    source={{
                      uri:
                        post.author.avatar ||
                        `https://api.dicebear.com/7.x/initials/png?seed=${post.author.firstName?.[0] || post.author.username?.[0] || "u"}`,
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
                activeOpacity={1}
                onPress={onLikePress}
                className="items-center justify-center rounded-full"
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
        )}
      </View>
    </View>
  );
}

export const FeedPostCard = memo(FeedPostCardComponent);
