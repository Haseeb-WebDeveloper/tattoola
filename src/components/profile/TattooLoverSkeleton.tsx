import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

export const TattooLoverSkeleton: React.FC = () => {
  const tabs = [
    {
      id: "my-tattoos",
      label: "My tattoos",
      icon: SVGIcons.Magic,
    },
    {
      id: "liked",
      label: "Liked",
      icon: SVGIcons.Heart,
    },
    {
      id: "artists-you-follow",
      label: "Artists you follow",
      icon: SVGIcons.UserArt,
    },
    {
      id: "tattoolers",
      label: "Tattoolers",
      icon: SVGIcons.Users,
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Header with username - Static */}
      <View
        className="flex-row w-full items-center justify-between"
        style={{
          height: s(80),
          paddingHorizontal: s(16),
        }}
      >
        {/* Back button - Static */}
        <TouchableOpacity
          disabled
          className="rounded-full bg-foreground/20 items-center justify-center"
          style={{ width: s(32), height: s(32) }}
        >
          <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
        </TouchableOpacity>

        {/* Title - Static */}
        <ScaledText
          variant="md"
          className="text-foreground font-bold"
          style={{
            marginBottom: mvs(0),
          }}
        >
          Your Profile
        </ScaledText>

        {/* Settings button - Static */}
        <TouchableOpacity
          disabled
          className="rounded-full bg-primary items-center justify-center"
          style={{ width: s(32), height: s(32) }}
        >
          <SVGIcons.Settings style={{ width: s(20), height: s(20) }} />
        </TouchableOpacity>
      </View>

      {/* Profile Header Skeleton */}
      <View style={{ paddingHorizontal: s(16) }}>
        <View style={{ gap: s(12), marginTop: mvs(8) }}>
          {/* Avatar and Name Section */}
          <View className="flex-row items-center" style={{ gap: s(12) }}>
            {/* Avatar - Skeleton */}
            <View
              className="rounded-full bg-foreground/10"
              style={{ width: s(78), height: s(78) }}
            />

            {/* Name and Location - Skeleton */}
            <View className="flex-1" style={{ gap: s(3) }}>
              {/* Full Name */}
              <View
                className="bg-foreground/10 rounded-lg"
                style={{ width: s(140), height: s(20) }}
              />

              {/* Username */}
              <View
                className="bg-foreground/10 rounded-lg"
                style={{ width: s(100), height: s(16) }}
              />
            </View>
          </View>

          {/* Location - Skeleton */}
          <View className="flex-row items-center">
            <View style={{ marginRight: s(4) }}>
              <SVGIcons.Location style={{ width: s(14), height: s(14) }} />
            </View>
            <View
              className="bg-foreground/10 rounded-lg"
              style={{ width: s(120), height: s(14) }}
            />
          </View>
        </View>

        {/* Social Media Icons - Skeleton */}
        <View
          className="flex-row items-center"
          style={{ marginTop: mvs(12), gap: s(10) }}
        >
          <View
            className="items-center justify-center bg-foreground/10"
            style={{
              width: s(41.5),
              height: s(41.5),
              borderRadius: s(100),
            }}
          />
          <View
            className="items-center justify-center bg-foreground/10"
            style={{
              width: s(41.5),
              height: s(41.5),
              borderRadius: s(100),
            }}
          />
        </View>
      </View>

      {/* Preferred Styles Section - Skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View
          className="bg-foreground/10 rounded-lg"
          style={{ width: s(130), height: s(18), marginBottom: mvs(12) }}
        />
        <View className="flex-row flex-wrap" style={{ gap: s(8) }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="bg-foreground/10 rounded-full"
              style={{
                paddingHorizontal: s(12),
                paddingVertical: mvs(6),
                height: mvs(28),
                width: s(80),
              }}
            />
          ))}
        </View>
      </View>

      {/* Tab Navigation - Match real UI */}
      <View
        style={{
          marginTop: mvs(24),
        }}
      >
        <View className="flex-row">
          {tabs.map((tab, index) => {
            const isActive = index === 0;
            const Icon = tab.icon;

            return (
              <TouchableOpacity
                activeOpacity={1}
                key={tab.id}
                disabled
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
                  className={`font-light text-center ${
                    isActive ? "text-foreground" : "text-gray"
                  }`}
                  style={{ fontSize: s(14), lineHeight: s(23) }}
                >
                  {tab.label}
                </ScaledText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content Grid Skeleton */}
      {/* <View
        className="flex-row flex-wrap justify-between"
        style={{
          paddingHorizontal: s(16),
          paddingTop: mvs(16),
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            className="bg-foreground/10 rounded-lg"
            style={{
              width: (s(375) - s(48)) / 2,
              height: mvs(200),
              marginBottom: mvs(16),
            }}
          />
        ))}
      </View> */}

      {/* Bottom Spacer */}
      <View style={{ height: mvs(100) }} />
    </ScrollView>
  );
};

