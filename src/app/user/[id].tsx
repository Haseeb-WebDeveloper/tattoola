import {
  ArtistProfileView,
  ProfileSkeleton,
  TattooLoverOtherProfileView,
  TattooLoverSkeleton,
} from "@/components/profile";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchArtistProfile,
  fetchStudioForArtistProfile,
  fetchTattooLoverProfile,
  TattooLoverProfile,
} from "@/services/profile.service";
import { ArtistSelfProfileInterface } from "@/types/artist";
import { StudioSearchResult } from "@/types/search";
import { getProfileFromCache } from "@/utils/database";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    | (ArtistSelfProfileInterface & { isFollowing?: boolean })
    | TattooLoverProfile
    | null
  >(null);
  const [userRole, setUserRole] = useState<"ARTIST" | "TATTOO_LOVER" | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [studioData, setStudioData] = useState<StudioSearchResult | null>(
    null
  );

  const loadProfile = async (options?: { forceRefresh?: boolean }) => {
    const t0 = Date.now();
    let cacheHit = false;
    let shouldFetchFromNetwork = true;

    try {
      if (!id) return;

      const idStr = String(id);

      // 1) Try cache first for instant display (self or other profile)
      try {
        const cachedProfile =
          (await getProfileFromCache(idStr)) ||
          (await getProfileFromCache(`other-${idStr}`));

        if (cachedProfile) {
          cacheHit = true;
          setData(cachedProfile);

          // Infer role from cached data structure
          if ("artistProfile" in cachedProfile) {
            setUserRole("ARTIST");
          } else {
            setUserRole("TATTOO_LOVER");
          }

          // If we were showing a skeleton, stop it once we have cached data
          setLoading(false);

          const tCache = Date.now() - t0;
          console.log(
            `[Profile] Cache hit for user ${idStr} in ${tCache}ms`
          );
        }
      } catch {
        // Cache is a best-effort optimization – ignore errors
      }

      // If we have cache and we're not explicitly forcing a refresh,
      // skip the network fetch to avoid duplicate heavy calls.
      if (cacheHit && !options?.forceRefresh) {
        shouldFetchFromNetwork = false;
      }

      if (!shouldFetchFromNetwork) {
        return;
      }

      // 2) Fetch role (and artist profile id, if any) in a single round-trip
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          role,
          artist_profiles(id)
        `
        )
        .eq("id", idStr)
        .single();

      if (userError) throw new Error(userError.message);
      if (!userData) throw new Error("Utente non trovato");

      const role = userData.role as "ARTIST" | "TATTOO_LOVER";
      setUserRole(role);

      // artist_profiles can be an array or single object depending on Supabase typing
      const artistProfiles: any = userData.artist_profiles;
      const artistProfileId =
        Array.isArray(artistProfiles) && artistProfiles.length > 0
          ? artistProfiles[0]?.id
          : artistProfiles?.id ?? null;

      // 3) Fetch profile + studio data (if artist)
      let profile;
      if (role === "ARTIST") {
        const [artistProfile, studio] = await Promise.all([
          fetchArtistProfile(idStr, currentUser?.id),
          artistProfileId
            ? fetchStudioForArtistProfile(artistProfileId)
            : Promise.resolve(null),
        ]);
        profile = artistProfile;
        setStudioData(studio);
      } else {
        profile = await fetchTattooLoverProfile(idStr, currentUser?.id);
        setStudioData(null);
      }

      setData(profile);
    } catch (e: any) {
      setError(e?.message || "Impossibile caricare il profilo");
    } finally {
      // Only hide the skeleton on first load; subsequent refreshes rely on pull-to-refresh UI
      setLoading(false);
      setRefreshing(false);

      const total = Date.now() - t0;
      console.log(
        `[Profile] loadProfile completed for user ${String(
          id
        )} in ${total}ms (cacheHit=${cacheHit})`
      );
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id, currentUser?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile({ forceRefresh: true });
  };

  if (loading) {
    // Show appropriate skeleton based on user role (if known)
    if (userRole === "TATTOO_LOVER") {
      return <TattooLoverSkeleton />;
    }
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground text-center px-6">{error}</Text>
      </View>
    );
  }

  // Render based on user role
  if (userRole === "ARTIST") {
    // data in json format
    // console.log("data", JSON.stringify(data, null, 2));
    return (
      <ArtistProfileView
        data={data as ArtistSelfProfileInterface & { isFollowing?: boolean }}
        currentUserId={currentUser?.id}
        studio={studioData}
      />
    );
  } else {
    return (
      <TattooLoverOtherProfileView
        data={data as TattooLoverProfile}
        currentUserId={currentUser?.id}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    );
  }
}
