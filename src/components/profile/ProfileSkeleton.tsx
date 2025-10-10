import React from 'react';
import { View } from 'react-native';

export const ProfileSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-background">
      {/* Edit button skeleton */}
      <View className="px-4 absolute top-2 right-0 z-10">
        <View className="w-9 h-9 rounded-full bg-gray/20" />
      </View>

      {/* Banner skeleton */}
      <View className="h-48 bg-gray/20" />

      {/* Profile Header skeleton */}
      <View className="px-4 mt-6">
        <View className="flex-row items-center gap-3">
          {/* Avatar skeleton */}
          <View className="w-20 h-20 rounded-full bg-gray/20" />
          <View className="flex-1">
            {/* Name skeleton */}
            <View className="flex-row items-center mb-2">
              <View className="w-32 h-6 bg-gray/20 rounded" />
              <View className="w-5 h-5 bg-gray/20 rounded ml-1" />
            </View>
            {/* Studio skeleton */}
            <View className="flex-row items-center mb-2">
              <View className="w-4 h-4 bg-gray/20 rounded mr-1" />
              <View className="w-24 h-4 bg-gray/20 rounded" />
            </View>
            {/* Location skeleton */}
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-gray/20 rounded mr-1" />
              <View className="w-20 h-4 bg-gray/20 rounded" />
            </View>
          </View>
        </View>
      </View>

      {/* Social Media Icons skeleton */}
      <View className="px-4 mt-4 flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full bg-gray/20" />
        <View className="w-12 h-12 rounded-full bg-gray/20" />
        <View className="w-12 h-12 rounded-full bg-gray/20" />
      </View>

      {/* Bio skeleton */}
      <View className="px-4 mt-6">
        <View className="w-full h-4 bg-gray/20 rounded mb-2" />
        <View className="w-3/4 h-4 bg-gray/20 rounded mb-2" />
        <View className="w-1/2 h-4 bg-gray/20 rounded" />
      </View>

      {/* Styles Section skeleton */}
      <View className="px-4 mt-6">
        <View className="w-32 h-5 bg-gray/20 rounded mb-3" />
        <View className="flex-row flex-wrap gap-2">
          <View className="w-20 h-8 bg-gray/20 rounded-full" />
          <View className="w-24 h-8 bg-gray/20 rounded-full" />
          <View className="w-16 h-8 bg-gray/20 rounded-full" />
        </View>
      </View>

      {/* Services Section skeleton */}
      <View className="px-4 mt-6">
        <View className="w-20 h-5 bg-gray/20 rounded mb-3" />
        <View className="gap-2">
          <View className="w-full h-4 bg-gray/20 rounded" />
          <View className="w-3/4 h-4 bg-gray/20 rounded" />
          <View className="w-5/6 h-4 bg-gray/20 rounded" />
        </View>
      </View>

      {/* Collections Section skeleton */}
      <View className="px-4 mt-8">
        <View className="w-24 h-5 bg-gray/20 rounded mb-3" />
        <View className="flex-row gap-3">
          {/* Collection 1 */}
          <View className="flex-1 min-w-[140px] max-w-[180px]">
            <View className="rounded-xl bg-gray/20 p-2 flex-1 w-full h-32" />
            <View className="w-20 h-3 bg-gray/20 rounded mt-2" />
          </View>
          {/* Collection 2 */}
          <View className="flex-1 min-w-[140px] max-w-[180px]">
            <View className="rounded-xl bg-gray/20 p-2 flex-1 w-full h-32" />
            <View className="w-24 h-3 bg-gray/20 rounded mt-2" />
          </View>
          {/* Create new collection skeleton */}
          <View className="rounded-xl border-2 border-dashed border-gray/40 p-3 flex-1 min-w-[140px] max-w-[180px] items-center justify-center gap-2">
            <View className="w-8 h-8 bg-gray/20 rounded" />
            <View className="w-20 h-3 bg-gray/20 rounded" />
          </View>
        </View>
      </View>

      {/* Body Parts Section skeleton */}
      <View className="px-4 mt-8 mb-4">
        <View className="flex-row items-center mb-3 gap-2">
          <View className="w-4 h-4 bg-gray/20 rounded" />
          <View className="w-48 h-5 bg-gray/20 rounded" />
        </View>
        <View className="flex-row flex-wrap gap-2">
          <View className="w-16 h-6 bg-gray/20 rounded-full" />
          <View className="w-20 h-6 bg-gray/20 rounded-full" />
          <View className="w-14 h-6 bg-gray/20 rounded-full" />
          <View className="w-18 h-6 bg-gray/20 rounded-full" />
        </View>
      </View>
    </View>
  );
};
