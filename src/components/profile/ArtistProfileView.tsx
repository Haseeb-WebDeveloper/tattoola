import {
  Banner,
  BodyPartsSection,
  CollectionsSection,
  ProfileHeader,
  ServicesSection,
  SocialMediaIcons,
  StylesSection,
} from "@/components/profile";
import { toggleFollow } from "@/services/profile.service";
import { ArtistSelfProfileInterface } from "@/types/artist";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ArtistProfileViewProps {
  data: ArtistSelfProfileInterface & { isFollowing?: boolean };
  currentUserId?: string;
}

export const ArtistProfileView: React.FC<ArtistProfileViewProps> = ({
  data,
  currentUserId,
}) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(data.isFollowing || false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const handleSocialMediaPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

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
      {/* {currentUserId && (
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
      )} */}

      <ScrollView
        className="relative"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Banner */}
        <Banner banner={data?.artistProfile?.banner || []} />

        {/* Profile Header */}
        <ProfileHeader
          username={data?.user?.username}
          firstName={data?.user?.firstName}
          lastName={data?.user?.lastName}
          avatar={data?.user?.avatar}
          businessName={data?.artistProfile?.businessName}
          municipality={data?.location?.municipality?.name}
          province={data?.location?.province?.name}
        />

        {/* Social Media Icons */}
        <SocialMediaIcons
          instagram={data?.user?.instagram}
          tiktok={data?.user?.tiktok}
          website={data?.user?.website}
          onInstagramPress={handleSocialMediaPress}
          onTiktokPress={handleSocialMediaPress}
          onWebsitePress={handleSocialMediaPress}
        />

        {/* Bio */}
        {!!data?.artistProfile?.bio && (
          <View className="px-4 mt-6">
            <Text className="text-foreground font-neueLight">
              {data.artistProfile.bio}
            </Text>
          </View>
        )}

        {/* Styles Section */}
        <StylesSection styles={data?.favoriteStyles || []} />

        {/* Services Section */}
        <ServicesSection services={data?.services || []} />

        {/* Collections Section */}
        <CollectionsSection
          collections={data?.collections || []}
          showNewCollection={false}
        />

        {/* Body Parts Section */}
        <BodyPartsSection bodyParts={data?.bodyPartsNotWorkedOn || []} />

        {/* Bottom actions */}
        <View className="bg-background px-4 py-3">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleFollowToggle}
              disabled={isTogglingFollow}
              className={`flex-1 h-12 rounded-full items-center justify-center ${
                isFollowing ? "border border-gray" : "border border-gray"
              }`}
            >
              <Text className="text-foreground font-neueMedium">
                {isFollowing ? "Seguendo" : "Segui"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                data?.user?.id
                  ? router.push(`/user/${data.user.id}/request/size` as any)
                  : null
              }
              className="flex-1 h-12 rounded-full bg-primary items-center justify-center"
            >
              <Text className="text-white font-neueMedium">
                Invia richiesta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
