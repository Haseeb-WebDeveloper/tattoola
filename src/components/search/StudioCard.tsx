import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { StudioSearchResult } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

type StudioCardProps = {
  studio: StudioSearchResult;
};

export default function StudioCard({ studio }: StudioCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/studio/${studio.id}`);
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
      {/* Top Section - Logo, Name, Locations */}
      <View style={{ padding: s(16), paddingBottom: mvs(8) }}>
        {/* Subscription Badge */}
        {studio.subscription && (
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

        {/* Logo and Name Row */}
        <View className="flex-row items-center" style={{ marginBottom: mvs(8) }}>
          <View
            className="rounded-full border border-black overflow-hidden"
            style={{ width: s(58), height: s(58), marginRight: s(12) }}
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
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueMedium"
              numberOfLines={1}
            >
              {studio.name}
            </ScaledText>
          </View>
        </View>

        {/* Locations */}
        {studio.locations.length > 0 && (
          <View style={{ marginBottom: mvs(4) }}>
            {studio.locations.map((location, index) => (
              <View
                key={index}
                className="flex-row items-center"
                style={{ marginBottom: index < studio.locations.length - 1 ? mvs(2) : 0 }}
              >
                <SVGIcons.Location width={s(14)} height={s(14)} />
                <ScaledText
                  allowScaling={false}
                  variant="body2"
                  className="text-white font-neueLight ml-1"
                  numberOfLines={1}
                >
                  {location.address
                    ? `${location.address}, ${location.municipality} (${location.province})`
                    : `${location.municipality}, ${location.province}`}
                </ScaledText>
              </View>
            ))}
          </View>
        )}

        {/* Styles Pills */}
        {studio.styles.length > 0 && (
          <View
            className="flex-row flex-wrap gap-2"
            style={{ marginTop: mvs(8) }}
          >
            {studio.styles.map((style, index) => (
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
      </View>

      {/* Banner Images Grid */}
      {studio.bannerMedia.length > 0 && (
        <View className="flex-row" style={{ height: mvs(226) }}>
          {studio.bannerMedia.length === 1 && (
            <Image
              source={{ uri: studio.bannerMedia[0].mediaUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}
          {studio.bannerMedia.length === 2 && (
            <>
              <Image
                source={{ uri: studio.bannerMedia[0].mediaUrl }}
                style={{ width: "50%", height: "100%" }}
                resizeMode="cover"
              />
              <Image
                source={{ uri: studio.bannerMedia[1].mediaUrl }}
                style={{ width: "50%", height: "100%" }}
                resizeMode="cover"
              />
            </>
          )}
          {studio.bannerMedia.length >= 3 && (
            <>
              <View style={{ width: "50%", height: "100%" }}>
                <Image
                  source={{ uri: studio.bannerMedia[0].mediaUrl }}
                  style={{ width: "100%", height: "50%" }}
                  resizeMode="cover"
                />
                <Image
                  source={{ uri: studio.bannerMedia[1].mediaUrl }}
                  style={{ width: "100%", height: "50%" }}
                  resizeMode="cover"
                />
              </View>
              <View style={{ width: "50%", height: "100%" }}>
                {studio.bannerMedia[2] && (
                  <Image
                    source={{ uri: studio.bannerMedia[2].mediaUrl }}
                    style={{
                      width: "100%",
                      height: studio.bannerMedia[3] ? "50%" : "100%",
                    }}
                    resizeMode="cover"
                  />
                )}
                {studio.bannerMedia[3] && (
                  <Image
                    source={{ uri: studio.bannerMedia[3].mediaUrl }}
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

