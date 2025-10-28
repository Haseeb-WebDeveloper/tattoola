import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

export const StudioSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-background">
      {/* Banner skeleton */}
      <View
        className="w-full bg-gray/20"
        style={{ height: mvs(200) }}
      />

      {/* Header section */}
      <View
        style={{
          paddingHorizontal: s(16),
          paddingTop: s(20),
          borderTopLeftRadius: s(35),
          borderTopRightRadius: s(35),
          marginTop: -mvs(52),
        }}
        className="bg-background"
      >
        <View className="flex-row items-start justify-between">
          {/* Logo skeleton */}
          <View className="flex-row flex-1" style={{ gap: s(12) }}>
            <View
              className="rounded-full bg-gray/20"
              style={{ width: s(92), height: s(92) }}
            />
            
            {/* Info skeleton */}
            <View className="flex-1" style={{ gap: mvs(8) }}>
              <View
                className="bg-gray/20 rounded"
                style={{ width: "80%", height: mvs(24) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: "60%", height: mvs(16) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: "70%", height: mvs(16) }}
              />
            </View>
          </View>

          {/* Map skeleton */}
          <View
            className="bg-gray/20 rounded"
            style={{
              width: s(68),
              height: s(68),
              marginLeft: s(8),
            }}
          />
        </View>

        {/* Social icons skeleton */}
        <View className="flex-row" style={{ marginTop: mvs(16), gap: s(12) }}>
          <View className="bg-gray/20 rounded-full" style={{ width: s(40), height: s(40) }} />
          <View className="bg-gray/20 rounded-full" style={{ width: s(40), height: s(40) }} />
          <View className="bg-gray/20 rounded-full" style={{ width: s(40), height: s(40) }} />
        </View>
      </View>

      {/* Description skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View className="bg-gray/20 rounded" style={{ width: "100%", height: mvs(16), marginBottom: mvs(6) }} />
        <View className="bg-gray/20 rounded" style={{ width: "90%", height: mvs(16), marginBottom: mvs(6) }} />
        <View className="bg-gray/20 rounded" style={{ width: "95%", height: mvs(16) }} />
      </View>

      {/* Styles section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View className="bg-gray/20 rounded" style={{ width: s(120), height: mvs(20), marginBottom: mvs(12) }} />
        <View className="flex-row flex-wrap" style={{ gap: s(8) }}>
          <View className="bg-gray/20 rounded-full" style={{ width: s(80), height: mvs(22) }} />
          <View className="bg-gray/20 rounded-full" style={{ width: s(90), height: mvs(22) }} />
        </View>
      </View>

      {/* Services section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View className="bg-gray/20 rounded" style={{ width: s(80), height: mvs(20), marginBottom: mvs(12) }} />
        <View style={{ gap: mvs(8) }}>
          <View className="bg-gray/20 rounded" style={{ width: "70%", height: mvs(16) }} />
          <View className="bg-gray/20 rounded" style={{ width: "60%", height: mvs(16) }} />
        </View>
      </View>

      {/* Photos section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View className="bg-gray/20 rounded" style={{ width: s(140), height: mvs(20), marginBottom: mvs(12) }} />
        <View className="flex-row" style={{ gap: s(6) }}>
          <View className="bg-gray/20 rounded" style={{ width: s(282), height: mvs(173) }} />
          <View style={{ gap: mvs(10) }}>
            <View className="bg-gray/20 rounded" style={{ width: s(62), height: mvs(51) }} />
            <View className="bg-gray/20 rounded" style={{ width: s(62), height: mvs(51) }} />
            <View className="bg-gray/20 rounded" style={{ width: s(62), height: mvs(51) }} />
          </View>
        </View>
      </View>

      {/* Artists section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View className="bg-gray/20 rounded" style={{ width: s(200), height: mvs(20), marginBottom: mvs(12) }} />
        <View
          className="bg-gray/20"
          style={{
            width: s(362),
            height: mvs(344),
            borderRadius: s(35),
          }}
        />
      </View>

      {/* FAQs section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24), paddingBottom: mvs(24) }}>
        <View className="bg-gray/20 rounded" style={{ width: s(60), height: mvs(20), marginBottom: mvs(12) }} />
        <View style={{ gap: mvs(12) }}>
          <View className="bg-gray/20 rounded" style={{ height: mvs(48) }} />
          <View className="bg-gray/20 rounded" style={{ height: mvs(48) }} />
          <View className="bg-gray/20 rounded" style={{ height: mvs(48) }} />
        </View>
      </View>
    </View>
  );
};

