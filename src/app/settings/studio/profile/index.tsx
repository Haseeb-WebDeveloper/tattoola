import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

interface StudioProfileSettingsItemProps {
  title: string;
  onPress: () => void;
}

const StudioProfileSettingsItem: React.FC<StudioProfileSettingsItemProps> = ({
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
      className={`font-neueSemibold text-white`}
    >
      {title}
    </ScaledText>
    <SVGIcons.ChevronRight width={s(10)} height={s(10)} />
  </TouchableOpacity>
);

export default function StudioProfileSettingsScreen() {
  const router = useRouter();

  // Navigation handlers for each studio profile screen
  const handleBannerPress = () => {
    router.push("/settings/studio/profile/studio-banner" as any);
  };
  const handleLogoPress = () => {
    router.push("/settings/studio/profile/studio-logo" as any);
  };
  const handleNameAndAddressPress = () => {
    router.push("/settings/studio/profile/studio-name-address" as any);
  };
  const handleSocialLinksPress = () => {
    router.push("/settings/studio/profile/studio-social" as any);
  };
  const handleDescriptionPress = () => {
    router.push("/settings/studio/profile/studio-description" as any);
  };
  const handleStylesPress = () => {
    router.push("/settings/studio/profile/studio-styles" as any);
  };
  const handleServicesPress = () => {
    router.push("/settings/studio/profile/studio-services" as any);
  };
  const handleFaqsPress = () => {
    router.push("/settings/studio/profile/studio-faqs" as any);
  };

  const handleBack = () => {
    router.back();
  };

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
          <View className="flex-row items-center gap-2">
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-white font-neueSemibold"
            >
              Studio page
            </ScaledText>
            <SVGIcons.DimondRed width={s(18)} height={s(18)} />
          </View>
        </View>

        {/* Studio Profile Settings List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(32) }}
        >
          <StudioProfileSettingsItem
            title="Cover"
            onPress={handleBannerPress}
          />
          <StudioProfileSettingsItem
            title="logo"
            onPress={handleLogoPress}
          />
          <StudioProfileSettingsItem
            title="Studio name and address"
            onPress={handleNameAndAddressPress}
          />
          <StudioProfileSettingsItem
            title="Social links"
            onPress={handleSocialLinksPress}
          />
          <StudioProfileSettingsItem
            title="Description"
            onPress={handleDescriptionPress}
          />
          <StudioProfileSettingsItem
            title="Styles"
            onPress={handleStylesPress}
          />
          <StudioProfileSettingsItem
            title="Services"
            onPress={handleServicesPress}
          />
          <StudioProfileSettingsItem
            title="FAQs"
            onPress={handleFaqsPress}
          />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
