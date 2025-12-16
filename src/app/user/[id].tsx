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
  fetchUserSummaryCached,
  TattooLoverProfile,
} from "@/services/profile.service";
import { ArtistSelfProfileInterface } from "@/types/artist";
import { UserSummary } from "@/types/auth";
import { StudioSearchResult, ArtistProfileSummary } from "@/types/search";
import { getProfileFromCache } from "@/utils/database";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function UserProfileScreen() {
  const { id, initialUser: initialUserParam, initialArtist: initialArtistParam } = useLocalSearchParams<{
    id: string;
    initialUser?: string;
    initialArtist?: string;
  }>();
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
  const [summary, setSummary] = useState<UserSummary | null>(null);

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
    let cancelled = false;

    const bootstrap = async () => {
      if (!id) return;
      const idStr = String(id);
      const t0 = Date.now();

      // 1) Try initialUser param
      let initial: UserSummary | null = null;
      if (initialUserParam) {
        try {
          initial = JSON.parse(initialUserParam) as UserSummary;
          console.log(
            `[User] summary render ready from params for ${idStr} in ${
              Date.now() - t0
            }ms`
          );
        } catch (e) {
          console.error("Failed to parse initialUser param:", e);
        }
      }

      // 2) If initialUser exists but missing role, fetch summary to get role
      if (initial && !initial.role) {
        try {
          const cached = await fetchUserSummaryCached(idStr);
          if (cached && cached.role) {
            // Merge: use initialUser data but get role from cache
            initial = { ...initial, role: cached.role };
          }
        } catch (e) {
          // best-effort
        }
      }

      // 3) Fallback to summary cache if no initialUser
      if (!initial) {
        try {
          const cached = await fetchUserSummaryCached(idStr);
          if (cached) {
            initial = cached;
            console.log(
              `[User] summary render ready from cache for ${idStr} in ${
                Date.now() - t0
              }ms`
            );
          }
        } catch (e) {
          // best-effort
        }
      }

      // 3) If we have a summary and user is a tattoo lover, build a light profile
      if (!cancelled && initial) {
        setSummary(initial);

        if (initial.role === "TATTOO_LOVER") {
          const lightProfile: TattooLoverProfile = {
            user: {
              id: initial.id,
              username: initial.username || "",
              firstName: initial.firstName || undefined,
              lastName: initial.lastName || undefined,
              avatar: initial.avatar || undefined,
              instagram: undefined,
              tiktok: undefined,
              isPublic: true,
            },
            location:
              initial.city || initial.province
                ? {
                    municipality: { name: initial.city || "" },
                    province: { name: initial.province || "" },
                  }
                : undefined,
            favoriteStyles: [],
            posts: [],
            likedPosts: [],
            followedArtists: [],
            followedTattooLovers: [],
            isFollowing: false,
          };

          setData(lightProfile);
          setUserRole("TATTOO_LOVER");
          setLoading(false);
        } else if (initial.role === "ARTIST") {
          // Parse initialArtist if available (from search)
          let artistSummary: ArtistProfileSummary | null = null;
          if (initialArtistParam) {
            try {
              artistSummary = JSON.parse(initialArtistParam) as ArtistProfileSummary;
            } catch (e) {
              console.error("Failed to parse initialArtist param:", e);
            }
          }

          // Use banner from initialArtist if available, otherwise fetch it
          let banner: { mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; order: number }[] = [];
          if (artistSummary?.bannerMedia && artistSummary.bannerMedia.length > 0) {
            // Use banner from search result (already available)
            banner = artistSummary.bannerMedia.slice(0, 2); // Limit to 1-2 items
          } else {
            // Fallback: fetch minimal banner if not in initialArtist
            try {
              const { data: artistProfile } = await supabase
                .from("artist_profiles")
                .select("id")
                .eq("userId", initial.id)
                .single();

              if (artistProfile) {
                const { data: bannerMedia } = await supabase
                  .from("artist_banner_media")
                  .select("mediaUrl, mediaType, order")
                  .eq("artistId", artistProfile.id)
                  .order("order", { ascending: true })
                  .limit(2);

                if (bannerMedia) {
                  banner = bannerMedia.map((m: any) => ({
                    mediaType: m.mediaType,
                    mediaUrl: m.mediaUrl,
                    order: m.order,
                  }));
                }
              }
            } catch (e) {
              // Banner fetch is best-effort, continue without it
            }
          }

          // Build rich artist profile from summary + initialArtist for instant render
          const lightArtistProfile: ArtistSelfProfileInterface & {
            isFollowing?: boolean;
          } = {
            user: {
              id: initial.id,
              email: "", // Will be filled by full fetch
              username: initial.username || "",
              firstName: initial.firstName || undefined,
              lastName: initial.lastName || undefined,
              avatar: initial.avatar || undefined,
              instagram: undefined,
              tiktok: undefined,
              website: undefined,
            },
            artistProfile: {
              id: "", // Will be filled by full fetch
              businessName: artistSummary?.businessName || undefined,
              bio: artistSummary?.bio || undefined, // Use bio from summary if available
              workArrangement: artistSummary?.workArrangement || undefined,
              yearsExperience: artistSummary?.yearsExperience || undefined,
              banner: banner,
            },
            location:
              artistSummary?.location
                ? {
                    id: "", // Will be filled by full fetch
                    address: artistSummary.location.address || undefined,
                    province: {
                      id: "",
                      name: artistSummary.location.province || "",
                      code: undefined,
                    },
                    municipality: {
                      id: "",
                      name: artistSummary.location.municipality || "",
                    },
                    isPrimary: true,
                  }
                : initial.city || initial.province
                  ? {
                      id: "", // Will be filled by full fetch
                      address: undefined,
                      province: {
                        id: "",
                        name: initial.province || "",
                        code: undefined,
                      },
                      municipality: {
                        id: "",
                        name: initial.city || "",
                      },
                      isPrimary: true,
                    }
                  : undefined,
            favoriteStyles: artistSummary?.styles || [], // Use styles from search
            services: [], // Will be loaded later
            collections: [], // Will be loaded later
            bodyPartsNotWorkedOn: [], // Will be loaded later
            isFollowing: false, // Will be fetched
          };

          console.log("🔍 Light artist profile:", lightArtistProfile);
          setData(lightArtistProfile);
          setUserRole("ARTIST");
          setLoading(false);
          console.log(
            `[User] artist summary render ready for ${idStr} in ${
              Date.now() - t0
            }ms (withArtistData=${!!artistSummary})`
          );
        }
      }

      // 4) Hydrate full profile (cache-first) in background
      await loadProfile();
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [id, initialUserParam, initialArtistParam, currentUser?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile({ forceRefresh: true });
  };

  if (loading && !data) {
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
