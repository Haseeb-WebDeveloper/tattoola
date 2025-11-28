import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { WorkArrangement } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Image, View } from "react-native";

interface ProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  businessName?: string;
  municipality?: string;
  province?: string;
  username?: string;
  workArrangement?: WorkArrangement;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  avatar,
  businessName,
  municipality,
  province,
  username,
  workArrangement,
}) => {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const displayName =
    fullName.length > 18 ? `${fullName.slice(0, 18)}..` : fullName;
  const location = `${municipality || ""}, ${province || ""}`.replace(
    /^,\s*|,\s*$/g,
    ""
  );


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
        <View className="flex-1">
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
          {businessName && workArrangement && (
            <View className="flex-row items-center" style={{ marginTop: mvs(3) }}>
              <View style={{ marginRight: s(4) }}>
                <SVGIcons.Studio style={{ width: s(20), height: s(20) }} />
              </View>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueLight"
              >
                {(() => {
                  const arrangement = String(workArrangement).toUpperCase();
                  if (arrangement === "STUDIO_OWNER") {
                    return `Titolare di `;
                  } else if (arrangement === "STUDIO_EMPLOYEE") {
                    return `Ha lavorato a `;
                  } else if (arrangement === "FREELANCE") {
                    return `Lavora come freelance presso `;
                  }
                  return "";
                })()}
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueSemibold"
                >
                  {businessName}
                </ScaledText>
              </ScaledText>
            </View>
          )}
          <View className="flex-row items-center" style={{ marginTop: mvs(3) }}>
            <View style={{ marginRight: s(4) }}>
              <SVGIcons.Location style={{ width: s(20), height: s(20) }} />
            </View>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueLight"
            >
              {location}
            </ScaledText>
          </View>
        </View>
      </View>
    </View>
  );
};
