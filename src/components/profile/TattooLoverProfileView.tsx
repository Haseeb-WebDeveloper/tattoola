import { TattooLoverSelfProfile } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { ScaledText } from "../ui/ScaledText";
import { FollowedArtistsList } from "./FollowedArtistsList";
import { FollowedTattooLoversList } from "./FollowedTattooLoversList";
import { PreferredStylesSection } from "./PreferredStylesSection";
import { ProfileTabNavigation } from "./ProfileTabNavigation";
import { TattooLoverProfileHeader } from "./TattooLoverProfileHeader";
import { TattooPostsGrid } from "./TattooPostsGrid";

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
        className="bg-background w-full flex items-center justify-center"
        style={{
          height: s(120),
        }}
      >
        <ScaledText
          variant="md"
          className="text-foreground font-light"
        >
         @{data.user.username}
        </ScaledText>
      </View>

      {/* Profile Header - Overlapping the banner */}
      <View style={{ marginTop: -mvs(40) }}>
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
      {activeTab === "artists-you-follow" && <FollowedArtistsList artists={data.followedArtists} />}
      {activeTab === "tattoolers" && <FollowedTattooLoversList tattooLovers={data.followedTattooLovers} />}

      {/* Bottom Spacer for tab bar */}
      <View style={{ height: mvs(100) }} />
    </ScrollView>
  );
};
