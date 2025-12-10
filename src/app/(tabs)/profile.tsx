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
import { DISPLAY_NAME_AR } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchArtistSelfProfile,
  fetchTattooLoverSelfProfile,
  TattooLoverSelfProfile,
} from "@/services/profile.service";
import { ArtistSelfProfileInterface } from "@/types/artist";
import { WorkArrangement } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    ArtistSelfProfileInterface | TattooLoverSelfProfile | null
  >(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

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
        setDisplayName(null);
      } catch (e: any) {
        const errorMessage =
          e?.message || "Caricamento del profilo non riuscito";
        const errorCode = e?.code || e?.error?.code;

        // Check if error is "Cannot coerce the result to a single JSON object" or similar
        // This happens when .single() is called but no rows are found (user doesn't exist in database)
        const isUserNotFoundError =
          errorCode === "PGRST116" ||
          errorMessage.includes("Cannot coerce") ||
          errorMessage.includes("JSON object") ||
          errorMessage.includes("multiple (or no) rows returned");

        if (isUserNotFoundError) {
          // User not found in database, check auth user metadata for displayName
          try {
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser();

            if (authUser) {
              const displayNameValue =
                (authUser as any).user_metadata?.displayName || null;
              setDisplayName(displayNameValue);
              setError(null); // Clear error since we'll show registration button
            } else {
              setError(errorMessage);
            }
          } catch (authError) {
            setError(errorMessage);
          }
        } else {
          setError(errorMessage);
        }
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

  // Show registration button if user not found and we have displayName
  if (!error && displayName) {
    const isArtist = displayName === DISPLAY_NAME_AR;
    const registrationPath = isArtist
      ? "/(auth)/artist-registration/step-3"
      : "/(auth)/user-registration/step-3";

    return (
      <View className="items-center justify-center flex-1 bg-background">
        <View style={{ paddingHorizontal: s(24), alignItems: "center" }}>
          <ScaledText
            allowScaling={false}
            variant="body1"
            className="text-center text-foreground font-neueLight"
            style={{ marginBottom: mvs(16) }}
          >
            Completa la registrazione per visualizzare il tuo profilo.
          </ScaledText>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => router.push(registrationPath as any)}
            className="items-center justify-center"
            style={{
              backgroundColor: "#AD2E2E",
              paddingHorizontal: s(28),
              paddingVertical: mvs(10),
              borderRadius: s(100),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="body1"
              className="text-white font-neueSemibold"
            >
              Completa la registrazione
            </ScaledText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center flex-1 bg-background">
        <ScaledText
          allowScaling={false}
          variant="body1"
          className="text-center text-foreground"
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
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#AD2E2E"
            colors={["#AD2E2E"]}
          />
        }
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="z-10 "
          style={{
            paddingHorizontal: s(12),
            paddingVertical: mvs(12),
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderRadius: s(100),
            position: "absolute",
            top: mvs(8),
            left: s(16),
            zIndex: 10,
          }}
        >
          <SVGIcons.ChevronLeft width={s(14)} height={s(14)} />
        </TouchableOpacity>

        {/* settings button */}
        <View
          className="absolute right-0 z-10"
          style={{ paddingHorizontal: s(16), top: mvs(8) }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/settings" as any)}
            className="items-center justify-center rounded-full"
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
        {(() => {
          const artistData = data as ArtistSelfProfileInterface;
          return (
            <ProfileHeader
              username={artistData?.user?.username || ""}
              firstName={artistData?.user?.firstName}
              lastName={artistData?.user?.lastName}
              avatar={artistData?.user?.avatar}
              businessName={artistData?.artistProfile?.businessName}
              municipality={artistData?.location?.municipality?.name}
              province={artistData?.location?.province?.name}
              workArrangement={
                artistData?.artistProfile?.workArrangement as WorkArrangement
              }
            />
          );
        })()}

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
