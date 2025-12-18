import { ScaledText } from "@/components/ui/ScaledText";
import { CollectionBannerFeedItem } from "@/services/feed.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type Props = {
  collection: CollectionBannerFeedItem;
  onPress?: () => void;
};

export function CollectionBannerCard({ collection, onPress }: Props) {
  const imageUrl = collection.thumbnailUrl;
  if (!imageUrl) {
    return null;
  }

  const overlayText = collection.name || collection.description || "";

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

        {/* Centered title box over the image */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <View
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              paddingVertical: mvs(30),
              paddingHorizontal: s(16),
              justifyContent: "center",
              alignItems: "center",
              minHeight: mvs(48),
              maxWidth: "80%",
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="2xl"
              className="text-white font-neueMedium"
              style={{
                textAlign: "center",
              }}
              numberOfLines={3}
            >
              {overlayText}
            </ScaledText>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}


