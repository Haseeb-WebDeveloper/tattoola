import { mvs, s } from "@/utils/scale";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export default function StudioCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return (
    <View
      className="bg-background border border-gray/50 overflow-hidden"
      style={{
        marginHorizontal: s(16),
        marginBottom: mvs(16),
        borderRadius: s(20),
      }}
    >
      {/* Top Section - Logo, Name, Locations */}
      <View style={{ padding: s(16), paddingBottom: mvs(8) }}>
        {/* Logo and Name Row */}
        <View className="flex-row items-center" style={{ marginBottom: mvs(8) }}>
          {/* Logo Skeleton */}
          <Animated.View
            className="rounded-full bg-gray/30"
            style={{ width: s(58), height: s(58), marginRight: s(12), opacity }}
          />

          <View className="flex-1">
            {/* Name Skeleton */}
            <Animated.View
              className="bg-gray/30 rounded"
              style={{ width: "70%", height: mvs(16), opacity }}
            />
          </View>
        </View>

        {/* Locations Skeleton */}
        <View style={{ marginBottom: mvs(4) }}>
          <View
            className="flex-row items-center"
            style={{ marginBottom: mvs(2) }}
          >
            <Animated.View
              className="bg-gray/30 rounded"
              style={{ width: s(14), height: s(14), marginRight: s(8), opacity }}
            />
            <Animated.View
              className="bg-gray/30 rounded"
              style={{ width: "60%", height: mvs(12), opacity }}
            />
          </View>
          <View className="flex-row items-center">
            <Animated.View
              className="bg-gray/30 rounded"
              style={{ width: s(14), height: s(14), marginRight: s(8), opacity }}
            />
            <Animated.View
              className="bg-gray/30 rounded"
              style={{ width: "55%", height: mvs(12), opacity }}
            />
          </View>
        </View>

        {/* Styles Pills Skeleton */}
        <View
          className="flex-row flex-wrap gap-2"
          style={{ marginTop: mvs(8) }}
        >
          <Animated.View
            className="bg-gray/30 rounded-full"
            style={{ width: s(90), height: mvs(26), opacity }}
          />
          <Animated.View
            className="bg-gray/30 rounded-full"
            style={{ width: s(110), height: mvs(26), opacity }}
          />
        </View>
      </View>

      {/* Banner Skeleton */}
      <Animated.View className="bg-gray/30" style={{ height: mvs(226), opacity }} />
    </View>
  );
}

