import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { ArtistSearchResult } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { StylePills } from "../ui/stylePills";

type ArtistCardProps = {
  artist: ArtistSearchResult;
};

export default function ArtistCard({ artist }: ArtistCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/user/${artist.userId}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      className="bg-background border border-gray/50  overflow-hidden"
      style={{
        marginHorizontal: s(16),
        marginBottom: mvs(16),
        borderRadius: s(20),
      }}
    >
      {/* Top Section - Avatar, Name, Experience, Location */}
      <View style={{ padding: s(16), paddingBottom: mvs(8) }}>
        {/* Subscription Badge */}
        {artist.isStudioOwner && (
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
              className="text-primary font-medium"
            >
              Artist profile
            </ScaledText>
          </View>
        )}

        {/* Avatar and Name Row */}
        <View
          className="flex-row items-center"
          style={{ marginBottom: mvs(8) }}
        >
          <View
            className="rounded-full border border-black overflow-hidden"
            style={{ width: s(61), height: s(61), marginRight: s(12) }}
          >
            {artist.user.avatar ? (
              <Image
                source={{ uri: artist.user.avatar }}
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
                className="text-foreground font-neueBold leading-none "
              >
                {artist.user.username}
              </ScaledText>
              {artist.isVerified && (
                <SVGIcons.VarifiedGreen width={s(16)} height={s(16)} />
              )}
            </View>
          </View>
        </View>

        {/* Years of Experience */}
        {artist.yearsExperience && (
          <View
            className="flex-row items-center"
            style={{ marginBottom: mvs(4) }}
          >
            <SVGIcons.StarRounded width={s(14)} height={s(14)} />
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueLight"
              style={{ marginLeft: s(4) }}
            >
              {artist.yearsExperience} anni di esperienza
            </ScaledText>
          </View>
        )}

        {/* Business Name (Studio Owner) */}
        {artist.isStudioOwner && artist.businessName && (
          <View
            className="flex-row items-center"
            style={{ marginBottom: mvs(4) }}
          >
            <SVGIcons.Studio width={s(14)} height={s(14)} />
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueLight"
              style={{ marginLeft: s(4) }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueLight"
              >
                Titolare di{" "}
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueBold"
              >
                {artist.businessName}
              </ScaledText>
            </ScaledText>
          </View>
        )}

        {/* Location */}
        {artist.location && (
          <View className="flex-row items-center">
            <SVGIcons.Location width={s(14)} height={s(14)} />
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueLight"
              style={{ marginLeft: s(4) }}
              numberOfLines={1}
            >
              {artist.location.province
                ? `${artist.location.municipality} (${artist.location.province})`
                : `${artist.location.municipality}, ${artist.location.province}`}
            </ScaledText>
          </View>
        )}

        {/* Styles Pills */}
        {artist.styles.length > 0 && (
         <View style={{ marginTop: mvs(4) }}>
          <StylePills styles={artist.styles} />
         </View>
        )}

        {/* Studio Profile Label */}
        {/* {artist.isStudioOwner && (
          <ScaledText
            allowScaling={false}
            variant="body4"
            className="text-primary font-neueRoman"
            style={{ marginTop: mvs(8) }}
          >
            Studio profile
          </ScaledText>
        )} */}
      </View>

      {/* Banner - Video or Images */}
      {(() => {
        const videoMedia = artist.bannerMedia.find(
          (b) => b.mediaType === "VIDEO"
        );
        const imageMedia = artist.bannerMedia.filter(
          (b) => b.mediaType === "IMAGE"
        );

        // Video banner - autoplay, looping, no controls
        if (videoMedia) {
          return (
            <Video
              source={{ uri: videoMedia.mediaUrl }}
              style={{ width: "100%", height: mvs(180) }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
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
              {imageMedia.slice(0, 4).map((img, idx) => (
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
