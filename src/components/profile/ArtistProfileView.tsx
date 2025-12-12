import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { toggleFollow } from "@/services/profile.service";
import { useAuthRequiredStore } from "@/stores/authRequiredStore";
import { ArtistSelfProfileInterface } from "@/types/artist";
import { StudioSearchResult } from "@/types/search";
import { WorkArrangement } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudioCard from "@/components/search/StudioCard";
import { Banner } from "./Banner";
import { BodyPartsSection } from "./BodyPartsSection";
import { CollectionsSection } from "./CollectionsSection";
import { ProfileHeader } from "./ProfileHeader";
import { ServicesSection } from "./ServicesSection";
import { SocialMediaIcons } from "./SocialMediaIcons";
import { StylesSection } from "./StylesSection";

interface ArtistProfileViewProps {
  data: ArtistSelfProfileInterface & { isFollowing?: boolean };
  currentUserId?: string;
  studio?: StudioSearchResult | null;
}

export const ArtistProfileView: React.FC<ArtistProfileViewProps> = ({
  data,
  currentUserId,
  studio,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFollowing, setIsFollowing] = useState(data.isFollowing || false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string>("");

  const handleSocialMediaPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const handleFollowToggle = async () => {
    // Show auth modal for anonymous users
    if (!currentUserId) {
      useAuthRequiredStore.getState().show("Sign in to follow artists");
      return;
    }

    if (isTogglingFollow) return;

    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);
    setIsTogglingFollow(true);

    try {
      const result = await toggleFollow(currentUserId, data.user.id);
      setIsFollowing(result.isFollowing);
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState);
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleSendRequest = async () => {
    if (!data?.user?.id) return;

    // Show auth modal for anonymous users
    if (!currentUserId) {
      useAuthRequiredStore.getState().show("Sign in to send tattoo requests");
      return;
    }

    // Check if this is a self-request
    const isSelfRequest = currentUserId === data.user.id;

    // Self-requests don't need validation, proceed directly
    if (isSelfRequest) {
      router.push(`/user/${data.user.id}/request/size` as any);
      return;
    }

    try {
      // Check if target user has artist profile
      const { data: artistProfile, error: profileError } = await supabase
        .from("artist_profiles")
        .select("acceptPrivateRequests, rejectionMessage")
        .eq("userId", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching artist profile:", profileError);
        // If error, proceed anyway (user might not be an artist)
        router.push(`/user/${data.user.id}/request/size` as any);
        return;
      }

      // Only check acceptPrivateRequests if user has artist profile
      if (artistProfile && artistProfile.acceptPrivateRequests === false) {
        // Show rejection modal
        const rejectionMsg =
          artistProfile.rejectionMessage ||
          "L'artista non può ricevere nuove richieste private in questo momento";
        setRejectionMessage(rejectionMsg);
        setShowRejectionModal(true);
      } else {
        // User accepts requests (or doesn't have artist profile), proceed to request flow
        router.push(`/user/${data.user.id}/request/size` as any);
      }
    } catch (error) {
      console.error("Error checking artist profile:", error);
      // Proceed anyway if there's an error
      router.push(`/user/${data.user.id}/request/size` as any);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Follow button - positioned top-right */}
      {/* {currentUserId && (
        <View
          className="absolute right-0 z-10 top-2"
          style={{ paddingHorizontal: s(16) }}
        >
          <TouchableOpacity
            onPress={handleFollowToggle}
            disabled={isTogglingFollow}
            className={`rounded-full items-center justify-center ${
              isFollowing ? "border border-gray" : "bg-primary"
            }`}
            style={{ paddingHorizontal: s(20), height: s(36) }}
          >
            <ScaledText
              allowScaling={false}
              variant="body4"
              className={isFollowing ? "text-foreground" : "text-white"}
              style={{ fontWeight: "500" }}
            >
              {isFollowing ? "Seguendo" : "Segui"}
            </ScaledText>
          </TouchableOpacity>
        </View>
      )} */}

      <ScrollView
        className="relative"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Back icon */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="z-10 "
          style={{
            paddingHorizontal: s(12),
            paddingVertical: mvs(12),
            backgroundColor: "rgba(0, 0, 0, 0.4)",
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
        <Banner banner={data?.artistProfile?.banner || []} />

        {/* Profile Header */}
        <ProfileHeader
          username={data?.user?.username}
          firstName={data?.user?.firstName}
          lastName={data?.user?.lastName}
          avatar={data?.user?.avatar}
          businessName={data?.artistProfile?.businessName}
          municipality={data?.location?.municipality?.name}
          province={data?.location?.province?.name}
          address={data?.location?.address}
          workArrangement={
            data?.artistProfile?.workArrangement as WorkArrangement
          }
          yearsExperience={data?.artistProfile?.yearsExperience}
        />

        {/* Social Media Icons */}
        <SocialMediaIcons
          instagram={data?.user?.instagram}
          tiktok={data?.user?.tiktok}
          website={data?.user?.website}
          onInstagramPress={handleSocialMediaPress}
          onTiktokPress={handleSocialMediaPress}
          onWebsitePress={handleSocialMediaPress}
        />

        {/* Bio */}
        {!!data?.artistProfile?.bio && (
          <View className="px-4 mt-6">
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueLight"
            >
              {data.artistProfile.bio}
            </ScaledText>
          </View>
        )}

        {/* Styles Section */}
        <StylesSection styles={data?.favoriteStyles || []} />

        {/* Services Section */}
        <ServicesSection services={data?.services || []} />

        {/* Collections Section */}
        <CollectionsSection
          collections={data?.collections || []}
          showNewCollection={false}
        />

        {/* Body Parts Section */}
        <BodyPartsSection bodyParts={data?.bodyPartsNotWorkedOn || []} />

        {/* Studio Card - show at bottom if artist owns a studio */}
        {studio && (
          <View style={{ marginTop: mvs(24), marginBottom: mvs(16) }}>
            <StudioCard studio={studio} />
          </View>
        )}

        {/* Bottom actions - only show if not viewing own profile */}
        {currentUserId !== data.user.id && (
          <View className="px-4 py-3 bg-background">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleFollowToggle}
                disabled={isTogglingFollow}
                className={`flex-1 flex-row rounded-full items-center justify-center ${
                  isFollowing ? "border border-gray" : "border border-gray"
                }`}
                style={{ gap: s(8), paddingVertical: mvs(8) }}
              >
                <SVGIcons.Follow width={s(14)} height={s(14)} />
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueMedium"
                >
                  {isFollowing ? "Seguendo" : "Segui"}
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendRequest}
                className="flex-row items-center justify-center flex-1 gap-2 rounded-full bg-primary"
                style={{ gap: s(8), paddingVertical: mvs(8) }}
              >
                <SVGIcons.Send2 width={s(14)} height={s(14)} />
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-white font-neueMedium"
                >
                  Invia richiesta
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectionModal(false)}
      >
        <View
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(32),
            }}
          >
            {/* Warning Icon */}
            <View className="items-center" style={{ marginBottom: mvs(20) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(4) }}
            >
              Richiesta non disponibile
            </ScaledText>

            {/* Message */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center text-background font-montserratMedium"
              style={{ marginBottom: mvs(32) }}
            >
              {rejectionMessage}
            </ScaledText>

            {/* OK Button */}
            <TouchableOpacity
              onPress={() => setShowRejectionModal(false)}
              className="items-center justify-center rounded-full w-fit bg-primary"
              style={{
                paddingVertical: mvs(10.5),
                paddingHorizontal: s(30),
                alignSelf: "center",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-montserratMedium"
              >
                OK
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
