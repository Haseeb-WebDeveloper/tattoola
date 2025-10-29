import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface ProfileTabNavigationProps {
  activeTab: "my-tattoos" | "liked" | "artists-you-follow" | "tattoolers";
  onTabChange?: (
    tab: "my-tattoos" | "liked" | "artists-you-follow" | "tattoolers"
  ) => void;
}

export const ProfileTabNavigation: React.FC<ProfileTabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: "my-tattoos" as const,
      label: "My tattoos",
      icon: SVGIcons.Magic,
    },
    {
      id: "liked" as const,
      label: "Liked",
      icon: SVGIcons.Heart,
    },
    {
      id: "artists-you-follow" as const,
      label: "Artists you follow",
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
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <View
        className="flex-row justify-between"
        style={{
          paddingHorizontal: s(16),
          paddingBottom: mvs(8),
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                // All tabs are now functional
                if (onTabChange) {
                  onTabChange(tab.id);
                }
              }}
              className={`items-center  ${
                  isActive ? "bg-tat-foreground" : "bg-background"
                }`}
              style={{ gap: mvs(4), minWidth: s(60) }}
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
                  isActive ? "text-foreground" : "text-[#A49A99]"
                }`}
                style={{ fontSize: s(14), lineHeight: s(23) }}
              >
                {tab.label}
              </ScaledText>

              {/* Active Underline */}
              {isActive && (
                <View
                  className="bg-foreground"
                  style={{
                    width: s(53),
                    height: 1,
                    position: "absolute",
                    bottom: -mvs(8),
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
