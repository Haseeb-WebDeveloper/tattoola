import ScaledText from "@/components/ui/ScaledText";
import { TattooLoverProfile, toggleFollow } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";
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

export const TattooLoverOtherProfileView: React.FC<TattooLoverOtherProfileViewProps> = ({
  data,
  currentUserId,
  onRefresh,
  refreshing = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("my-tattoos");
  const [isFollowing, setIsFollowing] = useState(data.isFollowing || false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const handleFollowToggle = async () => {
    if (isTogglingFollow || !currentUserId) return;

    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);
    setIsTogglingFollow(true);

    try {
      const result = await toggleFollow(currentUserId, data.user.id);
      setIsFollowing(result.isFollowing);
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState);
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Follow button - positioned top-right */}
      {currentUserId && (
        <View
          className="absolute top-2 right-0 z-10"
          style={{ paddingHorizontal: s(16) }}
        >
          <TouchableOpacity
            onPress={handleFollowToggle}
            disabled={isTogglingFollow}
            className={`rounded-full items-center justify-center ${
              isFollowing ? "border border-gray" : "bg-primary"
            }`}
            style={{ paddingHorizontal: s(20), height: s(36) }}
          >
            <ScaledText
              allowScaling={false}
              variant="body4"
              className={isFollowing ? "text-foreground" : "text-white"}
              style={{ fontWeight: "500" }}
            >
              {isFollowing ? "Seguendo" : "Segui"}
            </ScaledText>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Profile Header */}
        <View style={{ paddingHorizontal: s(16), paddingTop: mvs(16) }}>
          <TattooLoverProfileHeader
            firstName={data.user.firstName}
            lastName={data.user.lastName}
            avatar={data.user.avatar}
            municipality={data.location?.municipality?.name}
            province={data.location?.province?.name}
            username={data.user.username}
            instagram={data.user.instagram}
            tiktok={data.user.tiktok}
          />
        </View>

        {/* Preferred Styles Section */}
        <PreferredStylesSection styles={data.favoriteStyles} />

        {/* Conditionally show tabs and content only if profile is public */}
        {data.user.isPublic ? (
          <>
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
    </View>
  );
};

