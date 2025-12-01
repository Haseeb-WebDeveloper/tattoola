import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { StudioSearchResult } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { StylePills } from "../ui/stylePills";

type StudioCardProps = {
  studio: StudioSearchResult;
};

export default function StudioCard({ studio }: StudioCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/studio/${studio.id}`);
  };

  const videoMedia = studio.bannerMedia.find(
    (b) => b.mediaType === "VIDEO"
  );
  // Always call hook at top level
  const videoPlayer = useVideoPlayer(videoMedia?.mediaUrl || '', (player) => {
    if (videoMedia) {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      className="bg-background  border-gray/50  overflow-hidden"
      style={{
        marginHorizontal: s(16),
        marginBottom: mvs(16),
        borderRadius: s(35),
        borderWidth: s(0.5),
      }}
    >
      {/* Top Section - Logo, Name, Locations */}
      <View style={{ padding: s(16), paddingBottom: mvs(8) }}>
        {/* Subscription Badge */}
        {studio.subscription && (
          <View
            className="absolute right-0 top-0 bg-gray flex-row items-center justify-center"
            style={{
              paddingLeft: s(8),
              paddingRight: s(25),
              paddingVertical: mvs(5),
              gap: s(4),
              borderBottomLeftRadius: s(9),
            }}
          >
            <SVGIcons.DimondRed width={s(12)} height={s(12)} />
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-primary font-neueMedium"
            >
              Studio profile
            </ScaledText>
          </View>
        )}

        {/* Logo and Name Row */}
        <View
          className="flex-row items-center"
          style={{ marginBottom: mvs(8) }}
        >
          <View
            className="rounded-full border border-black overflow-hidden"
            style={{ width: s(61), height: s(61), marginRight: s(12) }}
          >
            {studio.logo ? (
              <Image
                source={{ uri: studio.logo }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gray/30" />
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueBold"
              >
                {studio.name}
              </ScaledText>
              {/* <SVGIcons.VarifiedGreen width={s(16)} height={s(16)} /> */}
            </View>
          </View>
        </View>

        {/* Description */}
        {/* {studio.description && (
          <View className="flex-row items-center" style={{ marginVertical: mvs(2) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratMedium ml-1"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {studio.description}
            </ScaledText>
          </View>
        )} */}
        {studio.ownerName ? (
          <View
            className="flex-row items-center"
            style={{ marginBottom: mvs(2) }}
          >
            <SVGIcons.Studio
              width={s(14)}
              height={s(14)}
              style={{ marginRight: s(4) }}
            />
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueLight"
              numberOfLines={1}
            >
              Owned by
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueBold ml-1"
              numberOfLines={1}
            >
              {studio.ownerName}
            </ScaledText>
          </View>
        ) : null}

        {/* Locations */}
        {studio.locations.length > 0 && (
          <View style={{ marginBottom: mvs(4) }}>
            {studio.locations.map((location, index) => (
              <View
                key={index}
                className="flex-row items-center"
                style={{
                  marginBottom:
                    index < studio.locations.length - 1 ? mvs(2) : 0,
                }}
              >
                <SVGIcons.Location width={s(14)} height={s(14)} />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-white font-neueLight ml-1"
                  numberOfLines={1}
                >
                  {location?.province}, {location?.municipality}
                </ScaledText>
              </View>
            ))}
          </View>
        )}

        {/* Styles Pills */}
        {studio.styles.length > 0 && <StylePills styles={studio.styles} />}
      </View>

      {/* Banner - Video or Images */}
      {(() => {
        const imageMedia = studio.bannerMedia.filter(
          (b) => b.mediaType === "IMAGE"
        );

        // Video banner - autoplay, looping, no controls
        if (videoMedia && videoPlayer) {
          return (
            <VideoView
              player={videoPlayer}
              style={{ width: "100%", height: mvs(180) }}
              contentFit="cover"
              nativeControls={false}
            />
          );
        }

        // Single image banner
        if (imageMedia.length === 1) {
          return (
            <Image
              source={{ uri: imageMedia[0].mediaUrl }}
              style={{ width: "100%", height: mvs(180) }}
              resizeMode="cover"
            />
          );
        }

        // Multiple images banner (all in a row)
        if (imageMedia.length > 1) {
          return (
            <View className="flex-row" style={{ height: mvs(180) }}>
              {imageMedia.slice(0, 2).map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img.mediaUrl }}
                  className="flex-1"
                  style={{ height: mvs(180) }}
                  resizeMode="cover"
                />
              ))}
            </View>
          );
        }

        // No banner media
        return null;
      })()}
    </TouchableOpacity>
  );
}
