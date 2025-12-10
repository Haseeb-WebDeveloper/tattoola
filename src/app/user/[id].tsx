import {
  ArtistProfileView,
  ProfileSkeleton,
  TattooLoverOtherProfileView,
  TattooLoverSkeleton,
} from "@/components/profile";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchArtistProfile,
  fetchTattooLoverProfile,
  TattooLoverProfile,
} from "@/services/profile.service";
import { ArtistSelfProfileInterface } from "@/types/artist";
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

  const loadProfile = async () => {
    try {
      if (!id) return;

      // First, get user role to determine which profile to fetch
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", String(id))
        .single();

      if (userError) throw new Error(userError.message);
      if (!userData) throw new Error("Utente non trovato");

      const role = userData.role as "ARTIST" | "TATTOO_LOVER";
      setUserRole(role);

      let profile;
      if (role === "ARTIST") {
        profile = await fetchArtistProfile(String(id), currentUser?.id);
      } else {
        profile = await fetchTattooLoverProfile(String(id), currentUser?.id);
      }

      setData(profile);
    } catch (e: any) {
      setError(e?.message || "Impossibile caricare il profilo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id, currentUser?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
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
