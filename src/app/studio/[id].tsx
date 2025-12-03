import {
  Banner,
  ServicesSection,
  StudioFAQs,
  StudioPhotos,
  StudioSkeleton,
  StylesSection,
} from "@/components/profile";
import StudioOverview from "@/components/profile/StudioOverview";
import ArtistCard from "@/components/search/ArtistCard";
import ScaledText from "@/components/ui/ScaledText";
import {
  fetchStudioMembersForPublicProfile,
  fetchStudioPublicProfile,
} from "@/services/studio.service";
import type { ArtistSearchResult } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, ScrollView, View } from "react-native";

export default function StudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [members, setMembers] = useState<ArtistSearchResult[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        // Fetch studio profile and members in parallel
        const [profile, membersData] = await Promise.all([
          fetchStudioPublicProfile(String(id)),
          fetchStudioMembersForPublicProfile(String(id)),
        ]);
        if (mounted) {
          setData(profile);
          setMembers(membersData as ArtistSearchResult[]);
        }
      } catch (e: any) {
        if (mounted)
          setError(
            e?.message || "Impossibile caricare il profilo dello studio"
          );
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
      console.error("Impossibile aprire l'URL:", err)
    );
  };

  if (loading) {
    return <StudioSkeleton />;
  }

  if (error) {
    return (
      <View className="items-center justify-center flex-1 bg-background">
        <ScaledText
          allowScaling={false}
          variant="11"
          className="text-foreground font-neueLight"
          style={{ paddingHorizontal: s(24) }}
        >
          {error}
        </ScaledText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        <ScrollView
          className="relative"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(50) }}
        >
          {/* Banner */}
          <Banner banner={data?.banner || []} />

          {/* Studio Overview (Header + Socials merged) */}
          <StudioOverview
            name={data?.name}
            logo={data?.logo}
            ownerFirstName={data?.owner?.firstName}
            ownerLastName={data?.owner?.lastName}
            municipality={data?.city}
            province={data?.province}
            instagram={data?.instagram}
            tiktok={data?.tiktok}
            website={data?.website}
          />

          {/* Description */}
          {!!data?.description && (
            <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueLight"
              >
                {data.description}
              </ScaledText>
            </View>
          )}

          {/* Preferred Styles Section */}
          <StylesSection styles={data?.styles || []} />

          {/* Services Section */}
          <ServicesSection services={data?.services || []} />

          {/* Studio Photos Section */}
          <StudioPhotos photos={data?.photos || []} />

          {/* Studio Members Section */}
          {members.length > 0 && (
            <View style={{ marginTop: mvs(32) }}>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-center text-foreground font-montserratSemibold"
                style={{ paddingHorizontal: s(16), marginBottom: mvs(12) }}
              >
                Artisti collegati allo studio
              </ScaledText>
              {members.map((member) => (
                <ArtistCard key={member.id} artist={member} />
              ))}
            </View>
          )}

          {/* FAQs Section */}
          <StudioFAQs faqs={data?.faqs || []} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
