import { SVGIcons } from '@/constants/svg';
import { createInstagramUrl, createTiktokUrl, createWebsiteUrl } from '@/utils/socialMedia';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

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
    <View className="px-4 mt-4 flex-row items-center gap-3">
      {!!instagram && (
        <TouchableOpacity
          onPress={handleInstagramPress}
          className="w-12 h-12 aspect-square rounded-full bg-[#AE0E0E80] items-center justify-center"
          style={{
            backgroundColor: "#AE0E0E80",
          }}
        >
          <SVGIcons.Instagram className="w-6 h-6" />
        </TouchableOpacity>
      )}
      {!!tiktok && (
        <TouchableOpacity
          onPress={handleTiktokPress}
          className="w-12 h-12 aspect-square rounded-full bg-[#25F4EE80] items-center justify-center"
          style={{
            backgroundColor: "#25F4EE80",
          }}
        >
          <SVGIcons.Tiktok className="w-6 h-6" />
        </TouchableOpacity>
      )}
      {!!website && (
        <TouchableOpacity
          onPress={handleWebsitePress}
          className="w-12 h-12 aspect-square rounded-full bg-[#70707080] items-center justify-center"
          style={{
            backgroundColor: "#70707080",
          }}
        >
          <SVGIcons.Website className="w-6 h-6" />
        </TouchableOpacity>
      )}
    </View>
  );
};
