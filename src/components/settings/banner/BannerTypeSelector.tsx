import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { BannerMedia, BannerType } from "@/types/banner";
import { mvs, s } from "@/utils/scale";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

interface BannerTypeSelectorProps {
  onSelect: (type: BannerType) => void;
  selectedType: BannerType;
  bannerMedia: BannerMedia[];
  isEditMode: boolean;
}

export function BannerTypeSelector({
  onSelect,
  selectedType,
  bannerMedia,
  isEditMode,
}: BannerTypeSelectorProps) {

  return (
    <View style={{ marginBottom: mvs(32), paddingHorizontal: s(16) }}>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-light"
        style={{ marginBottom: mvs(16) }}
      >
        In this section you can choose the cover of your page.
      </ScaledText>

      {/* Option 1: 4 Images */}
      <TouchableOpacity
        onPress={() => onSelect("4_IMAGES")}
        className="bg-[#100C0C]  border"
        style={{
          padding: s(16),
          marginBottom: mvs(12),
          borderRadius: s(12),
          borderColor: selectedType === "4_IMAGES" ? "#A49A99" : "#A49A99",
          borderWidth: selectedType === "4_IMAGES" ? s(2) : s(1),
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {selectedType === "4_IMAGES" ? (
              <SVGIcons.CircleCheckedCheckbox
                width={s(20)}
                height={s(20)}
                style={{ marginRight: s(12) }}
              />
            ) : (
              <SVGIcons.CircleUncheckedCheckbox
                width={s(20)}
                height={s(20)}
                style={{ marginRight: s(12) }}
              />
            )}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-semibold"
            >
              Voglio mostrare i miei tatuaggi preferiti
            </ScaledText>
          </View>
        </View>

        {/* Show preview thumbnails if selected */}
        {selectedType === "4_IMAGES" && (
          <View
            style={{
              marginTop: mvs(12),
              flexDirection: "row",
              flexWrap: "nowrap",
              gap: s(8),
            }}
          >
            {[0, 1, 2, 3].map((idx) => {
              const media = bannerMedia[idx];
              return media ? (
                <Image
                  key={idx}
                  source={{ uri: media.mediaUrl }}
                  style={{
                    width: `${100 / 4 - 2}%`,
                    height: mvs(80),
                    borderRadius: s(8),
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  key={idx}
                  style={{
                    width: `${100 / 4}%`,
                    height: s(80),
                    backgroundColor: 'rgba(156,163,175,0.3)',
                    borderRadius: s(8),
                  }}
                />
              );
            })}
          </View>
        )}
      </TouchableOpacity>

      {/* Option 2: 1 Image */}
      <TouchableOpacity
        onPress={() => onSelect("1_IMAGE")}
        className="bg-[#100C0C]  border"
        style={{
          padding: s(16),
          marginBottom: mvs(12),
          borderRadius: s(12),
          borderColor: selectedType === "1_IMAGE" ? "#A49A99" : "#A49A99",
          borderWidth: selectedType === "1_IMAGE" ? s(2) : s(1),
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {selectedType === "1_IMAGE" ? (
              <SVGIcons.CircleCheckedCheckbox
                width={s(20)}
                height={s(20)}
                style={{ marginRight: s(12) }}
              />
            ) : (
              <SVGIcons.CircleUncheckedCheckbox
                width={s(20)}
                height={s(20)}
                style={{ marginRight: s(12) }}
              />
            )}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-semibold"
            >
              Voglio mostrare una foto a mia scelta
            </ScaledText>
          </View>
        </View>

        {/* Show preview if selected */}
        {selectedType === "1_IMAGE" && (
          <View style={{ marginTop: mvs(12) }}>
            {bannerMedia.length > 0 && bannerMedia[0] ? (
              <Image
                source={{ uri: bannerMedia[0].mediaUrl }}
                style={{
                  width: "100%",
                  height: mvs(100),
                  borderRadius: s(8),
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="bg-gray/30"
                style={{
                  width: "100%",
                  height: mvs(100),
                  borderRadius: s(8),
                }}
              />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Option 3: 1 Video */}
      <TouchableOpacity
        onPress={() => onSelect("1_VIDEO")}
        className="bg-[#100C0C]  border"
        style={{
          padding: s(16),
          marginBottom: mvs(12),
          borderRadius: s(12),
          borderColor: selectedType === "1_VIDEO" ? "#A49A99" : "#A49A99",
          borderWidth: selectedType === "1_VIDEO" ? s(2) : s(1),
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {selectedType === "1_VIDEO" ? (
              <SVGIcons.CircleCheckedCheckbox
                width={s(20)}
                height={s(20)}
                style={{ marginRight: s(12) }}
              />
            ) : (
              <SVGIcons.CircleUncheckedCheckbox
                width={s(20)}
                height={s(20)}
                style={{ marginRight: s(12) }}
              />
            )}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-semibold"
            >
              Voglio mostrare un video a mia scelta
            </ScaledText>
          </View>
        </View>

        {/* Show preview if selected */}
        {selectedType === "1_VIDEO" && (
          <View style={{ marginTop: mvs(12) }}>
            {bannerMedia.length > 0 && bannerMedia[0] ? (
              <Video
                source={{ uri: bannerMedia[0].mediaUrl }}
                style={{
                  width: "100%",
                  height: mvs(100),
                  borderRadius: s(8),
                }}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <View
                className="bg-gray/30"
                style={{
                  width: "100%",
                  height: mvs(100),
                  borderRadius: s(8),
                }}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

