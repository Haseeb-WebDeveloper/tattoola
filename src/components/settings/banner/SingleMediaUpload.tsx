import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { BannerMedia } from "@/types/banner";
import { mvs, s } from "@/utils/scale";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";

interface SingleMediaUploadProps {
  bannerMedia: BannerMedia[];
  onPickMedia: (index: number, mediaType: "image" | "video") => void;
  onRemoveMedia: (index: number) => void;
  uploading: boolean;
  mediaType: "image" | "video";
  title: string;
  uploadLabel: string;
}

export function SingleMediaUpload({
  bannerMedia,
  onPickMedia,
  onRemoveMedia,
  uploading,
  mediaType,
  title,
  uploadLabel,
}: SingleMediaUploadProps) {
  const media = bannerMedia[0];

  return (
    <View>
      <ScaledText
        allowScaling={false}
        variant="sm"
        className="text-white font-montserratMedium text-center"
        style={{ marginBottom: mvs(10), paddingHorizontal: s(16) }}
      >
        {title}
      </ScaledText>
      <ScaledText
        allowScaling={false}
        variant="11"
        className="text-foreground font-light text-center"
        style={{ marginBottom: mvs(14), paddingHorizontal: s(16) }}
      >
        This is how your banner will look
      </ScaledText>

      {/* Preview Banner */}
      {media && (
        <View style={{ marginBottom: mvs(24) }}>
          {mediaType === "video" ? (
            <Video
              source={{ uri: media.mediaUrl }}
              style={{
                width: "100%",
                height: mvs(180),
              }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={{ uri: media.mediaUrl }}
              style={{
                width: "100%",
                height: mvs(180),
              }}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* Upload Section */}
      <ScaledText
        allowScaling={false}
        variant="sm"
        className="text-white font-montserratMedium"
        style={{ marginBottom: mvs(12), paddingHorizontal: s(16) }}
      >
        {uploadLabel}
      </ScaledText>

      {media ? (
        <View className="relative" style={{ paddingHorizontal: s(16) }}>
          {mediaType === "video" ? (
            <Video
              source={{ uri: media.mediaUrl }}
              style={{
                width: "100%",
                height: mvs(100),
                borderRadius: s(8),
                opacity: 0.6,
              }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={{ uri: media.mediaUrl }}
              style={{
                width: "100%",
                height: mvs(100),
                borderRadius: s(8),
                opacity: 0.6,
              }}
              resizeMode="cover"
            />
          )}
          <TouchableOpacity
            onPress={() => onPickMedia(0, mediaType)}
            disabled={uploading}
            className="absolute bg-foreground rounded-full items-center justify-center z-10"
            style={{
              width: s(20),
              height: s(20),
              zIndex: 10,
              top: "8%",
              right: "8%",
              // transform: [{ translateX: -s(16) }, { translateY: -s(16) }],
            }}
          >
            <SVGIcons.PenRed width={s(12)} height={s(12)} />
          </TouchableOpacity>
        </View>
      ) : (
        <View
        style={{
          paddingHorizontal: s(16),
        }}
        >
          <TouchableOpacity
            onPress={() => onPickMedia(0, mediaType)}
            disabled={uploading}
            className="bg-[#100C0C]  border-dashed border-primary rounded-xl items-center justify-center"
            style={{
              height: mvs(100),
              borderWidth: s(1),
            }}
          >
            {uploading ? (
              <ActivityIndicator color="#AD2E2E" />
            ) : (
              <SVGIcons.AddRed width={s(24)} height={s(32)} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
