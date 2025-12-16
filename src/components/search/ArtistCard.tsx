import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { cloudinaryService } from "@/services/cloudinary.service";
import { prefetchUserProfile } from "@/services/prefetch.service";
import type { ArtistSearchResult } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { StylePills } from "../ui/stylePills";

type ArtistCardProps = {
  artist: ArtistSearchResult;
};

function ArtistCard({ artist }: ArtistCardProps) {
  const router = useRouter();

  const handlePress = () => {
    // Start prefetching profile data before navigation for faster load
    prefetchUserProfile(artist.userId).catch(() => {
      // Ignore prefetch errors – navigation should still work
    });
    router.push(`/user/${artist.userId}`);
  };

  const displayName =
    [artist.user.firstName, artist.user.lastName].filter(Boolean).join(" ") ||
    artist.user.username;

  const videoMedia = artist.bannerMedia.find((b) => b.mediaType === "VIDEO");
  
  // Transform video URL to MP4/H.264/AAC for iOS compatibility
  const videoUrl = useMemo(() => {
    if (videoMedia?.mediaUrl) {
      return cloudinaryService.getIOSCompatibleVideoUrl(videoMedia.mediaUrl);
    }
    return "";
  }, [videoMedia?.mediaUrl]);

  // Always call hook at top level, but only create player if we have a URL
  const videoPlayer = useVideoPlayer(videoUrl || null, (player) => {
    if (videoUrl && player) {
      try {
        player.loop = true;
        player.muted = true;
        // Small delay for iOS to ensure player is ready
        setTimeout(() => {
          try {
            if (player) {
              player.play();
            }
          } catch (e) {
            // Silently ignore if player was released
          }
        }, 100);
      } catch (error) {
        console.error("Error initializing video player:", error);
      }
    }
  });

  // Update player source when URL changes
  useEffect(() => {
    if (!videoUrl || !videoPlayer) return;

    let isMounted = true;
    const updatePlayer = async () => {
      try {
        if (isMounted && videoUrl && videoPlayer) {
          await videoPlayer.replaceAsync(videoUrl);
          if (isMounted && videoPlayer) {
            videoPlayer.loop = true;
            videoPlayer.muted = true;
            // Small delay for iOS to ensure player is ready
            setTimeout(() => {
              try {
                if (isMounted && videoPlayer) {
                  videoPlayer.play();
                }
              } catch (e) {
                // Silently ignore if player was released
              }
            }, 100);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading video player:", error);
        }
      }
    };
    updatePlayer();

    return () => {
      isMounted = false;
    };
  }, [videoUrl, videoPlayer]);

  // artist.isStudioOwner

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      className="overflow-hidden border bg-background border-gray/50"
      style={{
        marginHorizontal: s(16),
        marginBottom: mvs(16),
        borderRadius: s(20),
      }}
    >
      {/* Top Section - Avatar, Name, Experience, Location */}
      <View style={{ padding: s(16), paddingBottom: mvs(8) }}>
        {/* Subscription Badge */}
        <View
          className="absolute top-0 right-0 flex-row items-center justify-center bg-gray"
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
            Profilo artista
          </ScaledText>
        </View>

        {/* Avatar and Name Row */}
        <View
          className="flex-row items-center"
          style={{ marginBottom: mvs(8) }}
        >
          <View
            className="overflow-hidden border border-black rounded-full"
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
                className="leading-none text-foreground font-neueBold "
              >
                {displayName}
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

        {/* Business Name (Studio Owner, Employee, or Freelancer) */}
        {artist.workArrangement && (
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
              {artist.workArrangement === "STUDIO_OWNER" && artist.businessName ? (
                <>
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
                </>
              ) : artist.workArrangement === "STUDIO_EMPLOYEE" && artist.businessName ? (
                <>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-white font-neueLight"
                  >
                    Tattoo Artist residente in{" "}
                  </ScaledText>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-white font-neueBold"
                  >
                    {artist.businessName}
                  </ScaledText>
                </>
              ) : artist.workArrangement === "FREELANCE" ? (
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-white font-neueLight"
                >
                  Freelance
                </ScaledText>
              ) : null}
            </ScaledText>
          </View>
        )}

        {/* Location - show only "Province (CODE)" or municipality (no street address) */}
        {artist.location && (artist.location.province || artist.location.municipality) && (
          <View className="flex-row items-center">
            <SVGIcons.Location width={s(14)} height={s(14)} />
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueLight"
              style={{ marginLeft: s(4) }}
              numberOfLines={1}
            >
              {artist.location.province ||
                artist.location.municipality ||
                ""}
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
            Profilo studio
          </ScaledText>
        )} */}
      </View>

      {/* Banner - Video or Images */}
      {(() => {
        const imageMedia = artist.bannerMedia.filter(
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

export default React.memo(ArtistCard);
