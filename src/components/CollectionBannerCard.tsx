import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { CollectionBannerFeedItem } from "@/services/feed.service";
import { useTabBarStore } from "@/stores/tabBarStore";
import { mvs, s } from "@/utils/scale";
import React, { memo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  collection: CollectionBannerFeedItem;
  onPress?: () => void;
};

export function CollectionBannerCard({ collection, onPress }: Props) {
  const imageUrl = collection.thumbnailUrl;
  if (!imageUrl) {
    return null;
  }

  return (
    <View className="w-full h-full relative">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      >
        {/* Fullscreen thumbnail like a normal post */}
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
}

// Screen-level overlay (same layer as FeedPostOverlay)
type OverlayProps = {
  collection: CollectionBannerFeedItem;
  onPress?: () => void;
};

function CollectionBannerOverlayComponent({
  collection,
  onPress,
}: OverlayProps) {
  const tabBarHeight = useTabBarStore((state) => state.tabBarHeight);
  const bottomPosition = tabBarHeight > 0 ? tabBarHeight : mvs(119);
  const text = collection.name || collection.description || "";

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  if (!text) return null;

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
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        className="flex-row items-center justify-start"
        style={{ gap: s(12) }}
      >
        <ScaledText
          variant="18"
          className="leading-7 text-foreground font-neueBold"
          numberOfLines={1}
        >
          {text}
        </ScaledText>
        <View
          className="flex items-center justify-center"
          style={{
            width: s(24),
            height: s(24),
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: s(50),
          }}
        >
          <SVGIcons.ChevronRight width={s(12)} height={s(12)} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export const CollectionBannerOverlay = memo(CollectionBannerOverlayComponent);
