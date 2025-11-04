import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { BillingService } from "@/services/billing.service";
import { SubscriptionService } from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function SettingsBilling() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { updateStep13 } = useArtistRegistrationV2Store();

  useEffect(() => {
    (async () => {
      try {
        const [inv, prof, pm, sub, allPlans] = await Promise.all([
          BillingService.getInvoices(),
          BillingService.getBillingProfile(),
          BillingService.getPaymentMethods(),
          SubscriptionService.getActiveSubscriptionWithPlan(),
          SubscriptionService.fetchSubscriptionPlans(),
        ]);
        setInvoices(inv);
        setProfile(prof);
        setMethods(pm);
        setActiveSub(sub);
        setPlans(allPlans);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openInvoice = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      toast.error("Could not open invoice file");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
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
            onPress={() => router.back()}
            className="absolute rounded-full bg-foreground/20 items-center justify-center"
            style={{ width: s(34), height: s(34), left: s(16), padding: s(8) }}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-neueSemibold"
          >
            Fatturazione
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          className="bg-gray"
          style={{
            height: s(1),
            marginBottom: mvs(32),
            marginHorizontal: s(16),
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
            gap: mvs(20),
          }}
        >
          {/* Subscription Status */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
            Your current plan
            </ScaledText>
            {loading ? (
              <View
                style={{
                  height: mvs(90),
                  backgroundColor: "#1E1E1E",
                  borderRadius: s(8),
                }}
              />
            ) : !activeSub ? (
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-gray"
              >
                No active subscription
              </ScaledText>
            ) : (
              <View
                style={{
                  backgroundColor: "#100C0C",
                  borderWidth: 1,
                  borderColor: "#2A2A2A",
                  borderRadius: s(8),
                  padding: s(14),
                }}
              >
                <View className="flex-row items-center justify-between">
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueBold"
                  >
                    {activeSub.subscription_plans?.name}{" "}
                    {activeSub.isTrial ? "(trial)" : ""}
                  </ScaledText>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueBold"
                  >
                    €
                    {activeSub.isTrial
                      ? 0
                      : activeSub.billingCycle === "YEARLY"
                        ? activeSub.subscription_plans?.yearlyPrice
                        : activeSub.subscription_plans?.monthlyPrice}
                  </ScaledText>
                </View>
                <View style={{ marginTop: mvs(6) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-gray"
                  >
                    Renews on{" "}
                    {new Date(
                      activeSub.trialEndsAt || activeSub.endDate
                    ).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </ScaledText>
                  {activeSub.endDate ? (
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-gray"
                    >
                      Expires on{" "}
                      {new Date(activeSub.endDate).toLocaleDateString(
                        undefined,
                        { day: "2-digit", month: "long", year: "numeric" }
                      )}
                    </ScaledText>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => setShowCancelModal(true)}
                  style={{ marginTop: mvs(10) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-error font-neueBold"
                  >
                    Cancel subscription
                  </ScaledText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Current Plan Card with Upgrade CTA */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueBold"
              style={{ marginBottom: mvs(8) }}
            >
              Current plan
            </ScaledText>
            {loading || !activeSub ? (
              <View
                style={{
                  height: mvs(160),
                  backgroundColor: "#1E1E1E",
                  borderRadius: s(8),
                }}
              />
            ) : (
              <View
                className="rounded-2xl"
                style={{
                  borderWidth: 1,
                  borderColor: "#a49a99",
                  borderRadius: s(8),
                }}
              >
                <LinearGradient
                  colors={["#FFFFFF", "#FFCACA"]}
                  locations={[0.0095, 0.995]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: s(8),
                    paddingVertical: mvs(16),
                    paddingHorizontal: s(16),
                  }}
                >
                  <View className="mb-4">
                    <View className="flex-row items-center">
                      <ScaledText
                        allowScaling={false}
                        variant="20"
                        className="font-neueMedium"
                      >
                        Piano
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="20"
                        className="font-neueMedium"
                        style={{ color: "#AE0E0E", marginLeft: s(6) }}
                      >
                        {activeSub.subscription_plans?.name}
                      </ScaledText>
                    </View>
                    <View className="flex-row items-end mt-2">
                      <ScaledText
                        allowScaling={false}
                        variant="6xl"
                        className="font-neueBold "
                        style={{ color: "#080101" }}
                      >
                        €
                        {activeSub.billingCycle === "YEARLY"
                          ? activeSub.subscription_plans?.yearlyPrice
                          : activeSub.subscription_plans?.monthlyPrice}
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="lg"
                        className="font-neueMedium"
                        style={{ color: "#080101", marginLeft: s(2) }}
                      >
                        {activeSub.billingCycle === "YEARLY" ? "year" : "month"}
                      </ScaledText>
                    </View>
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="font-neueLightItalic"
                      style={{ color: "#080101", marginTop: mvs(6) }}
                    >
                      {activeSub.subscription_plans?.description}
                    </ScaledText>
                  </View>

                  {/* Upgrade CTA */}
                  <View style={{ marginTop: mvs(8) }}>
                    {(() => {
                      const other = plans.find(
                        (p) => p.id !== activeSub.planId
                      );
                      if (!other) return null;
                      const onUpgrade = () => {
                        updateStep13({
                          selectedPlanId: other.id,
                          billingCycle: activeSub.billingCycle,
                        });
                        router.push("/(auth)/artist-registration/checkout");
                      };
                      return (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={onUpgrade}
                          className="rounded-full items-center justify-center flex-row"
                          style={{
                            backgroundColor: "#AE0E0E",
                            paddingVertical: mvs(12),
                            borderRadius: 38,
                          }}
                        >
                          <ScaledText
                            allowScaling={false}
                            variant="body2"
                            style={{ color: "#FFFFFF" }}
                            className="font-neueMedium"
                          >
                            Upgrade to {other.name}
                          </ScaledText>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>
          {/* Billing Profile */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueBold"
              style={{ marginBottom: mvs(8) }}
            >
              Billing details
            </ScaledText>
            {loading ? (
              <View
                style={{
                  height: mvs(60),
                  backgroundColor: "#1E1E1E",
                  borderRadius: s(8),
                }}
              />
            ) : (
              <View
                style={{
                  backgroundColor: "#100C0C",
                  borderWidth: 1,
                  borderColor: "#2A2A2A",
                  borderRadius: s(8),
                  padding: s(12),
                }}
              >
                {profile ? (
                  <>
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-foreground"
                    >
                      {profile.fullName || profile.companyName || "—"}
                    </ScaledText>
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-gray"
                    >
                      {profile.addressLine1 || "—"}
                      {profile.city ? `, ${profile.city}` : ""}
                      {profile.country ? `, ${profile.country}` : ""}
                    </ScaledText>
                  </>
                ) : (
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-gray"
                  >
                    No billing profile yet
                  </ScaledText>
                )}
              </View>
            )}
          </View>

          {/* Payment Methods */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueBold"
              style={{ marginBottom: mvs(8) }}
            >
              Payment methods
            </ScaledText>
            {loading ? (
              <View
                style={{
                  height: mvs(60),
                  backgroundColor: "#1E1E1E",
                  borderRadius: s(8),
                }}
              />
            ) : methods.length === 0 ? (
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-gray"
              >
                No payment methods
              </ScaledText>
            ) : (
              <View style={{ gap: mvs(8) }}>
                {methods.map((m) => (
                  <View
                    key={m.id}
                    style={{
                      backgroundColor: "#100C0C",
                      borderWidth: 1,
                      borderColor: "#2A2A2A",
                      borderRadius: s(8),
                      padding: s(12),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-foreground"
                    >
                      {m.brand || m.provider} •••• {m.last4 || ""}
                    </ScaledText>
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-gray"
                    >
                      {m.isDefault ? "Default" : ""}{" "}
                      {m.expMonth && m.expYear
                        ? ` • Expires ${m.expMonth}/${m.expYear}`
                        : ""}
                    </ScaledText>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Invoices */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueBold"
              style={{ marginBottom: mvs(8) }}
            >
              Invoices
            </ScaledText>
            {loading ? (
              <View
                style={{
                  height: mvs(120),
                  backgroundColor: "#1E1E1E",
                  borderRadius: s(8),
                }}
              />
            ) : invoices.length === 0 ? (
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-gray"
              >
                No invoices
              </ScaledText>
            ) : (
              <View style={{ gap: mvs(10) }}>
                {invoices.map((inv) => (
                  <View
                    key={inv.id}
                    style={{
                      backgroundColor: "#100C0C",
                      borderWidth: 1,
                      borderColor: "#2A2A2A",
                      borderRadius: s(8),
                      padding: s(12),
                      gap: mvs(4),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-foreground"
                    >
                      Invoice {inv.number}
                    </ScaledText>
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-gray"
                    >
                      Period: {new Date(inv.periodStart).toDateString()} →{" "}
                      {new Date(inv.periodEnd).toDateString()}
                    </ScaledText>
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-gray"
                    >
                      Total: {(inv.amountTotal / 100).toFixed(2)} {inv.currency}
                    </ScaledText>
                    <View
                      style={{
                        marginTop: mvs(6),
                        flexDirection: "row",
                        justifyContent: "flex-end",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => openInvoice(inv.pdfUrl)}
                        className="bg-primary"
                        style={{
                          paddingVertical: mvs(8),
                          paddingHorizontal: s(14),
                          borderRadius: 999,
                        }}
                      >
                        <ScaledText
                          allowScaling={false}
                          variant="sm"
                          className="text-foreground"
                        >
                          Download
                        </ScaledText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
      {/* Cancel Subscription Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(28),
            }}
          >
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(6) }}
            >
              Cancel subscription?
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background text-center"
              style={{ marginBottom: mvs(20) }}
            >
              You can keep access until the end of the current period.
            </ScaledText>
            <View
              className="flex-row justify-center"
              style={{ columnGap: s(10) }}
            >
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="rounded-full border-2 items-center justify-center flex-row"
                style={{
                  borderColor: "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-montserratMedium"
                  style={{ color: "#AD2E2E" }}
                >
                  Keep plan
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="rounded-full items-center justify-center flex-row"
                style={{
                  backgroundColor: "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratMedium"
                >
                  Confirm cancel
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
