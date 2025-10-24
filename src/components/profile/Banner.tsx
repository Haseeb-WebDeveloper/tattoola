import { mvs } from '@/utils/scale';
import { ResizeMode, Video } from 'expo-av';
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

  const videoMedia = banner.find((b) => b.mediaType === 'VIDEO');
  const bannerImages = banner.filter((b) => b.mediaType === 'IMAGE');

  // Video banner - autoplay, looping, no controls
  if (videoMedia) {
    return (
      <Video
        source={{ uri: videoMedia.mediaUrl }}
        className="w-full"
        style={{ height: mvs(200) }}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
    );
  }

  // Single image banner
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

  // Multiple images banner (4 images in a row)
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
