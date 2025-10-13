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
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchArtistSelfProfile } from "@/services/profile.service";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const profile = await fetchArtistSelfProfile(user.id);
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
  }, [user?.id]);

  // Refresh profile data whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          if (!user) return;
          const profile = await fetchArtistSelfProfile(user.id);
          if (active) {
            setData(profile);
            setError(null);
          }
        } catch (e: any) {
          if (active) setError(e?.message || "Failed to load profile");
        }
      })();
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  const handleSocialMediaPress = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const handleCreateNewCollection = () => {
    router.push("/collection/new" as any);
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
      <ScrollView className="relative" showsVerticalScrollIndicator={false}>
        {/* settings button */}
        <View className="px-4 absolute top-2 right-0 z-10">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push('/settings' as any)}
            className="w-9 h-9 rounded-full bg-primary items-center justify-center"
          >
            <SVGIcons.Settings className="w-5 h-5" />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <Banner banner={data?.artistProfile?.banner || []} />

        {/* Profile Header */}
        <ProfileHeader
          firstName={data?.user?.firstName}
          lastName={data?.user?.lastName}
          avatar={data?.user?.avatar}
          businessName={data?.artistProfile?.businessName}
          municipality={data?.artistProfile?.municipality || data?.user?.municipality}
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
            <Text className="text-foreground tat-body-2-light">{data.artistProfile.bio}</Text>
          </View>
        )}

        {/* Styles Section */}
        <StylesSection styles={data?.favoriteStyles || []} />

        {/* Services Section */}
        <ServicesSection services={data?.services || []} />

        {/* Collections Section */}
        <CollectionsSection
          collections={data?.collections || []}
          onCreateNewCollection={handleCreateNewCollection}
        />

        {/* Body Parts Section */}
        <BodyPartsSection bodyParts={data?.bodyPartsNotWorkedOn || []} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}
