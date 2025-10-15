import { fetchArtistSelfProfile } from "@/services/profile.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = { title: string; stepIndex: number; totalSteps: number };

export default function RequestHeader({ title, stepIndex, totalSteps }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const p = await fetchArtistSelfProfile(String(id));
        if (mounted) setProfile(p);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <View>
      <View className="px-4 pt-6 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-foreground/10 items-center justify-center mb-3"
        >
          <Text className="text-foreground text-lg">×</Text>
        </TouchableOpacity>
        <Text className="text-foreground tat-body-1 font-neueBold">{title}</Text>
        {profile && (
          <View className="flex-row items-center mt-4">
            <Image
              source={{ uri: profile?.user?.avatar || "https://via.placeholder.com/64" }}
              className="w-[64px] h-[64px] rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className="text-foreground tat-body-1 font-neueBold">
                {profile?.user?.firstName} {profile?.user?.lastName}
              </Text>
              {!!profile?.artistProfile?.businessName && (
                <Text className="text-foreground/80">{profile.artistProfile.businessName}</Text>
              )}
              <Text className="text-foreground/80">
                {profile?.artistProfile?.municipality || profile?.user?.municipality}
                {profile?.artistProfile?.province || profile?.user?.province
                  ? ` (${profile?.artistProfile?.province || profile?.user?.province})`
                  : ""}
              </Text>
            </View>
          </View>
        )}
      </View>
      <View className="items-center py-3">
        <View className="flex-row gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className={`w-3 h-3 rounded-full ${i <= stepIndex ? "bg-green-500" : "bg-foreground/30"}`}
            />)
          )}
        </View>
      </View>
    </View>
  );
}


