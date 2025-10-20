import { mvs, s, scaledFont } from "@/utils/scale";
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
      <View className="bg-gray/20" style={{ height: mvs(200) }} />

      {/* Profile Header skeleton with rounded top */}
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
        <View className="flex-row items-center" style={{ gap: s(12) }}>
          {/* Avatar skeleton - now 92x92 */}
          <View
            className="rounded-full bg-gray/20"
            style={{ width: s(92), height: s(92) }}
          />
          <View className="flex-1">
            {/* Name skeleton - variant "20" (fontSize 20) */}
            <View className="flex-row items-center" style={{ marginBottom: mvs(2) }}>
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(140), height: scaledFont(20) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(20), height: s(20), marginLeft: s(4) }}
              />
            </View>
            {/* Username skeleton - variant "md" (fontSize 14) */}
            <View style={{ marginTop: mvs(2), marginBottom: mvs(3) }}>
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(100), height: scaledFont(14) }}
              />
            </View>
            {/* Studio skeleton - variant "md" (fontSize 14) */}
            <View className="flex-row items-center" style={{ marginBottom: mvs(3) }}>
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(20), height: s(20), marginRight: s(4) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(120), height: scaledFont(14) }}
              />
            </View>
            {/* Location skeleton - variant "md" (fontSize 14) */}
            <View className="flex-row items-center">
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(20), height: s(20), marginRight: s(4) }}
              />
              <View
                className="bg-gray/20 rounded"
                style={{ width: s(100), height: scaledFont(14) }}
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

      {/* Bio skeleton - variant "md" (fontSize 14) */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <View
          className="bg-gray/20 rounded"
          style={{ width: "100%", height: scaledFont(14), marginBottom: mvs(8) }}
        />
        <View
          className="bg-gray/20 rounded"
          style={{ width: "75%", height: scaledFont(14), marginBottom: mvs(8) }}
        />
        <View
          className="bg-gray/20 rounded"
          style={{ width: "50%", height: scaledFont(14) }}
        />
      </View>

      {/* Styles Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        {/* Title - variant "md" (fontSize 14) */}
        <View
          className="bg-gray/20 rounded"
          style={{ width: s(130), height: scaledFont(14), marginBottom: mvs(12) }}
        />
        {/* Style chips - variant "sm" (fontSize 12), gap s(3) */}
        <View className="flex-row flex-wrap" style={{ gap: s(3) }}>
          <View
            className="bg-gray/20 rounded-full"
            style={{
              width: s(70),
              height: scaledFont(12) + mvs(6), // fontSize 12 + padding vertical mvs(3) * 2
              paddingHorizontal: s(9),
            }}
          />
          <View
            className="bg-gray/20 rounded-full"
            style={{
              width: s(90),
              height: scaledFont(12) + mvs(6),
              paddingHorizontal: s(9),
            }}
          />
          <View
            className="bg-gray/20 rounded-full"
            style={{
              width: s(60),
              height: scaledFont(12) + mvs(6),
              paddingHorizontal: s(9),
            }}
          />
        </View>
      </View>

      {/* Services Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        {/* Title - variant "md" (fontSize 14) */}
        <View
          className="bg-gray/20 rounded"
          style={{ width: s(80), height: scaledFont(14), marginBottom: mvs(10) }}
        />
        {/* Service items - variant "sm" (fontSize 12) */}
        <View style={{ gap: mvs(8) }}>
          <View
            className="bg-gray/20 rounded"
            style={{ width: "100%", height: scaledFont(12) }}
          />
          <View
            className="bg-gray/20 rounded"
            style={{ width: "75%", height: scaledFont(12) }}
          />
          <View
            className="bg-gray/20 rounded"
            style={{ width: "83%", height: scaledFont(12) }}
          />
        </View>
      </View>

      {/* Collections Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(32) }}>
        {/* Title - variant "md" (fontSize 14) */}
        <View
          className="bg-gray/20 rounded"
          style={{ width: s(100), height: scaledFont(14), marginBottom: mvs(12) }}
        />
        <View className="flex-row" style={{ gap: s(12) }}>
          {/* Collection 1 */}
          <View style={{ flex: 1, minWidth: 140, maxWidth: 180 }}>
            <View
              className="rounded-xl bg-gray/20"
              style={{ width: "100%", height: s(128), padding: s(8) }}
            />
            {/* Collection name - variant "sm" (fontSize 12) */}
            <View
              className="bg-gray/20 rounded"
              style={{ width: s(80), height: scaledFont(12), marginTop: mvs(8) }}
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
              style={{ width: s(80), height: scaledFont(12) }}
            />
          </View>
        </View>
      </View>

      {/* Body Parts Section skeleton */}
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(32), marginBottom: mvs(16) }}>
        {/* Title - variant "lg" (fontSize 16) */}
        <View className="flex-row items-center" style={{ marginBottom: mvs(12), gap: s(8) }}>
          <View
            className="bg-gray/20 rounded"
            style={{ width: s(16), height: s(16) }}
          />
          <View
            className="bg-gray/20 rounded"
            style={{ width: s(220), height: scaledFont(16) }}
          />
        </View>
        {/* Body part chips - variant "9" (fontSize 9), gap s(2) */}
        <View className="flex-row flex-wrap" style={{ gap: s(2) }}>
          <View
            className="bg-gray/20 rounded-xl"
            style={{
              width: s(60),
              height: scaledFont(9) + mvs(6), // fontSize 9 + padding vertical mvs(3) * 2
              paddingHorizontal: s(8),
            }}
          />
          <View
            className="bg-gray/20 rounded-xl"
            style={{
              width: s(75),
              height: scaledFont(9) + mvs(6),
              paddingHorizontal: s(8),
            }}
          />
          <View
            className="bg-gray/20 rounded-xl"
            style={{
              width: s(55),
              height: scaledFont(9) + mvs(6),
              paddingHorizontal: s(8),
            }}
          />
          <View
            className="bg-gray/20 rounded-xl"
            style={{
              width: s(70),
              height: scaledFont(9) + mvs(6),
              paddingHorizontal: s(8),
            }}
          />
        </View>
      </View>
    </View>
  );
};
