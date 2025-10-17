import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

export const ProfileSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-background">
      {/* Edit button skeleton */}
      <View
        className="absolute top-2 right-0 z-10"
        style={{ paddingHorizontal: s(16) }}
      >
        <View
          className="rounded-full bg-gray/20"
          style={{ width: s(36), height: s(36) }}
        />
      </View>

      {/* Banner skeleton */}
      <View className="bg-gray/20" style={{ height: mvs(192) }} />

      {/* Profile Header skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View className="flex-row items-center" style={{ gap: s(12) }}>
          {/* Avatar skeleton */}
          <View
            className="rounded-full bg-gray/20"
            style={{ width: s(80), height: s(80) }}
          />
          <View className="flex-1">
            {/* Name skeleton */}
            <View className="flex-row items-center" style={{ marginBottom: mvs(8) }}>
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(128), height: mvs(24) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(20), height: s(20), marginLeft: s(4) }}
              />
            </View>
            {/* Studio skeleton */}
            <View className="flex-row items-center" style={{ marginBottom: mvs(8) }}>
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(16), height: s(16), marginRight: s(4) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(96), height: mvs(16) }}
              />
            </View>
            {/* Location skeleton */}
            <View className="flex-row items-center">
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(16), height: s(16), marginRight: s(4) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(80), height: mvs(16) }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Social Media Icons skeleton */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: s(16),
          marginTop: mvs(16),
          gap: s(12),
        }}
      >
        <View
          className="rounded-full bg-gray/20"
          style={{ width: s(48), height: s(48) }}
        />
        <View
          className="rounded-full bg-gray/20"
          style={{ width: s(48), height: s(48) }}
        />
        <View
          className="rounded-full bg-gray/20"
          style={{ width: s(48), height: s(48) }}
        />
      </View>

      {/* Bio skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View
          className="bg-gray/20 rounded"
          style={{ width: "100%", height: mvs(16), marginBottom: mvs(8) }}
        />
        <View
          className="bg-gray/20 rounded"
          style={{ width: "75%", height: mvs(16), marginBottom: mvs(8) }}
        />
        <View
          className="bg-gray/20 rounded"
          style={{ width: "50%", height: mvs(16) }}
        />
      </View>

      {/* Styles Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View
          className="bg-gray/20 rounded"
          style={{ width: s(128), height: mvs(20), marginBottom: mvs(12) }}
        />
        <View className="flex-row flex-wrap" style={{ gap: s(8) }}>
          <View
            className="bg-gray/20 rounded-full"
            style={{ width: s(80), height: mvs(32) }}
          />
          <View
            className="bg-gray/20 rounded-full"
            style={{ width: s(96), height: mvs(32) }}
          />
          <View
            className="bg-gray/20 rounded-full"
            style={{ width: s(64), height: mvs(32) }}
          />
        </View>
      </View>

      {/* Services Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View
          className="bg-gray/20 rounded"
          style={{ width: s(80), height: mvs(20), marginBottom: mvs(12) }}
        />
        <View style={{ gap: mvs(8) }}>
          <View
            className="bg-gray/20 rounded"
            style={{ width: "100%", height: mvs(16) }}
          />
          <View
            className="bg-gray/20 rounded"
            style={{ width: "75%", height: mvs(16) }}
          />
          <View
            className="bg-gray/20 rounded"
            style={{ width: "83%", height: mvs(16) }}
          />
        </View>
      </View>

      {/* Collections Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(32) }}>
        <View
          className="bg-gray/20 rounded"
          style={{ width: s(96), height: mvs(20), marginBottom: mvs(12) }}
        />
        <View className="flex-row" style={{ gap: s(12) }}>
          {/* Collection 1 */}
          <View style={{ flex: 1, minWidth: 140, maxWidth: 180 }}>
            <View
              className="rounded-xl bg-gray/20"
              style={{ width: "100%", height: s(128), padding: s(8) }}
            />
            <View
              className="bg-gray/20 rounded"
              style={{ width: s(80), height: mvs(12), marginTop: mvs(8) }}
            />
          </View>
          {/* Create new collection skeleton */}
          <View
            className="rounded-xl border-2 border-dashed border-gray/40 items-center justify-center"
            style={{
              flex: 1,
              minWidth: 140,
              maxWidth: 180,
              padding: s(12),
              gap: mvs(8),
              height: s(128),
            }}
          >
            <View
              className="bg-gray/20 rounded"
              style={{ width: s(32), height: s(32) }}
            />
            <View
              className="bg-gray/20 rounded"
              style={{ width: s(80), height: mvs(12) }}
            />
          </View>
        </View>
      </View>

      {/* Body Parts Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(32), marginBottom: mvs(16) }}>
        <View className="flex-row items-center" style={{ marginBottom: mvs(12), gap: s(8) }}>
          <View
            className="bg-gray/20 rounded"
            style={{ width: s(16), height: s(16) }}
          />
          <View
            className="bg-gray/20 rounded"
            style={{ width: s(192), height: mvs(20) }}
          />
        </View>
        <View className="flex-row flex-wrap" style={{ gap: s(8) }}>
          <View
            className="bg-gray/20 rounded-full"
            style={{ width: s(64), height: mvs(24) }}
          />
          <View
            className="bg-gray/20 rounded-full"
            style={{ width: s(80), height: mvs(24) }}
          />
          <View
            className="bg-gray/20 rounded-full"
            style={{ width: s(56), height: mvs(24) }}
          />
          <View
            className="bg-gray/20 rounded-full"
            style={{ width: s(72), height: mvs(24) }}
          />
        </View>
      </View>
    </View>
  );
};
