import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { SubscriptionService } from "@/services/subscription.service";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

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
    activeOpacity={1}
    onPress={onPress}
    className={`flex-row items-center justify-between 
      ${isDanger ? "bg-tat-darkMaroon" : "bg-[#100C0C]"}
      `}
    style={{ paddingVertical: mvs(16), paddingHorizontal: s(16) }}
  >
    {/* Main row of setting item */}
    {!iconRight ? (
      <View className="flex-row items-center flex-1 ">
        {icon && <View style={{ marginRight: s(12) }}>{icon}</View>}
        <View className="flex-1 flex-row items-center" style={{ gap: s(24) }}>
          <ScaledText
            allowScaling={false}
            variant="md"
            className={`font-neueSemibold ${isDanger && icon ? "text-error" : "text-white"}`}
          >
            {title}
          </ScaledText>
          {value && (
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-gray-300 font-neueLight"
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
          variant="md"
          className={`font-neueSemibold ${isDanger ? "text-error" : "text-white"}`}
        >
          {title}
        </ScaledText>
        {icon && <View style={{ marginLeft: s(12) }}>{icon}</View>}
        {value && (
          <ScaledText
            allowScaling={false}
            variant="11"
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
        className="font-neueLight text-gray"
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [userPlanType, setUserPlanType] = useState<"PREMIUM" | "STUDIO" | null>(
    null
  );

  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user?.id || user?.role !== "ARTIST") return;

      try {
        const subscription =
          await SubscriptionService.getActiveSubscriptionWithPlan();
        if (subscription?.subscription_plans?.type) {
          setUserPlanType(subscription.subscription_plans.type);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchUserSubscription();
  }, [user]);

  const handleBack = () => {
    router.push("/(tabs)/profile" as any);
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
    setShowDeleteModal(true);
  };

  const handleCancelDeletion = () => {
    if (isDeactivating) return;
    setShowDeleteModal(false);
  };

  const handleConfirmDeletion = async () => {
    if (!user?.id) return;
    setIsDeactivating(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ isActive: false })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message || "Failed to deactivate account");
        setIsDeactivating(false);
        return;
      }

      toast.success("Account deactivated");
      setShowDeleteModal(false);
      await logout();
    } catch (e: any) {
      toast.error(e?.message || "Failed to deactivate account");
      setIsDeactivating(false);
    }
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
          marginBottom: mvs(20),
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
          className="text-white font-neueSemibold"
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
          <View className="bg-gray" style={{ height: s(0.5) }} />
          <SettingsItem
            title="Email"
            value={user?.email || "johndoe@gmail.com"}
            onPress={handleEmailPress}
          />
          <View className="bg-gray" style={{ height: s(0.5) }} />
          <SettingsItem title="Password" onPress={handlePasswordPress} />
        </SettingsSection>

        {/* Subscription & Billing */}
        {user?.role === "ARTIST" && (
          <SettingsSection
            title="Subscription & Billing"
            icon={
              <SVGIcons.Subscription style={{ width: s(16), height: s(16) }} />
            }
          >
            <SettingsItem
              title="Abbonamento"
              onPress={handleSubscriptionPress}
            />
            <View className="bg-gray" style={{ height: s(0.5) }} />
            <SettingsItem title="Fatturazione" onPress={handleBillingPress} />
          </SettingsSection>
        )}

        {/* Advanced settings */}
        <SettingsSection title="Advanced settings">
          <SettingsItem title="Profilo" onPress={handleProfilePress} />
          <View className="bg-gray" style={{ height: s(0.5) }} />
          <SettingsItem title="Community" onPress={handleCommunityPress} />

          {user?.role === "ARTIST" && (
            <>
              <View className="bg-gray" style={{ height: s(0.5) }} />
              <SettingsItem
                title="Studio"
                onPress={handleStudioPress}
                icon={
                  <SVGIcons.DimondRed style={{ width: s(16), height: s(16) }} />
                }
                iconRight={true}
              />
            </>
          )}
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone">
          <SettingsItem
            title="Eliminazione account"
            onPress={handleAccountDeletionPress}
            isDanger={true}
          />
          <View className="bg-gray" style={{ height: s(0.5) }} />
          <SettingsItem
            title="Logout"
            onPress={handleLogout}
            isDanger={true}
            showChevron={false}
            icon={<SVGIcons.Logout style={{ width: s(16), height: s(16) }} />}
          />
        </SettingsSection>
      </ScrollView>
      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDeletion}
      >
        <View
          className="flex-1 justify-center items-center"
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
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(28)} height={s(28)} />
            </View>

            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              Elimina account?
            </ScaledText>

            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              This action will deactivate your account. You can reactivate it
              withen 30 days by contacting support.
            </ScaledText>

            <View style={{ gap: mvs(4) }} className="flex-row justify-center">
              <TouchableOpacity
                onPress={handleConfirmDeletion}
                disabled={isDeactivating}
                className="rounded-full items-center justify-center flex-row"
                style={{
                  backgroundColor: isDeactivating ? "#6B2C2C" : "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-montserratMedium text-foreground"
                >
                  {isDeactivating ? "Processing..." : "I understand"}
                </ScaledText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelDeletion}
                disabled={isDeactivating}
                className="rounded-full items-center justify-center"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratMedium"
                >
                  Cancel
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
