import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { TattooLoverProfile } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { FollowedArtistsList } from "./FollowedArtistsList";
import { FollowedTattooLoversList } from "./FollowedTattooLoversList";
import { PreferredStylesSection } from "./PreferredStylesSection";
import { ProfileTabId, ProfileTabNavigation } from "./ProfileTabNavigation";
import { TattooLoverProfileHeader } from "./TattooLoverProfileHeader";
import { TattooPostsGrid } from "./TattooPostsGrid";

interface TattooLoverOtherProfileViewProps {
  data: TattooLoverProfile;
  currentUserId?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const TattooLoverOtherProfileView: React.FC<
  TattooLoverOtherProfileViewProps
> = ({ data, currentUserId, onRefresh, refreshing = false }) => {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("my-tattoos");

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      horizontal={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#AD2E2E"
            colors={["#AD2E2E"]}
          />
        ) : undefined
      }
    >
      {/* Username Header */}
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
          className="rounded-full items-center justify-center"
          style={{
            width: s(32),
            height: s(32),
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
        </TouchableOpacity>

        {/* Username */}
        <ScaledText
          variant="md"
          className="text-foreground font-neueSemibold"
          style={{
            marginBottom: mvs(0),
          }}
        >
          @{data.user.username}
        </ScaledText>

        <View style={{ width: s(32), height: s(32) }} />
      </View>

      {/* Profile Header */}
      <View>
        <TattooLoverProfileHeader
          firstName={data.user.firstName}
          lastName={data.user.lastName}
          avatar={data.user.avatar}
          municipality={data.location?.municipality?.name}
          province={data.location?.province?.name}
          username={data.user.username}
          instagram={data.user.instagram}
          tiktok={data.user.tiktok}
          isOtherProfile={true}
          currentUserId={currentUserId}
          targetUserId={data.user.id}
          initialIsFollowing={data.isFollowing}
        />
      </View>

      {/* Preferred Styles Section */}
      <PreferredStylesSection styles={data.favoriteStyles} />

      {/* Conditionally show tabs and content only if profile is public */}
      {data.user.isPublic ? (
        <>
          {/* Tab Navigation */}
          <ProfileTabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOwnProfile={false}
          />

          {/* Content - Conditional based on active tab */}
          {activeTab === "my-tattoos" && <TattooPostsGrid posts={data.posts} />}
          {activeTab === "liked" && <TattooPostsGrid posts={data.likedPosts} />}
          {activeTab === "artists-you-follow" && (
            <FollowedArtistsList artists={data.followedArtists} />
          )}
          {activeTab === "tattoolers" && (
            <FollowedTattooLoversList
              tattooLovers={data.followedTattooLovers}
            />
          )}
        </>
      ) : (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: mvs(60),
            paddingHorizontal: s(16),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-gray text-center"
          >
            Questo profilo è privato
          </ScaledText>
        </View>
      )}

      {/* Bottom Spacer for tab bar */}
      <View style={{ height: mvs(100) }} />
    </ScrollView>
  );
};
