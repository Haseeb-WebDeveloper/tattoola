import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";
import { StudioCardContainer } from "./StudioCardContainer";

export const StudioArtistCardSkeleton: React.FC = () => {
  return (
    <StudioCardContainer >
      {/* First Row: Avatar and User Info Skeleton */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: mvs(12),
        }}
      >
        {/* Avatar Skeleton */}
        <View
          style={{
            width: s(57),
            height: s(57),
            borderRadius: s(57),
            backgroundColor: "#2A2A2A",
            marginRight: s(12),
          }}
        />
        
        {/* Text Info Skeleton */}
        <View style={{ flex: 1 }}>
          {/* Username Skeleton */}
          <View
            style={{
              width: "60%",
              height: s(16),
              backgroundColor: "#2A2A2A",
              borderRadius: s(4),
              marginBottom: mvs(6),
            }}
          />
          {/* Full Name Skeleton */}
          <View
            style={{
              width: "45%",
              height: s(12),
              backgroundColor: "#2A2A2A",
              borderRadius: s(4),
              marginBottom: mvs(6),
            }}
          />
          {/* Location Skeleton */}
          <View
            style={{
              width: "35%",
              height: s(12),
              backgroundColor: "#2A2A2A",
              borderRadius: s(4),
            }}
          />
        </View>
      </View>

      {/* Second Row: Button Skeleton */}
      <View
        style={{
          width: "100%",
          height: s(26),
          backgroundColor: "#2A2A2A",
          borderRadius: s(25),
        }}
      />
    </StudioCardContainer>
  );
};

