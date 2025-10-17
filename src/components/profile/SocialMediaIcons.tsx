import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import {
    createInstagramUrl,
    createTiktokUrl,
    createWebsiteUrl,
} from "@/utils/socialMedia";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface SocialMediaIconsProps {
  instagram?: string;
  tiktok?: string;
  website?: string;
  onInstagramPress?: (url: string) => void;
  onTiktokPress?: (url: string) => void;
  onWebsitePress?: (url: string) => void;
}

export const SocialMediaIcons: React.FC<SocialMediaIconsProps> = ({
  instagram,
  tiktok,
  website,
  onInstagramPress,
  onTiktokPress,
  onWebsitePress,
}) => {
  const handleInstagramPress = () => {
    if (instagram && onInstagramPress) {
      onInstagramPress(createInstagramUrl(instagram));
    }
  };

  const handleTiktokPress = () => {
    if (tiktok && onTiktokPress) {
      onTiktokPress(createTiktokUrl(tiktok));
    }
  };

  const handleWebsitePress = () => {
    if (website && onWebsitePress) {
      onWebsitePress(createWebsiteUrl(website));
    }
  };

  return (
    <View
      className="flex-row items-center"
      style={{
        paddingHorizontal: s(16),
        marginTop: mvs(16),
        gap: s(12),
      }}
    >
      {!!instagram && (
        <TouchableOpacity
          onPress={handleInstagramPress}
          className="rounded-full items-center justify-center"
          style={{
            width: s(48),
            height: s(48),
            backgroundColor: "#AE0E0E80",
          }}
        >
          <SVGIcons.Instagram style={{ width: s(24), height: s(24) }} />
        </TouchableOpacity>
      )}
      {!!tiktok && (
        <TouchableOpacity
          onPress={handleTiktokPress}
          className="rounded-full items-center justify-center"
          style={{
            width: s(48),
            height: s(48),
            backgroundColor: "#25F4EE80",
          }}
        >
          <SVGIcons.Tiktok style={{ width: s(24), height: s(24) }} />
        </TouchableOpacity>
      )}
      {!!website && (
        <TouchableOpacity
          onPress={handleWebsitePress}
          className="rounded-full items-center justify-center"
          style={{
            width: s(48),
            height: s(48),
            backgroundColor: "#70707080",
          }}
        >
          <SVGIcons.Website style={{ width: s(24), height: s(24) }} />
        </TouchableOpacity>
      )}
    </View>
  );
};
