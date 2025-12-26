import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { WorkArrangement } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

interface ProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  businessName?: string;
  municipality?: string;
  province?: string;
  address?: string;
  username?: string;
  workArrangement?: WorkArrangement;
  yearsExperience?: number;
  onBusinessNamePress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  avatar,
  businessName,
  municipality,
  province,
  address,
  username,
  workArrangement,
  yearsExperience,
  onBusinessNamePress,
}) => {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const displayName =
    fullName.length > 18 ? `${fullName.slice(0, 18)}..` : fullName;
  
  // Build location string:
  // For artist profile UI we only display province/municipality label,
  // not the raw street address. The caller already formats `province`
  // as needed (e.g. "Milano (MI)").
  const location = province || municipality || "";

  return (
    <View
      style={{
        paddingHorizontal: s(16),
        paddingTop: s(20),
        borderTopLeftRadius: s(35),
        borderTopRightRadius: s(35),
        marginTop: -mvs(52), // -mt-12 => -48 if scale factor mvs(4) = 16 x 3
      }}
      className="bg-background "
    >
      <View className="flex-row items-center" style={{ gap: s(12) }}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            className="rounded-full"
            style={{ width: s(92), height: s(92) }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="rounded-full bg-gray/30"
            style={{ width: s(92), height: s(92) }}
          />
        )}
        <View className="flex-1 justify-center">
          <View className="flex-row items-center">
            <ScaledText
              allowScaling={false}
              variant="20"
              className="text-foreground font-neueBold leading-none "
            >
              {displayName}
            </ScaledText>
            <View style={{ marginLeft: s(4) }}>
              <SVGIcons.VarifiedGreen style={{ width: s(20), height: s(20) }} />
            </View>
          </View>
          <View className="flex-row items-center" style={{ marginTop: mvs(2) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className=" font-neueLight text-gray"
            >
              {username}
            </ScaledText>
          </View>
          {/* Years of Experience */}
          {yearsExperience && (
            <View
              className="flex-row"
              style={{ marginTop: mvs(4), alignItems: "flex-start" }}
            >
              <View style={{ marginTop: mvs(2) }}>
                <SVGIcons.StarRounded style={{ width: s(14), height: s(14) }} />
              </View>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueLight"
                style={{ marginLeft: s(6), flexShrink: 1 }}
              >
                {yearsExperience} anni di esperienza
              </ScaledText>
            </View>
          )}
          {/* Business Name (Studio Owner, Employee, or Freelancer) */}
          {workArrangement && (
            <View
              className="flex-row"
              style={{ marginTop: mvs(2), alignItems: "flex-start" }}
            >
              <View style={{ marginTop: mvs(2), marginRight: s(4) }}>
                <SVGIcons.Studio style={{ width: s(20), height: s(20) }} />
              </View>
              <View style={{ flex: 1, flexShrink: 1 }}>
                {(() => {
                  const arrangement = String(workArrangement).toUpperCase();
                  const normalizedBusinessName =
                    businessName && businessName.length > 0
                      ? businessName.charAt(0).toUpperCase() +
                        businessName.slice(1)
                      : businessName;

                  if (arrangement === "STUDIO_OWNER" && businessName) {
                    return (
                      <View className="flex-row" style={{ flexWrap: "wrap" }}>
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-foreground font-neueLight"
                        >
                          Titolare di{" "}
                        </ScaledText>
                        <TouchableOpacity
                          disabled={!onBusinessNamePress}
                          onPress={onBusinessNamePress}
                          activeOpacity={onBusinessNamePress ? 0.7 : 1}
                        >
                          <ScaledText
                            allowScaling={false}
                            variant="md"
                            className="text-foreground font-neueBold"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {normalizedBusinessName}
                          </ScaledText>
                        </TouchableOpacity>
                      </View>
                    );
                  } else if (arrangement === "STUDIO_EMPLOYEE" && businessName) {
                    return (
                      <View className="flex-row" style={{ flexWrap: "wrap" }}>
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-foreground font-neueLight"
                        >
                          Tattoo Artist resident in{" "}
                        </ScaledText>
                        <TouchableOpacity
                          disabled={!onBusinessNamePress}
                          onPress={onBusinessNamePress}
                          activeOpacity={onBusinessNamePress ? 0.7 : 1}
                        >
                          <ScaledText
                            allowScaling={false}
                            variant="md"
                            className="text-foreground font-neueBold"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {normalizedBusinessName}
                          </ScaledText>
                        </TouchableOpacity>
                      </View>
                    );
                  } else if (arrangement === "FREELANCE") {
                    return (
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="text-foreground font-neueLight"
                      >
                        Freelance
                      </ScaledText>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>
          )}
          <View
            className="flex-row"
            style={{ marginTop: mvs(2), alignItems: "flex-start" }}
          >
            {location && (
              <>
                <View style={{ marginTop: mvs(2), marginRight: s(4) }}>
                  <SVGIcons.Location style={{ width: s(20), height: s(20) }} />
                </View>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueLight"
                  style={{ flexShrink: 1 }}
                >
                  {location}
                </ScaledText>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
