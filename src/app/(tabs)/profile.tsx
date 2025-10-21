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
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchArtistSelfProfile } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Load profile with cache-first approach
  const loadProfile = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!user) return;
        
        const profile = await fetchArtistSelfProfile(user.id, forceRefresh);
        setData(profile);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Initial load - use cache for instant display
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      await loadProfile(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, loadProfile]);

  // Refresh profile data whenever this screen gains focus (background sync)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!user || !active) return;
        // Use cache-first but trigger background sync if stale
        await loadProfile(false);
      })();
      return () => {
        active = false;
      };
    }, [user?.id, loadProfile])
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile(true); // Force refresh from Supabase
    setRefreshing(false);
  }, [loadProfile]);

  const handleSocialMediaPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
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
        <ScaledText
          allowScaling={false}
          variant="body1"
          className="text-foreground text-center"
          style={{ paddingHorizontal: s(24) }}
        >
          {error}
        </ScaledText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="relative"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#AD2E2E"
            colors={["#AD2E2E"]}
          />
        }
      >
        {/* settings button */}
        <View
          className="absolute top-2 right-0 z-10"
          style={{ paddingHorizontal: s(16) }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/settings" as any)}
            className="rounded-full bg-primary items-center justify-center"
            style={{ width: s(36), height: s(36) }}
          >
            <SVGIcons.Settings style={{ width: s(20), height: s(20) }} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <Banner banner={data?.artistProfile?.banner || []} />

        {/* Profile Header */}
        <ProfileHeader
          username={data?.user?.username || ""}
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
          <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueLight"
            >
              {data.artistProfile.bio}
            </ScaledText>
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
        <View style={{ height: mvs(90) }} />
      </ScrollView>
    </View>
  );
}
