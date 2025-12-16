import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export type ProfileTabId =
  | "my-tattoos"
  | "liked"
  | "artists-you-follow"
  | "tattoolers";

interface ProfileTabNavigationProps {
  activeTab: ProfileTabId;
  onTabChange?: (tab: ProfileTabId) => void;
  isOwnProfile?: boolean;
}

export const ProfileTabNavigation: React.FC<ProfileTabNavigationProps> = ({
  activeTab,
  onTabChange,
  isOwnProfile = false,
}) => {
  const tabs = [
    {
      id: "my-tattoos" as const,
      label: isOwnProfile ? "I tuoi tatuaggi" : "I suoi tatuaggi",
      icon: SVGIcons.Magic,
    },
    {
      id: "liked" as const,
      label: isOwnProfile ? "Ti piace" : "Gli piace",
      icon: SVGIcons.Heart,
    },
    {
      id: "artists-you-follow" as const,
      label: isOwnProfile ? "Artisti che segui" : "Artisti che segue",
      icon: SVGIcons.UserArt,
    },
    {
      id: "tattoolers" as const,
      label: "Tattoolers",
      icon: SVGIcons.Users,
    },
  ];

  return (
    <View
      style={{
        marginTop: mvs(24),
      }}
    >
      <View className="flex-row">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              activeOpacity={1}
              key={tab.id}
              onPress={() => {
                // All tabs are now functional
                if (onTabChange) {
                  onTabChange(tab.id);
                }
              }}
              className={`items-center  w-auto border-gray ${
                isActive ? "bg-tat-foreground" : "bg-background"
              }
              
              `}
              style={{
                gap: mvs(4),
                paddingHorizontal: s(10),
                paddingVertical: mvs(8),
                borderRightWidth: index === tabs.length - 1 ? s(0) : s(0.5),
              }}
            >
              {/* Icon */}
              <View>
                <Icon
                  style={{ width: s(14), height: s(14) }}
                  color={isActive ? "#FFFFFF" : "#A49A99"}
                />
              </View>

              {/* Label */}
              <ScaledText
                allowScaling={false}
                variant="md"
                className={`font-neueLight text-center ${
                  isActive ? "text-foreground" : "text-gray"
                }`}
                style={{ fontSize: s(14), lineHeight: s(23) }}
              >
                {tab.label}
              </ScaledText>

              {/* Active Underline */}
              {/* {isActive && (
                <View
                  className="bg-foreground"
                  style={{
                    width: s(53),
                    height: 1,
                    position: "absolute",
                    bottom: -mvs(8),
                  }}
                />
              )} */}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
