import React from 'react';
import { Image, View } from 'react-native';
import { mvs } from '@/utils/scale';

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
    return <View style={{ height: mvs(200) }} className="bg-gray/20" />;
  }

  if (bannerImages.length === 1) {
    return (
      <Image
        source={{ uri: bannerImages[0].mediaUrl }}
        className="w-full"
        style={{ height: mvs(200) }}
        resizeMode="cover"
      />
    );
  }

  if (bannerImages.length > 1) {
    return (
      <View className="w-full flex-row" style={{ height: mvs(200) }}>
        {bannerImages.map((img, idx) => (
          <Image
            key={idx}
            source={{ uri: img.mediaUrl }}
            className="flex-1"
            style={{ height: mvs(200) }}
            resizeMode="cover"
          />
        ))}
      </View>
    );
  }

  // No banner media
  return <View style={{ height: mvs(200) }} className="bg-gray/20" />;
};
