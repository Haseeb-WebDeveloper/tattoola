import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { cloudinaryService } from "@/services/cloudinary.service";
import { prefetchStudioProfile } from "@/services/studio.service";
import type { StudioSearchResult, StudioSummary } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { StylePills } from "../ui/stylePills";

type StudioCardProps = {
  studio: StudioSearchResult;
  onEditPress?: () => void;
};

function StudioCard({ studio, onEditPress }: StudioCardProps) {
  const router = useRouter();

  const normalizedName =
    studio.name && studio.name.length > 0
      ? studio.name.charAt(0).toUpperCase() + studio.name.slice(1)
      : studio.name;

  const handlePress = () => {
    // Prefetch studio profile for faster screen load
    prefetchStudioProfile(studio.id).catch(() => {
      // Ignore prefetch errors – navigation should still succeed
    });

    // Convert StudioSearchResult to StudioSummary for instant render
    const initialStudio: StudioSummary = {
      id: studio.id,
      name: studio.name,
      logo: studio.logo,
      city: studio.locations[0]?.municipality,
      province: studio.locations[0]?.province,
      address: studio.locations[0]?.address || null,
      owner: studio.ownerName
        ? {
            id: "", // Will be filled by full fetch
            firstName: studio.ownerName.split(" ")[0] || null,
            lastName:
              studio.ownerName.split(" ").slice(1).join(" ") || null,
            avatar: null,
          }
        : null,
      banner: studio.bannerMedia.slice(0, 2), // Limit to 1-2 items for first paint
      styles: studio.styles.slice(0, 3), // Top 2-3 styles
      services: null, // Will be loaded later
      description: studio.description,
    };

    router.push({
      pathname: `/studio/${studio.id}`,
      params: {
        initialStudio: JSON.stringify(initialStudio),
      },
    } as any);
  };

  const videoMedia = studio.bannerMedia.find((b) => b.mediaType === "VIDEO");
  
  // Transform video URL to MP4/H.264/AAC for iOS compatibility
  const videoUrl = useMemo(() => {
    if (videoMedia?.mediaUrl) {
      return cloudinaryService.getIOSCompatibleVideoUrl(videoMedia.mediaUrl);
    }
    return "";
  }, [videoMedia?.mediaUrl]);

  // Always call hook at top level
  const videoPlayer = useVideoPlayer(videoUrl, (player) => {
    if (videoUrl) {
      player.loop = true;
      player.muted = true;
      // Small delay for iOS to ensure player is ready
      setTimeout(() => {
        player.play();
      }, 100);
    }
  });

  // Update player source when URL changes
  useEffect(() => {
    const updatePlayer = async () => {
      if (videoUrl && videoPlayer) {
        try {
          await videoPlayer.replaceAsync(videoUrl);
          videoPlayer.loop = true;
          videoPlayer.muted = true;
          // Small delay for iOS to ensure player is ready
          setTimeout(() => {
            videoPlayer.play();
          }, 100);
        } catch (error) {
          console.error("Error loading video player:", error);
        }
      }
    };
    updatePlayer();
  }, [videoUrl, videoPlayer]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      className="overflow-hidden bg-background border-gray/50"
      style={{
        marginHorizontal: s(16),
        marginBottom: mvs(16),
        borderRadius: s(35),
        borderWidth: s(0.5),
      }}
    >
      {/* Top Section - Logo, Name, Locations */}
      <View style={{ padding: s(16), paddingBottom: mvs(8) }}>
        {/* Subscription badge + optional "Modifica" button (only when onEditPress is provided) */}
        {(studio.subscription || onEditPress) && (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              alignItems: "flex-end",
              gap: s(4),
            }}
          >
            {/* {studio.subscription && (
              <View
                className="flex-row items-center justify-center bg-gray"
                style={{
                  paddingLeft: s(8),
                  paddingRight: s(25),
                  paddingVertical: mvs(5),
                  gap: s(4),
                  borderBottomLeftRadius: s(9),
                  borderTopRightRadius: s(9),
                }}
              >
                <SVGIcons.DimondRed width={s(12)} height={s(12)} />
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-primary font-neueMedium"
                >
                  Profilo studio
                </ScaledText>
              </View>
            )} */}

            {onEditPress && (
              <TouchableOpacity
                onPress={onEditPress}
                activeOpacity={0.8}
                style={{
                  marginRight: s(10),
                  marginTop: mvs(10),
                  width: s(30),
                  height: s(30),
                  borderRadius: s(18),
                  borderWidth: s(1),
                  backgroundColor: "#D9D9D9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SVGIcons.EditRed width={s(14)} height={s(14)} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Logo and Name Row */}
        <View
          className="flex-row items-center"
          style={{ marginBottom: mvs(8) }}
        >
          <View
            className="overflow-hidden border border-black rounded-full"
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
                {normalizedName}
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
              className="ml-1 text-gray font-montserratMedium"
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
              Di proprietà di
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="ml-1 text-white font-neueBold"
              numberOfLines={1}
            >
              {studio.ownerName}
            </ScaledText>
          </View>
        ) : null}

        {/* Locations */}
        {studio.locations.length > 0 && (
          <View style={{ marginBottom: mvs(4) }}>
            {studio.locations.map((location, index) => {
              const hasAddress = !!location?.address;
              const lineText = hasAddress
                ? location.address
                : `${location?.province || ""}${
                    location?.municipality ? `, ${location.municipality}` : ""
                  }`;

              return (
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
                    className="ml-1 text-white font-neueLight"
                    numberOfLines={1}
                  >
                    {lineText}
                  </ScaledText>
                </View>
              );
            })}
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
        if (videoUrl && videoPlayer) {
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

export default React.memo(StudioCard);

