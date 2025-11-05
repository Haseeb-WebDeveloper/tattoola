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
  TattooLoverSkeleton,
} from "@/components/profile";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchArtistSelfProfile,
  fetchTattooLoverSelfProfile,
  TattooLoverSelfProfile,
} from "@/services/profile.service";
import { ArtistSelfProfileInterface } from "@/types/artist";
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
  const [data, setData] = useState<
    ArtistSelfProfileInterface | TattooLoverSelfProfile | null
  >(null);

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
          const profile = await fetchTattooLoverSelfProfile(
            user.id,
            forceRefresh
          );
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
    router.push("/upload/media" as any);
  };

  // const handleCreateNewCollection = () => {
  //   router.push("/collection/new" as any);
  // };

  if (loading) {
    // Show appropriate skeleton based on user role
    if (user?.role === "TATTOO_LOVER") {
      return <TattooLoverSkeleton />;
    }
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
            className="rounded-full items-center justify-center"
            style={{ width: s(36), height: s(36), backgroundColor: "#AD2E2E" }}
          >
            <SVGIcons.Settings style={{ width: s(20), height: s(20) }} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <Banner
          banner={
            (data as ArtistSelfProfileInterface)?.artistProfile?.banner || []
          }
        />

        {/* Profile Header */}
        <ProfileHeader
          username={(data as ArtistSelfProfileInterface)?.user?.username || ""}
          firstName={(data as ArtistSelfProfileInterface)?.user?.firstName}
          lastName={(data as ArtistSelfProfileInterface)?.user?.lastName}
          avatar={(data as ArtistSelfProfileInterface)?.user?.avatar}
          businessName={
            (data as ArtistSelfProfileInterface)?.artistProfile?.businessName
          }
          municipality={
            (data as ArtistSelfProfileInterface)?.location?.municipality?.name
          }
          province={
            (data as ArtistSelfProfileInterface)?.location?.province?.name
          }
        />

        {/* Social Media Icons */}
        <SocialMediaIcons
          instagram={(data as ArtistSelfProfileInterface)?.user?.instagram}
          tiktok={(data as ArtistSelfProfileInterface)?.user?.tiktok}
          website={(data as ArtistSelfProfileInterface)?.user?.website}
          onInstagramPress={handleSocialMediaPress}
          onTiktokPress={handleSocialMediaPress}
          onWebsitePress={handleSocialMediaPress}
        />

        {/* Bio */}
        {!!(data as ArtistSelfProfileInterface)?.artistProfile?.bio && (
          <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueLight"
            >
              {(data as ArtistSelfProfileInterface).artistProfile.bio}
            </ScaledText>
          </View>
        )}

        {/* Styles Section */}
        <StylesSection
          styles={(data as ArtistSelfProfileInterface)?.favoriteStyles || []}
        />

        {/* Services Section */}
        <ServicesSection
          services={(data as ArtistSelfProfileInterface)?.services || []}
        />

        {/* Collections Section */}
        <CollectionsSection
          collections={(data as ArtistSelfProfileInterface)?.collections || []}
          onCreateNewCollection={handleCreateNewCollection}
        />

        {/* Body Parts Section */}
        <BodyPartsSection
          bodyParts={
            (data as ArtistSelfProfileInterface)?.bodyPartsNotWorkedOn || []
          }
        />
        <View style={{ height: mvs(90) }} />
      </ScrollView>
    </View>
  );
}
