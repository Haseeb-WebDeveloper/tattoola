import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Image, View } from "react-native";

interface TattooLoverProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  username?: string;
  municipality?: string;
  province?: string;
  instagram?: string;
  tiktok?: string;
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
}) => {
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
                className="text-foreground font-semibold"
                style={{ lineHeight: mvs(24) }}
              >
                {fullName}
              </ScaledText>
            )}

            {/* Username */}
            {!!username && (
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-light text-foreground"
                >
                  @{username}
                </ScaledText>
              </View>
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
              className="text-foreground font-light"
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
            <View
              className="items-center justify-center"
              style={{ width: s(41.5), height: s(41.5), backgroundColor: "#AE0E0E80", borderRadius: s(100) }}
            >
              <SVGIcons.Instagram style={{ width: s(20), height: s(20) }} />
            </View>
          )}
          {tiktok && (
            <View
              className="items-center justify-center"
              style={{
                width: s(41.5),
                height: s(41.5),
                backgroundColor: "#25F4EE80",
                borderRadius: s(100),
              }}
            >
              <SVGIcons.Tiktok style={{ width: s(20), height: s(20) }} />
            </View>
          )}
        </View>
      )}
    </View>
  );
};
