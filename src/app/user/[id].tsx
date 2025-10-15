import {
  Banner,
  BodyPartsSection,
  CollectionsSection,
  ProfileHeader,
  ProfileSkeleton,
  ServicesSection,
  SocialMediaIcons,
  StylesSection,
} from "@/components/profile";
import { fetchArtistSelfProfile } from "@/services/profile.service";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        const profile = await fetchArtistSelfProfile(String(id));
        if (mounted) setData(profile);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSocialMediaPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground text-center px-6">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="relative"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Banner */}
        <Banner banner={data?.artistProfile?.banner || []} />

        {/* Profile Header */}
        <ProfileHeader
          firstName={data?.user?.firstName}
          lastName={data?.user?.lastName}
          avatar={data?.user?.avatar}
          businessName={data?.artistProfile?.businessName}
          municipality={
            data?.artistProfile?.municipality || data?.user?.municipality
          }
          province={data?.artistProfile?.province || data?.user?.province}
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
            <Text className="text-foreground tat-body-2-light">
              {data.artistProfile.bio}
            </Text>
          </View>
        )}

        {/* Styles Section */}
        <StylesSection styles={data?.favoriteStyles || []} />

        {/* Services Section */}
        <ServicesSection services={data?.services || []} />

        {/* Collections Section */}
        <CollectionsSection collections={data?.collections || []} />

        {/* Body Parts Section */}
        <BodyPartsSection bodyParts={data?.bodyPartsNotWorkedOn || []} />
        
        {/* Bottom actions */}
        <View className="bg-background px-4 py-3">
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 h-12 rounded-full border border-gray items-center justify-center">
              <Text className="text-foreground font-medium">Segui</Text>
            </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (id ? (require("expo-router").router.push(`/user/${id}/request/size` as any)) : null)}
            className="flex-1 h-12 rounded-full bg-primary items-center justify-center"
          >
            <Text className="text-white font-medium">Invia richiesta</Text>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
