import { TattooLoverSelfProfile } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { ScaledText } from "../ui/ScaledText";
import { FollowedArtistsList } from "./FollowedArtistsList";
import { FollowedTattooLoversList } from "./FollowedTattooLoversList";
import { PreferredStylesSection } from "./PreferredStylesSection";
import { ProfileTabNavigation } from "./ProfileTabNavigation";
import { TattooLoverProfileHeader } from "./TattooLoverProfileHeader";
import { TattooPostsGrid } from "./TattooPostsGrid";
import { SVGIcons } from "@/constants/svg";
import { router } from "expo-router";

interface TattooLoverProfileViewProps {
  data: TattooLoverSelfProfile | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export const TattooLoverProfileView: React.FC<TattooLoverProfileViewProps> = ({
  data,
  refreshing,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<
    "my-tattoos" | "liked" | "artists-you-follow" | "tattoolers"
  >("my-tattoos");

  if (!data) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#AD2E2E"
          colors={["#AD2E2E"]}
        />
      }
    >
      {/* Username */}
      <View
        className="flex-row w-full items-center justify-between"
        style={{
          height: s(80),
          paddingHorizontal: s(16),
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          className="rounded-full bg-foreground/20 items-center justify-center"
          style={{ width: s(32), height: s(32) }}
        >
          <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
        </TouchableOpacity>
        <ScaledText
          variant="md"
          className="text-foreground font-bold"
          style={{
            marginBottom: mvs(0),
          }}
        >
          Your Profile
        </ScaledText>
        {/* Settings button */}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push("/settings" as any)}
          className="rounded-full bg-primary items-center justify-center"
          style={{ width: s(32), height: s(32) }}
        >
          <SVGIcons.Settings style={{ width: s(20), height: s(20) }} />
        </TouchableOpacity>
      </View>

      {/* Profile Header - Overlapping the banner */}
      <View>
        <TattooLoverProfileHeader
          firstName={data.user.firstName}
          lastName={data.user.lastName}
          avatar={data.user.avatar}
          username={data.user.username}
          municipality={data.location?.municipality?.name}
          province={data.location?.province?.name}
          instagram={data.user.instagram}
          tiktok={data.user.tiktok}
        />
      </View>

      {/* Preferred Styles Section */}
      <PreferredStylesSection styles={data.favoriteStyles} />

      {/* Tab Navigation */}
      <ProfileTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content - Conditional based on active tab */}
      {activeTab === "my-tattoos" && <TattooPostsGrid posts={data.posts} />}
      {activeTab === "liked" && <TattooPostsGrid posts={data.likedPosts} />}
      {activeTab === "artists-you-follow" && (
        <FollowedArtistsList artists={data.followedArtists} />
      )}
      {activeTab === "tattoolers" && (
        <FollowedTattooLoversList tattooLovers={data.followedTattooLovers} />
      )}

      {/* Bottom Spacer for tab bar */}
      <View style={{ height: mvs(100) }} />
    </ScrollView>
  );
};
