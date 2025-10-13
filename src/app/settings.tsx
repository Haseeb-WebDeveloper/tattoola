import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
    className="flex-row items-center justify-between py-4 bg-[#100C0C] px-4"
  >
    {/* Main row of setting item */}
    {!iconRight ? (
      <View className="flex-row items-center flex-1">
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1 flex-row items-center gap-6">
          <Text
            className={`text-base font-semibold ${isDanger ? "text-error" : "text-white"}`}
          >
            {title}
          </Text>
          {value && <Text className="text-gray-300 text-sm">{value}</Text>}
        </View>
        {showChevron && (
          <SVGIcons.ChevronRight
            className={`w-5 h-5 ${isDanger ? "text-error" : "text-white"}`}
          />
        )}
      </View>
    ) : (
      <View className="flex-row items-center flex-1">
        {/* Only text with icon immediately after it when iconRight is true */}
        <Text
          className={`text-base font-semibold ${isDanger ? "text-error" : "text-white"}`}
        >
          {title}
        </Text>
        {icon && <View className="ml-3">{icon}</View>}
        {value && <Text className="ml-3 text-gray-300 text-sm">{value}</Text>}
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
  <View className="mb-6">
    <View className="flex-row items-center mb-3 px-4">
      {icon && <View className="mr-2">{icon}</View>}
      <Text className="text-sm font-medium text-gray">{title}</Text>
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
      <View className="px-4 py-4 flex-row items-center justify-center mb-8 relative">
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-foreground/20 items-center justify-center mr-4 p-2"
          style={{ transform: [{ translateY: 0 }] }} // w-10 == 40px, so -h/2
        >
          <SVGIcons.ChevronLeft className="w-4 h-4" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Account Management */}
        <SettingsSection
          title="Account Management"
          icon={<SVGIcons.EditUser className="w-4 h-4" />}
        >
          <SettingsItem
            title="Username"
            value={user?.username || ""}
            onPress={handleUsernamePress}
          />
          <View
            className="bg-[#A49A99]"
            style={{ height: 0.2, marginVertical: 1 }}
          />
          <SettingsItem
            title="Email"
            value={user?.email || "johndoe@gmail.com"}
            onPress={handleEmailPress}
          />
          <View
            className="bg-[#A49A99]"
            style={{ height: 0.2, marginVertical: 1 }}
          />
          <SettingsItem title="Password" onPress={handlePasswordPress} />
        </SettingsSection>

        {/* Subscription & Billing */}
        <SettingsSection
          title="Subscription & Billing"
          icon={<SVGIcons.Subscription className="w-4 h-4" />}
        >
          <SettingsItem title="Abbonamento" onPress={handleSubscriptionPress} />
          <View
            className="bg-[#A49A99]"
            style={{ height: 0.2, marginVertical: 1 }}
          />
          <SettingsItem title="Fatturazione" onPress={handleBillingPress} />
        </SettingsSection>

        {/* Advanced settings */}
        <SettingsSection title="Advanced settings">
          <SettingsItem title="Profilo" onPress={handleProfilePress} />
          <View
            className="bg-[#A49A99]"
            style={{ height: 0.2, marginVertical: 1 }}
          />
          <SettingsItem title="Community" onPress={handleCommunityPress} />
          <View
            className="bg-[#A49A99]"
            style={{ height: 0.2, marginVertical: 1 }}
          />
          <SettingsItem
            title="Premium"
            onPress={handlePremiumPress}
            icon={<SVGIcons.DimondYellow className="w-4 h-4" />}
            iconRight={true}
          />
          <View
            className="bg-[#A49A99]"
            style={{ height: 0.2, marginVertical: 1 }}
          />
          <SettingsItem
            title="Studio"
            onPress={handleStudioPress}
            icon={<SVGIcons.DimondRed className="w-4 h-4" />}
            iconRight={true}
          />
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone">
          <SettingsItem
            title="Eliminazione account"
            onPress={handleAccountDeletionPress}
          />
          <View
            className="bg-[#A49A99]"
            style={{ height: 0.2, marginVertical: 1 }}
          />
          <SettingsItem
            title="Logout"
            onPress={handleLogout}
            isDanger={true}
            showChevron={false}
            icon={<SVGIcons.Logout className="w-4 h-4" />}
          />
        </SettingsSection>

      </ScrollView>
    </View>
  );
}
