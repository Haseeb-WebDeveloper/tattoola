import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { ArtistSearchResult } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

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
      className="bg-background border border-gray/50 rounded-[35px] overflow-hidden"
      style={{
        width: s(330),
        marginHorizontal: s(16),
        marginBottom: mvs(16),
      }}
    >
      {/* Top Section - Avatar, Name, Experience, Location */}
      <View style={{ padding: s(16), paddingBottom: mvs(8) }}>
        {/* Subscription Badge */}
        {artist.subscription && (
          <View
            className="absolute right-0 top-1 rounded-full items-center justify-center"
            style={{
              paddingHorizontal: s(8),
              paddingVertical: mvs(4),
            }}
          >
            <SVGIcons.DimondYellow width={s(12)} height={s(12)} />
          </View>
        )}

        {/* Avatar and Name Row */}
        <View
          className="flex-row items-center"
          style={{ marginBottom: mvs(8) }}
        >
          <View
            className="rounded-full border border-black overflow-hidden"
            style={{ width: s(58), height: s(58), marginRight: s(12) }}
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
                variant="md"
                className="text-white font-neueMedium"
              >
                {artist.user.username}
              </ScaledText>
              {artist.isVerified && (
                <SVGIcons.VarifiedGreen width={s(14)} height={s(14)} />
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
            <SVGIcons.Star width={s(14)} height={s(14)} />
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-white font-neueLight ml-1"
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
              variant="body2"
              className="text-white font-neueLight ml-1"
            >
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-white font-neueLight"
              >
                Titolare di{" "}
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="body2"
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
              variant="body2"
              className="text-white font-neueLight ml-1"
              numberOfLines={1}
            >
              {artist.location.address
                ? `${artist.location.address}, ${artist.location.municipality} (${artist.location.province})`
                : `${artist.location.municipality}, ${artist.location.province}`}
            </ScaledText>
          </View>
        )}

        {/* Styles Pills */}
        {artist.styles.length > 0 && (
          <View
            className="flex-row flex-wrap gap-2"
            style={{ marginTop: mvs(8) }}
          >
            {artist.styles.map((style, index) => (
              <View
                key={style.id}
                className="border border-white rounded-full px-3 py-1"
              >
                <ScaledText
                  allowScaling={false}
                  variant="body4"
                  className="text-white font-neueMedium"
                >
                  {style.name}
                </ScaledText>
              </View>
            ))}
          </View>
        )}

        {/* Studio Profile Label */}
        {artist.isStudioOwner && (
          <ScaledText
            allowScaling={false}
            variant="body4"
            className="text-primary font-neueRoman"
            style={{ marginTop: mvs(8) }}
          >
            Studio profile
          </ScaledText>
        )}
      </View>

      {/* Banner Images Grid */}
      {artist.bannerMedia.length > 0 && (
        <View className="flex-row" style={{ height: mvs(226) }}>
          {artist.bannerMedia.length === 1 && (
            <Image
              source={{ uri: artist.bannerMedia[0].mediaUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}
          {artist.bannerMedia.length === 2 && (
            <>
              <Image
                source={{ uri: artist.bannerMedia[0].mediaUrl }}
                style={{ width: "50%", height: "100%" }}
                resizeMode="cover"
              />
              <Image
                source={{ uri: artist.bannerMedia[1].mediaUrl }}
                style={{ width: "50%", height: "100%" }}
                resizeMode="cover"
              />
            </>
          )}
          {artist.bannerMedia.length >= 3 && (
            <>
              <View style={{ width: "50%", height: "100%" }}>
                <Image
                  source={{ uri: artist.bannerMedia[0].mediaUrl }}
                  style={{ width: "100%", height: "50%" }}
                  resizeMode="cover"
                />
                <Image
                  source={{ uri: artist.bannerMedia[1].mediaUrl }}
                  style={{ width: "100%", height: "50%" }}
                  resizeMode="cover"
                />
              </View>
              <View style={{ width: "50%", height: "100%" }}>
                {artist.bannerMedia[2] && (
                  <Image
                    source={{ uri: artist.bannerMedia[2].mediaUrl }}
                    style={{
                      width: "100%",
                      height: artist.bannerMedia[3] ? "50%" : "100%",
                    }}
                    resizeMode="cover"
                  />
                )}
                {artist.bannerMedia[3] && (
                  <Image
                    source={{ uri: artist.bannerMedia[3].mediaUrl }}
                    style={{ width: "100%", height: "50%" }}
                    resizeMode="cover"
                  />
                )}
              </View>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
