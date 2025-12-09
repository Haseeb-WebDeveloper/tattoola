import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { BannerMedia } from "@/types/banner";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { ActivityIndicator, Image, TouchableOpacity, View, useWindowDimensions } from "react-native";

interface FourImagesUploadProps {
  bannerMedia: BannerMedia[];
  onPickMedia: (index: number, mediaType: "image" | "video") => void;
  onRemoveMedia: (index: number) => void;
  uploading: boolean;
}

export function FourImagesUpload({
  bannerMedia,
  onPickMedia,
  onRemoveMedia,
  uploading,
}: FourImagesUploadProps) {
  const { width: windowWidth } = useWindowDimensions();
  // Track last selected image index for upload
  const [lastPickedIndex, setLastPickedIndex] = useState<number | null>(null);

  // Calculate image width so that 4 fit into a single row (including gap)
  // Padding left/right: 16 each, Gap between 4 images: 8*3 = 24
  const containerPadding = s(16) * 2;
  const totalGap = s(8) * 3;
  const imageWidth = (windowWidth - containerPadding - totalGap) / 4;

  // Wrap onPickMedia to set last picked index
  const handlePickMedia = (idx: number, mediaType: "image" | "video") => {
    setLastPickedIndex(idx);
    onPickMedia(idx, mediaType);
  };

  // If uploading, determine which images are loading:
  // If an upload was triggered for an empty slot or an existing image slot,
  // show loading on all not-yet-uploaded slots at and after the picked index
  const isImageLoading = (index: number) => {
    // Only if uploading is true and lastPickedIndex is set
    if (!uploading || lastPickedIndex === null) return false;
    // Loading appear for the clicked slot and all afterwards to the first empty slot (inclusive)
    // Idea: show loading on empty slots with index >= lastPickedIndex
    if (index < lastPickedIndex) return false;
    if (bannerMedia[index]) {
      // existing images: loading only on slot being uploaded
      return index === lastPickedIndex;
    }
    // for empty slots after lastPickedIndex and uploading, show loading
    return index >= lastPickedIndex;
  };

  return (
    <View>
      <ScaledText
        allowScaling={false}
        variant="sm"
        className="text-white font-montserratMedium text-center"
        style={{ marginBottom: mvs(10), paddingHorizontal: s(16) }}
      >
        Voglio mostrare i miei tatuaggi preferiti
      </ScaledText>
      <ScaledText
        allowScaling={false}
        variant="11"
        className="text-foreground font-neueLight text-center"
        style={{ marginBottom: mvs(14), paddingHorizontal: s(16) }}
      >
        Questo è come apparirà il tuo banner
      </ScaledText>

      {/* Always show Preview Banner, show gray bg if not 4 images */}
      <View
        className="flex-row"
        style={{
          height: mvs(200),
          marginBottom: mvs(24),
          gap: s(2),
          backgroundColor: bannerMedia.length < 4 ? "rgba(156,163,175,0.3)" : undefined,
          overflow: "hidden",
        }}
      >
        {[0, 1, 2, 3].map((index) => {
          const media = bannerMedia[index];
          return media ? (
            <Image
              key={index}
              source={{ uri: media.mediaUrl }}
              style={{
                flex: 1,
                height: "100%",
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              key={index}
              style={{
                flex: 1,
                height: "100%",
                backgroundColor: "transparent",
              }}
            />
          );
        })}
      </View>

      {/* Selected Images Section */}
      <ScaledText
        allowScaling={false}
        variant="11"
        className="text-foreground font-neueLight"
        style={{ marginBottom: mvs(12), paddingHorizontal: s(16) }}
      >
        Immagini selezionate:
      </ScaledText>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "nowrap",
          gap: s(8),
          paddingHorizontal: s(16),
        }}
      >
        {[0, 1, 2, 3].map((index) => {
          const media = bannerMedia[index];
          const loadingHere = isImageLoading(index);
          return (
            <View
              key={index}
              style={{
                width: imageWidth,
              }}
            >
              {media ? (
                <View className="relative">
                  <Image
                    source={{ uri: media.mediaUrl }}
                    style={{
                      width: "100%",
                      height: mvs(120),
                      borderRadius: s(10),
                      opacity: loadingHere ? 0.5 : 1,
                    }}
                    resizeMode="cover"
                  />
                  {/* Loading overlay if uploading this image */}
                  {loadingHere && (
                    <View
                      className="absolute items-center justify-center"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.5)",
                        width: "100%",
                        height: mvs(120),
                        borderRadius: s(10),
                        top: 0,
                        left: 0,
                      }}
                    >
                      <ActivityIndicator color="#AD2E2E" size="small" />
                    </View>
                  )}
                  {/* Drag Icon */}
                  {/* <View
                    className="absolute"
                    style={{
                      top: s(8),
                      left: s(8),
                    }}
                  >
                    <SVGIcons.Drag width={s(16)} height={s(16)} />
                  </View> */}
                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => onRemoveMedia(index)}
                    disabled={uploading}
                    className="absolute bg-white/90 rounded-full items-center justify-center"
                    style={{
                      width: s(24),
                      height: s(24),
                      top: s(8),
                      right: s(8),
                    }}
                  >
                    <SVGIcons.Delete width={s(12)} height={s(12)} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handlePickMedia(index, "image")}
                  disabled={uploading}
                  className="bg-[#100C0C] border-dashed border-error  items-center justify-center"
                  style={{
                    height: mvs(120),
                    borderRadius: s(10),
                    borderWidth: s(1),
                  }}
                >
                  {loadingHere ? (
                    <ActivityIndicator color="#AD2E2E" size="small" />
                  ) : (
                    <SVGIcons.AddRed width={s(20)} height={s(20)} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
