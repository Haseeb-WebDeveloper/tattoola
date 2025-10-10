import React from 'react';
import { Image, View } from 'react-native';

interface BannerMedia {
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  order: number;
}

interface BannerProps {
  banner: BannerMedia[];
}

export const Banner: React.FC<BannerProps> = ({ banner }) => {

  const hasVideo = banner.some((b) => b.mediaType === 'VIDEO');
  const bannerImages = banner.filter((b) => b.mediaType === 'IMAGE');

  if (hasVideo) {
    // TODO: Implement video player when needed
    return <View className="h-48 bg-gray/20" />;
  }

  if (bannerImages.length === 1) {
    return (
      <Image
        source={{ uri: bannerImages[0].mediaUrl }}
        className="w-full h-48"
        resizeMode="cover"
      />
    );
  }

  if (bannerImages.length > 1) {
    return (
      <View className="w-full h-48 flex-row">
        {bannerImages.map((img, idx) => (
          <Image
            key={idx}
            source={{ uri: img.mediaUrl }}
            className="flex-1 h-full"
            resizeMode="cover"
          />
        ))}
      </View>
    );
  }

  // No banner media
  return <View className="h-48 bg-gray/20" />;
};
