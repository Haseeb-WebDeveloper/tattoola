import {
    Banner,
    ConnectedArtists,
    ServicesSection,
    SocialMediaIcons,
    StudioFAQs,
    StudioHeader,
    StudioPhotos,
    StudioSkeleton,
    StylesSection,
} from "@/components/profile";
import { fetchStudioPublicProfile } from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";

export default function StudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        const profile = await fetchStudioPublicProfile(String(id));
        if (mounted) setData(profile);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load studio profile");
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
    return <StudioSkeleton />;
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
        contentContainerStyle={{ paddingBottom: mvs(50) }}
      >
        {/* Banner */}
        <Banner banner={data?.banner || []} />

        {/* Studio Header */}
        <StudioHeader
          name={data?.name}
          logo={data?.logo}
          ownerFirstName={data?.owner?.firstName}
          ownerLastName={data?.owner?.lastName}
          city={data?.city}
          country={data?.country}
          mapImageUrl={undefined} // TODO: Add map integration
        />

        {/* Social Media Icons */}
        <SocialMediaIcons
          instagram={data?.instagram}
          tiktok={data?.tiktok}
          website={data?.website}
          onInstagramPress={handleSocialMediaPress}
          onTiktokPress={handleSocialMediaPress}
          onWebsitePress={handleSocialMediaPress}
        />

        {/* Description */}
        {!!data?.description && (
          <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
            <Text className="text-foreground tat-body-2-light">
              {data.description}
            </Text>
          </View>
        )}

        {/* Preferred Styles Section */}
        <StylesSection styles={data?.styles || []} />

        {/* Services Section */}
        <ServicesSection services={data?.services || []} />

        {/* Studio Photos Section */}
        <StudioPhotos photos={data?.photos || []} />

        {/* Connected Artists Section */}
        <ConnectedArtists
          artists={data?.artists || []}
          studioName={data?.name}
        />

        {/* FAQs Section */}
        <StudioFAQs faqs={data?.faqs || []} />
      </ScrollView>
    </View>
  );
}