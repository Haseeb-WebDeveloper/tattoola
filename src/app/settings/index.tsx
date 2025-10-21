import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

interface SettingsItemProps {
  title: string;
  value?: string;
  onPress: () => void;
  showChevron?: boolean;
  isDanger?: boolean;
  icon?: React.ReactNode;
  iconRight?: boolean; // NEW PROP to control icon side
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  value,
  onPress,
  showChevron = true,
  isDanger = false,
  icon,
  iconRight = false, // DEFAULT is left side for backward compatibility
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center justify-between 
      ${isDanger ? "bg-tat-darkMaroon" : "bg-[#100C0C]"}
      `}
    style={{ paddingVertical: mvs(16), paddingHorizontal: s(16) }}
  >
    {/* Main row of setting item */}
    {!iconRight ? (
      <View className="flex-row items-center flex-1">
        {icon && <View style={{ marginRight: s(12) }}>{icon}</View>}
        <View className="flex-1 flex-row items-center" style={{ gap: s(24) }}>
          <ScaledText
            allowScaling={false}
            variant="md"
            className={`font-semibold ${isDanger && icon ? "text-error" : "text-white"}`}
          >
            {title}
          </ScaledText>
          {value && (
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-gray-300 font-light"
            >
              {value}
            </ScaledText>
          )}
        </View>
        {showChevron && (
          <SVGIcons.ChevronRight
            className={isDanger ? "text-error" : "text-white"}
            width={s(10)}
            height={s(10)}
          />
        )}
      </View>
    ) : (
      <View className="flex-row items-center flex-1">
        {/* Only text with icon immediately after it when iconRight is true */}
        <ScaledText
          allowScaling={false}
          variant="body1"
          className={`font-semibold ${isDanger ? "text-error" : "text-white"}`}
        >
          {title}
        </ScaledText>
        {icon && <View style={{ marginLeft: s(12) }}>{icon}</View>}
        {value && (
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-gray-300"
            style={{ marginLeft: s(12) }}
          >
            {value}
          </ScaledText>
        )}
      </View>
    )}
  </TouchableOpacity>
);

interface SettingsSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children,
}) => (
  <View style={{ marginBottom: mvs(24) }}>
    <View
      className="flex-row items-center"
      style={{ marginBottom: mvs(12), paddingHorizontal: s(16) }}
    >
      {icon && <View style={{ marginRight: s(8) }}>{icon}</View>}
      <ScaledText
        allowScaling={false}
        variant="md"
        className="font-light text-gray"
      >
        {title}
      </ScaledText>
    </View>
    <View>{children}</View>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const handleUsernamePress = () => {
    router.push("/settings/username" as any);
  };

  const handleEmailPress = () => {
    router.push("/settings/email" as any);
  };

  const handlePasswordPress = () => {
    router.push("/settings/password" as any);
  };

  const handleSubscriptionPress = () => {
    router.push("/settings/subscription" as any);
  };

  const handleBillingPress = () => {
    router.push("/settings/billing" as any);
  };

  const handleProfilePress = () => {
    router.push("/settings/profile" as any);
  };

  const handleCommunityPress = () => {
    router.push("/settings/community" as any);
  };

  const handlePremiumPress = () => {
    router.push("/settings/premium" as any);
  };

  const handleStudioPress = () => {
    router.push("/settings/studio" as any);
  };

  const handleAccountDeletionPress = () => {
    router.push("/settings/delete-account" as any);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <View className="flex-1 bg-background">
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
          <SVGIcons.ChevronLeft style={{ width: s(12), height: s(16) }} />
        </TouchableOpacity>
        <ScaledText
          allowScaling={false}
          variant="2xl"
          className="text-white font-bold"
        >
          Settings
        </ScaledText>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Account Management */}
        <SettingsSection
          title="Account Management"
          icon={<SVGIcons.EditUser style={{ width: s(16), height: s(16) }} />}
        >
          <SettingsItem
            title="Username"
            value={user?.username || ""}
            onPress={handleUsernamePress}
          />
          <View
            className="bg-gray"
            style={{ height: s(0.5), marginVertical: mvs(1) }}
          />
          <SettingsItem
            title="Email"
            value={user?.email || "johndoe@gmail.com"}
            onPress={handleEmailPress}
          />
          <View
            className="bg-gray"
            style={{ height: s(0.2), marginVertical: mvs(1) }}
          />
          <SettingsItem title="Password" onPress={handlePasswordPress} />
        </SettingsSection>

        {/* Subscription & Billing */}
        <SettingsSection
          title="Subscription & Billing"
          icon={
            <SVGIcons.Subscription style={{ width: s(16), height: s(16) }} />
          }
        >
          <SettingsItem title="Abbonamento" onPress={handleSubscriptionPress} />
          <View
            className="bg-gray"
            style={{ height: s(0.2), marginVertical: mvs(1) }}
          />
          <SettingsItem title="Fatturazione" onPress={handleBillingPress} />
        </SettingsSection>

        {/* Advanced settings */}
        <SettingsSection title="Advanced settings">
          <SettingsItem title="Profilo" onPress={handleProfilePress} />
          <View
            className="bg-gray"
            style={{ height: s(0.2), marginVertical: mvs(1) }}
          />
          <SettingsItem title="Community" onPress={handleCommunityPress} />
          <View
            className="bg-gray"
            style={{ height: s(0.2), marginVertical: mvs(1) }}
          />
          <SettingsItem
            title="Premium"
            onPress={handlePremiumPress}
            icon={
              <SVGIcons.DimondYellow style={{ width: s(16), height: s(16) }} />
            }
            iconRight={true}
          />
          <View
            className="bg-gray"
            style={{ height: s(0.2), marginVertical: mvs(1) }}
          />
          <SettingsItem
            title="Studio"
            onPress={handleStudioPress}
            icon={
              <SVGIcons.DimondRed style={{ width: s(16), height: s(16) }} />
            }
            iconRight={true}
          />
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone">
          <SettingsItem
            title="Eliminazione account"
            onPress={handleAccountDeletionPress}
            isDanger={true}
          />
          <View
            className="bg-gray"
            style={{ height: s(0.2), marginVertical: mvs(1) }}
          />
          <SettingsItem
            title="Logout"
            onPress={handleLogout}
            isDanger={true}
            showChevron={false}
            icon={<SVGIcons.Logout style={{ width: s(16), height: s(16) }} />}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
