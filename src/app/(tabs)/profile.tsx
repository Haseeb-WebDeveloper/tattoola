import {
  Banner,
  BodyPartsSection,
  CollectionsSection,
  ProfileHeader,
  ProfileSkeleton,
  ServicesSection,
  SocialMediaIcons,
  StylesSection,
  TattooLoverProfileView,
} from "@/components/profile";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  ArtistSelfProfile,
  fetchArtistSelfProfile,
  fetchTattooLoverSelfProfile,
  TattooLoverSelfProfile,
} from "@/services/profile.service";
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
  const [data, setData] = useState<ArtistSelfProfile | TattooLoverSelfProfile | null>(null);

  // Load profile with cache-first approach - role aware
  const loadProfile = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!user) return;
        
        // Fetch profile based on user role
        if (user.role === "ARTIST") {
          const profile = await fetchArtistSelfProfile(user.id, forceRefresh);
          setData(profile);
        } else if (user.role === "TATTOO_LOVER") {
          const profile = await fetchTattooLoverSelfProfile(user.id, forceRefresh);
          setData(profile);
        }
        
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    },
    [user?.id, user?.role]
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

  // Render Tattoo Lover Profile
  if (user?.role === "TATTOO_LOVER") {
    return (
      <View className="flex-1 bg-background">
       

        <TattooLoverProfileView
          data={data as TattooLoverSelfProfile}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </View>
    );
  }

  // Render Artist Profile (default)
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
        <Banner banner={(data as ArtistSelfProfile)?.artistProfile?.banner || []} />

        {/* Profile Header */}
        <ProfileHeader
          username={(data as ArtistSelfProfile)?.user?.username || ""}
          firstName={(data as ArtistSelfProfile)?.user?.firstName}
          lastName={(data as ArtistSelfProfile)?.user?.lastName}
          avatar={(data as ArtistSelfProfile)?.user?.avatar}
          businessName={(data as ArtistSelfProfile)?.artistProfile?.businessName}
          municipality={(data as ArtistSelfProfile)?.location?.municipality?.name}
          province={(data as ArtistSelfProfile)?.location?.province?.name}
        />

        {/* Social Media Icons */}
        <SocialMediaIcons
          instagram={(data as ArtistSelfProfile)?.user?.instagram}
          tiktok={(data as ArtistSelfProfile)?.user?.tiktok}
          website={(data as ArtistSelfProfile)?.user?.website}
          onInstagramPress={handleSocialMediaPress}
          onTiktokPress={handleSocialMediaPress}
          onWebsitePress={handleSocialMediaPress}
        />

        {/* Bio */}
        {!!(data as ArtistSelfProfile)?.artistProfile?.bio && (
          <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueLight"
            >
              {(data as ArtistSelfProfile).artistProfile.bio}
            </ScaledText>
          </View>
        )}

        {/* Styles Section */}
        <StylesSection styles={(data as ArtistSelfProfile)?.favoriteStyles || []} />

        {/* Services Section */}
        <ServicesSection services={(data as ArtistSelfProfile)?.services || []} />

        {/* Collections Section */}
        <CollectionsSection
          collections={(data as ArtistSelfProfile)?.collections || []}
          onCreateNewCollection={handleCreateNewCollection}
        />

        {/* Body Parts Section */}
        <BodyPartsSection bodyParts={(data as ArtistSelfProfile)?.bodyPartsNotWorkedOn || []} />
        <View style={{ height: mvs(90) }} />
      </ScrollView>
    </View>
  );
}
