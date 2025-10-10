import { SVGIcons } from "@/constants/svg";
import React from "react";
import { Image, Text, View } from "react-native";

interface ProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  businessName?: string;
  municipality?: string;
  province?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  avatar,
  businessName,
  municipality,
  province,
}) => {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const displayName =
    fullName.length > 18 ? `${fullName.slice(0, 18)}..` : fullName;
  const location = `${municipality || ""}, ${province || ""}`.replace(
    /^,\s*|,\s*$/g,
    ""
  );

  return (
    <View className="px-4 mt-6">
      <View className="flex-row items-center gap-3">
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            className="w-20 h-20 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-20 h-20 rounded-full bg-gray/30" />
        )}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-foreground font-neueBold section-title leading-none">
              {displayName}
            </Text>
            <View className="ml-1">
              <SVGIcons.VarifiedGreen className="w-5 h-5" />
            </View>
          </View>
          <Text className="text-foreground flex-row items-center text-[16px]">
            <View className="mr-1">
              <SVGIcons.Studio className="w-5 h-5" />
            </View>
            <Text className="text-foreground"> Titolare di </Text>
            <Text className="text-foreground font-neueBlack">
              {businessName || ""}
            </Text>
          </Text>
          <Text className="text-foreground text-[16px] mt-1">
            <View className="mr-1">
              <SVGIcons.Location className="w-5 h-5" />
            </View>
            <Text className="text-foreground"> {location}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};
