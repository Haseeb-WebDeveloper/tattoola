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
import { SVGIcons } from "@/constants/svg";
import {
    fetchStudioMembersForPublicProfileCached,
    fetchStudioPublicProfileCached,
    fetchStudioSummaryCached,
} from "@/services/studio.service";
import type { ArtistSearchResult, StudioSummary } from "@/types/search";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudioScreen() {
  const { id, initialStudio: initialStudioParam } = useLocalSearchParams<{
    id: string;
    initialStudio?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [members, setMembers] = useState<ArtistSearchResult[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadStudio = async () => {
      const t0 = Date.now();
      try {
        if (!id) return;
        const idStr = String(id);

        // 1) Try to get initialStudio from params or summary cache
        let initialData: StudioSummary | null = null;
        let summaryRenderTime = 0;

        if (initialStudioParam) {
          try {
            initialData = JSON.parse(initialStudioParam) as StudioSummary;
            summaryRenderTime = Date.now() - t0;
            console.log(
              `[Studio] summary render ready from params in ${summaryRenderTime}ms`
            );
          } catch (e) {
            console.error("Failed to parse initialStudio param:", e);
          }
        }

        // If no initialStudio from params, try summary cache
        if (!initialData) {
          try {
            const cachedSummary = await fetchStudioSummaryCached(idStr);
            if (cachedSummary) {
              initialData = cachedSummary;
              summaryRenderTime = Date.now() - t0;
              console.log(
                `[Studio] summary render ready from cache in ${summaryRenderTime}ms`
              );
            }
          } catch (e) {
            // Cache is best-effort, ignore errors
          }
        }

        // If we have initial data, render immediately
        if (initialData && mounted) {
          // Convert StudioSummary to full profile shape for rendering
          setData({
            ...initialData,
            photos: [], // Will be loaded lazily
            faqs: [], // Will be loaded lazily
            services: initialData.services || [], // May be limited
          });
          setLoading(false);
        }

        // 2) Fetch full profile in background (cache-aware)
        const fullProfile = await fetchStudioPublicProfileCached(idStr);
        if (mounted) {
          setData(fullProfile);
          const fullHydrationTime = Date.now() - t0;
          console.log(
            `[Studio] full details hydrated in ${fullHydrationTime}ms`
          );
        }

        // 3) Load members in background (also cache-aware, delayed)
        // Delay member fetch slightly to prioritize profile data
        setTimeout(() => {
          fetchStudioMembersForPublicProfileCached(idStr)
            .then((membersData) => {
              if (mounted && membersData) {
                setMembers(membersData as ArtistSearchResult[]);
              }
            })
            .catch((err) =>
              console.error("Failed to load studio members:", err)
            );
        }, 100);
      } catch (e: any) {
        if (mounted) {
          setError(
            e?.message || "Impossibile caricare il profilo dello studio"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
          const total = Date.now() - t0;
          console.log(
            `[Studio] loadStudio completed for ${String(
              id
            )} in ${total}ms`
          );
        }
      }
    };

    loadStudio();

    return () => {
      mounted = false;
    };
  }, [id, initialStudioParam]);

  const handleSocialMediaPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Impossibile aprire l'URL:", err)
    );
  };

  // Only show skeleton if we have no data at all (no initialStudio, no cache, and still loading)
  if (loading && !data) {
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
        <KeyboardAwareScrollView
          className="relative"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          contentContainerStyle={{ paddingBottom: mvs(50) }}
          enableOnAndroid={true}
          enableAutomaticScroll={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          {/* Back icon */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="z-10 "
            style={{
              paddingHorizontal: s(12),
              paddingVertical: mvs(12),
              backgroundColor: "rgba(255, 255, 255, 0.30)",
              borderRadius: s(100),
              position: "absolute",
              top: mvs(8),
              left: s(16),
              zIndex: 10,
            }}
          >
            <SVGIcons.ChevronLeft width={s(14)} height={s(14)} />
          </TouchableOpacity>

          {/* Banner */}
          <Banner banner={data?.banner || []} />

          {/* Studio Overview (Header + Socials merged) */}
          <StudioOverview
            name={data?.name}
            logo={data?.logo}
            ownerFirstName={data?.owner?.firstName}
            ownerLastName={data?.owner?.lastName}
            ownerId={data?.owner?.id}
            municipality={data?.city}
            province={data?.province}
            address={data?.address}
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
          <StudioPhotos 
            photos={data?.photos || []} 
            studioName={data?.name}
            studioId={id ? String(id) : undefined}
          />

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
        </KeyboardAwareScrollView>
      </LinearGradient>
    </View>
  );
}
