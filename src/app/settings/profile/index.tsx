import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/providers/AuthProvider";

interface ProfileSettingsItemProps {
  title: string;
  onPress: () => void;
}

const ProfileSettingsItem: React.FC<ProfileSettingsItemProps> = ({
  title,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={1}
    onPress={onPress}
    className="flex-row items-center justify-between bg-[#100C0C] border-gray"
    style={{
      paddingVertical: mvs(16),
      paddingHorizontal: s(16),
      borderBottomWidth: s(0.5),
    }}
  >
    <ScaledText
      allowScaling={false}
      variant="md"
      className={`font-semibold text-white`}
    >
      {title}
    </ScaledText>
    <SVGIcons.ChevronRight width={s(10)} height={s(10)} />
  </TouchableOpacity>
);

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    router.back();
  };

  // Navigation handlers for each profile setting
  const handlePhotoPress = () => {
    router.push("/settings/profile/avatar" as any);
  };

  const handleLocationPress = () => {
    router.push("/settings/profile/location" as any);
  };

  const handleSocialMediaPress = () => {
    router.push("/settings/profile/social-media" as any);
  };

  const handleBusinessInfoPress = () => {
    router.push("/settings/profile/business-info" as any);
  };
  const handleProfileTypePress = () => {
    router.push("/settings/profile/profile-type" as any);
  };

  const handleBioPress = () => {
    router.push("/settings/profile/bio" as any);
  };

  const handleStylesPress = () => {
    router.push("/settings/profile/styles" as any);
  };

  const handleServicesPress = () => {
    router.push("/settings/profile/services" as any);
  };

  const handleBodyPartsPress = () => {
    router.push("/settings/profile/body-parts" as any);
  };

  const handleRatesPress = () => {
    router.push("/settings/profile/rates" as any);
  };

  const handleWorkModalityPress = () => {
    router.push("/settings/profile/work-modality" as any);
  };

  const handlePrivateRequestsPress = () => {
    router.push("/settings/profile/private-requests" as any);
  };

  const handleBannerPress = () => {
    router.push("/settings/profile/banner" as any);
  };

  const handleExperiencePress = () => {
    router.push("/settings/profile/experience" as any);
  };

  // Items according to role and screenshot.
  // Screenshot items for TATTOO_LOVER (in order): 
  // - Foto profilo
  // - Dove ti trovi
  // - Social media
  // - Stili preferiti
  // - Tipo di profilo

  const tattooLoverItems = [
    { title: "Foto profilo", onPress: handlePhotoPress },
    { title: "Dove ti trovi", onPress: handleLocationPress },
    { title: "Social media", onPress: handleSocialMediaPress },
    { title: "Stili preferiti", onPress: handleStylesPress },
    { title: "Tipo di profilo", onPress: handleProfileTypePress },
  ];

  const artistItems = [
    { title: "Foto profilo", onPress: handlePhotoPress },
    { title: "Dove ti trovi", onPress: handleLocationPress },
    { title: "Social media", onPress: handleSocialMediaPress },
    { title: "La tua attività", onPress: handleBusinessInfoPress },
    { title: "Bio", onPress: handleBioPress },
    { title: "Stili preferiti", onPress: handleStylesPress },
    { title: "Services offered", onPress: handleServicesPress },
    { title: "Parti del corpo su cui lavori", onPress: handleBodyPartsPress },
    { title: "Tariffa minima", onPress: handleRatesPress },
    { title: "Modalita di lavoro", onPress: handleWorkModalityPress },
    { title: "Richieste private", onPress: handlePrivateRequestsPress },
    { title: "Banner", onPress: handleBannerPress },
    { title: "Esperienza", onPress: handleExperiencePress },
  ];

  const itemsToShow =
    user?.role === "ARTIST" ? artistItems : tattooLoverItems;

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-center relative"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            marginBottom: mvs(24),
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="absolute rounded-full bg-foreground/20 items-center justify-center"
            style={{
              width: s(34),
              height: s(34),
              left: s(16),
              padding: s(8),
            }}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-bold"
          >
            Your profile
          </ScaledText>
        </View>

        {/* Profile Settings List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(32) }}
        >
          {itemsToShow.map((item, idx) => (
            <ProfileSettingsItem
              key={item.title}
              title={item.title}
              onPress={item.onPress}
            />
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
