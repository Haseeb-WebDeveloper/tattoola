import { ScaledText } from "@/components/ui/ScaledText";
import { BannerFeedItem } from "@/services/feed.service";
import { mvs, s } from "@/utils/scale";
import React, { useMemo } from "react";
import { Image, TouchableOpacity, View, StyleSheet, useWindowDimensions } from "react-native";
import { ColorMatrix } from "react-native-color-matrix-image-filters";

type Props = {
  banner: BannerFeedItem;
  onPress?: () => void;
};

/**
 * Get grayscale version of image URL if it's from Cloudinary
 */
function getGrayscaleImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If it's a Cloudinary URL, add grayscale transformation
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    const uploadIndex = url.indexOf('/image/upload/');
    const baseUrl = url.substring(0, uploadIndex + '/image/upload/'.length);
    const restOfUrl = url.substring(uploadIndex + '/image/upload/'.length);
    
    // Insert e_grayscale transformation
    return `${baseUrl}e_grayscale/${restOfUrl}`;
  }
  
  return url;
}

export function BannerCard({ banner, onPress }: Props) {
  const imageUrl = banner.thumbnailUrl;
  const isSmall = banner.size === "SMALL";
  const isLarge = banner.size === "LARGE";
  const { width: screenWidth } = useWindowDimensions();

  // Get grayscale version for background
  const grayscaleUrl = useMemo(() => getGrayscaleImageUrl(imageUrl), [imageUrl]);

  // Grayscale color matrix as fallback (if not Cloudinary URL)
  const grayscaleMatrix = [
    0.299, 0.587, 0.114, 0, 0, // Red channel
    0.299, 0.587, 0.114, 0, 0, // Green channel
    0.299, 0.587, 0.114, 0, 0, // Blue channel
    0, 0, 0, 1, 0, // Alpha channel
  ];

  const isCloudinaryUrl = imageUrl?.includes('cloudinary.com') ?? false;

  if (!imageUrl) {
    return null;
  }

  // Figma dimensions converted to scaled values
  // Small banner: card width 371.538px, height 294px (on 393px screen = ~94.5% width)
  // Large banner: card width 363.268px, height 468px, left 15px, top 192px
  const smallCardWidth = screenWidth * 0.945; // ~371.538px on 393px screen
  const smallCardHeight = s(294);
  const largeCardWidth = screenWidth * 0.925; // ~363.268px on 393px screen
  const largeCardHeight = s(468);
  const largeCardLeft = s(15);
  const largeCardTop = mvs(192);

  // Small banner: left image 205.154px, right red 198.692px
  const smallImageWidth = smallCardWidth * (205.154 / 371.538);
  const smallRedWidth = smallCardWidth * (198.692 / 371.538);
  const smallImageHeight = smallCardHeight * (290.769 / 294);

  return (
    <View className="w-full h-full relative">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      >
        {/* Grayscale background image - full screen */}
        {isCloudinaryUrl && grayscaleUrl ? (
          <Image
            source={{ uri: grayscaleUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <ColorMatrix matrix={grayscaleMatrix}>
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </ColorMatrix>
        )}

        {isSmall ? (
          /* SMALL BANNER: Split card design - image left, red right */
          <View
            style={{
              position: "absolute",
              left: (screenWidth - smallCardWidth) / 2,
              top: "50%",
              marginTop: -smallCardHeight / 2,
              width: smallCardWidth,
              height: smallCardHeight,
              borderWidth: s(1.615),
              borderColor: "#A49A99",
              borderRadius: s(8.077),
              overflow: "hidden",
              flexDirection: "row",
            }}
          >
            {/* Left side: Colored image */}
            <View
              style={{
                width: smallImageWidth,
                height: smallImageHeight,
                borderRadius: s(6.462),
                overflow: "hidden",
                marginTop: s(1.62),
                marginLeft: s(1.62),
              }}
            >
              <Image
                source={{ uri: imageUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            </View>

            {/* Right side: Red background with text */}
            <View
              style={{
                width: smallRedWidth,
                height: smallImageHeight,
                backgroundColor: "#AE0E0E",
                marginTop: s(1.62),
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: s(10),
              }}
            >
              <ScaledText
                variant="3xl"
                className="text-white font-neueBold"
                style={{
                  fontSize: s(29.077),
                  lineHeight: s(37.154),
                  textAlign: "center",
                  letterSpacing: -0.5,
                }}
              >
                {banner.title}
              </ScaledText>
            </View>
          </View>
        ) : (
          /* LARGE BANNER: Full image card with dark overlay and text box */
          <View
            style={{
              position: "absolute",
              left: largeCardLeft,
              top: largeCardTop,
              width: largeCardWidth,
              height: largeCardHeight,
              borderWidth: s(0.804),
              borderColor: "#A49A99",
              borderRadius: s(9.644),
              overflow: "hidden",
            }}
          >
            {/* Colored image with dark overlay */}
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={{ uri: imageUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                }}
              />
            </View>

            {/* Dark semi-transparent box at bottom for text */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                paddingVertical: mvs(20),
                paddingHorizontal: s(20),
                justifyContent: "center",
                alignItems: "center",
                minHeight: s(138.201),
              }}
            >
              <ScaledText
                variant="4xl"
                className="text-white font-neueMedium"
                style={{
                  fontSize: s(32.148),
                  lineHeight: s(57.866),
                  textAlign: "center",
                  letterSpacing: s(-0.8037),
                }}
              >
                {banner.title}
              </ScaledText>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

