import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { toggleFollow } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import { createInstagramUrl, createTiktokUrl } from "@/utils/socialMedia";
import React, { useState } from "react";
import { Image, Linking, TouchableOpacity, View } from "react-native";

interface TattooLoverProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  username?: string;
  municipality?: string;
  province?: string;
  instagram?: string;
  tiktok?: string;
  isOtherProfile?: boolean;
  currentUserId?: string;
  targetUserId?: string;
  initialIsFollowing?: boolean;
}

export const TattooLoverProfileHeader: React.FC<
  TattooLoverProfileHeaderProps
> = ({
  firstName,
  lastName,
  avatar,
  username,
  municipality,
  province,
  instagram,
  tiktok,
  isOtherProfile = false,
  currentUserId,
  targetUserId,
  initialIsFollowing = false,
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const handleFollowToggle = async () => {
    if (isTogglingFollow || !currentUserId || !targetUserId) return;

    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);
    setIsTogglingFollow(true);

    try {
      const result = await toggleFollow(currentUserId, targetUserId);
      setIsFollowing(result.isFollowing);
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState);
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsTogglingFollow(false);
    }
  };
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const location = `${municipality || ""} (${province || ""})`.replace(
    /\(\s*\)$/,
    ""
  );

  const hasSocialMedia = instagram || tiktok;

  return (
    <View
      style={{
        paddingHorizontal: s(16),
      }}
      className="bg-background"
    >
      <View className="" style={{ gap: s(12), marginTop: mvs(8) }}>
        {/* Avatar and Name Section */}
        <View className="flex-row items-center" style={{ gap: s(12) }}>
          {/* Avatar */}
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="rounded-full"
              style={{ width: s(78), height: s(78) }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="rounded-full bg-gray/30"
              style={{ width: s(78), height: s(78) }}
            />
          )}

          {/* Name and Location */}
          <View
            className="flex-1"
            style={{
              gap: s(3),
            }}
          >
            {/* Full Name */}
            {!!fullName && (
              <ScaledText
                allowScaling={false}
                variant="2xl"
                className="text-foreground font-neueSemibold"
                style={{ lineHeight: mvs(24) }}
              >
                {fullName}
              </ScaledText>
            )}

            {/* Username */}
            {!!username && !isOtherProfile && (
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-neueLight text-foreground"
                >
                  @{username}
                </ScaledText>
              </View>
            )}

            {/* Follow button */}
            {isOtherProfile && currentUserId && (
              <TouchableOpacity
                onPress={handleFollowToggle}
                disabled={isTogglingFollow}
                className={`rounded-full items-center flex-row ${
                  isFollowing ? "border-error" : "border-gray"
                }`}
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: s(16),
                  paddingVertical: mvs(6),
                  gap: s(6),
                  borderWidth: s(1.1),
                }}
              >
                <SVGIcons.Follow width={s(14)} height={s(14)} />
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-foreground font-neueMedium"
                >
                  {isFollowing ? "Seguito" : "Segui"}
                </ScaledText>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Location */}
        {!!location && location !== "" && (
          <View className="flex-row items-center">
            <View style={{ marginRight: s(4) }}>
              <SVGIcons.Location style={{ width: s(14), height: s(14) }} />
            </View>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueLight"
            >
              {location}
            </ScaledText>
          </View>
        )}
      </View>

      {/* Social Media Icons */}
      {hasSocialMedia && (
        <View
          className="flex-row items-center"
          style={{ marginTop: mvs(12), gap: s(10) }}
        >
          {instagram && (
            <TouchableOpacity
              onPress={() => {
                const url = createInstagramUrl(instagram);
                Linking.openURL(url).catch((err) =>
                  console.error("Failed to open Instagram:", err)
                );
              }}
              className="items-center justify-center"
              style={{
                width: s(41.5),
                height: s(41.5),
                backgroundColor: "#AE0E0E80",
                borderRadius: s(100),
              }}
            >
              <SVGIcons.Instagram style={{ width: s(20), height: s(20) }} />
            </TouchableOpacity>
          )}
          {tiktok && (
            <TouchableOpacity
              onPress={() => {
                const url = createTiktokUrl(tiktok);
                Linking.openURL(url).catch((err) =>
                  console.error("Failed to open TikTok:", err)
                );
              }}
              className="items-center justify-center"
              style={{
                width: s(41.5),
                height: s(41.5),
                backgroundColor: "#25F4EE80",
                borderRadius: s(100),
              }}
            >
              <SVGIcons.Tiktok style={{ width: s(20), height: s(20) }} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
