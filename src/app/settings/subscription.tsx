import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { SubscriptionService } from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function SettingsSubscription() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sub, setSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { updateStep13 } = useArtistRegistrationV2Store();

  useEffect(() => {
    (async () => {
      try {
        const [data, allPlans] = await Promise.all([
          SubscriptionService.getActiveSubscriptionWithPlan(),
          SubscriptionService.fetchSubscriptionPlans(),
        ]);
        setSub(data);
        setPlans(allPlans);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load subscription");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleAutoRenew = async () => {
    if (!sub) return;
    setSaving(true);
    const prev = sub.autoRenew;
    setSub({ ...sub, autoRenew: !prev });
    try {
      await SubscriptionService.toggleAutoRenew(sub.id, !prev);
    } catch (e: any) {
      setSub({ ...sub, autoRenew: prev });
      toast.error(e?.message || "Failed to update auto-renew");
    } finally {
      setSaving(false);
    }
  };

  const PlanCardSkeleton = () => (
    <View
      className="rounded-2xl"
      style={{ borderWidth: 1, borderColor: "#a49a99", borderRadius: s(8) }}
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
        <View
          style={{
            height: mvs(24),
            backgroundColor: "#E8E0E0",
            borderRadius: 4,
            width: s(120),
          }}
        />
        <View
          style={{
            height: mvs(34),
            backgroundColor: "#E8E0E0",
            borderRadius: 6,
            width: s(120),
            marginTop: mvs(10),
          }}
        />
        <View
          style={{
            height: mvs(14),
            backgroundColor: "#E8E0E0",
            borderRadius: 4,
            width: s(180),
            marginTop: mvs(10),
          }}
        />
      </LinearGradient>
    </View>
  );

  const plan = sub?.subscription_plans;
  const isTrial = !!sub?.isTrial && sub?.trialEndsAt;
  const nextDate = isTrial ? sub?.trialEndsAt : sub?.endDate;

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
            Your subscription
          </ScaledText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
            gap: mvs(16),
          }}
        >
          {/* Status block */}
          <View>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-montserratMedium"
              style={{ marginBottom: mvs(8) }}
            >
              Your current plan
            </ScaledText>
            {loading ? (
              <PlanCardSkeleton />
            ) : !sub ? (
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray"
              >
                No active subscription
              </ScaledText>
            ) : (
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: s(8),
                  padding: s(14),
                }}
                className="bg-tat-darkMaroon border-gray"
              >
                <View className="flex-row items-center justify-between">
                  <ScaledText
                    allowScaling={false}
                    variant="20"
                    className="text-foreground font-neueBold"
                  >
                    Piano{" "}
                    <ScaledText
                      allowScaling={false}
                      variant="20"
                      className="font-neueBold"
                      style={{
                        display: "flex",
                        paddingHorizontal: s(4),
                        color: "#F79410",
                      }}
                    >
                      {} {plan?.name} {}
                    </ScaledText>{" "}
                    {sub?.isTrial ? "(trial)" : ""}
                  </ScaledText>
                </View>
                <View
                  className="flex-row items-end justify-start"
                  style={{ columnGap: s(4) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="2xl"
                    className="text-foreground font-neueSemibold"
                    style={{ lineHeight: mvs(20), marginTop: mvs(8) }}
                  >
                    €
                    {sub?.isTrial
                      ? 0
                      : sub?.billingCycle === "YEARLY"
                        ? plan?.yearlyPrice
                        : plan?.monthlyPrice}
                  </ScaledText>
                  {nextDate ? (
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-foreground font-neueLight"
                    >
                      ({isTrial ? "Renews on" : "Renews on"}{" "}
                      {new Date(nextDate).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      )
                    </ScaledText>
                  ) : null}
                </View>
              </View>
            )}
          </View>

          {sub?.endDate ? (
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-gray font-neueMedium"
            >
              Expires on{" "}
              {new Date(sub.endDate).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </ScaledText>
          ) : null}
          <View
            style={{
              marginTop: mvs(12),
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              className="flex-row items-center justify-center"
              style={{ columnGap: s(4) }}
            >
              <SVGIcons.CloseRed width={s(16)} height={s(16)} />
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-error font-montserratSemibold"
              >
                Cancel subscription
              </ScaledText>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                columnGap: s(10),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="font-neueMedium"
                style={{ color: "#FFFFFF" }}
              >
                Auto-renew
              </ScaledText>
              <TouchableOpacity
                onPress={toggleAutoRenew}
                disabled={saving}
                className={sub?.autoRenew ? "bg-primary" : "bg-gray/40"}
                style={{
                  paddingVertical: mvs(8),
                  paddingHorizontal: s(16),
                  borderRadius: 999,
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="font-neueMedium"
                  style={{ color: "#FFFFFF" }}
                >
                  {saving ? "Saving..." : sub?.autoRenew ? "On" : "Off"}
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current plan card + Upgrade CTA */}
          {!loading && sub && (
            <View
              className="rounded-2xl"
              style={{
                borderWidth: 1,
                borderColor: "#a49a99",
                borderRadius: s(8),
                marginTop: mvs(24),
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
                      {plan?.name}
                    </ScaledText>
                  </View>
                  <View className="flex-row items-end mt-2">
                    <ScaledText
                      allowScaling={false}
                      variant="6xl"
                      className="font-neueBold "
                      style={{
                        color: "#080101",
                        lineHeight: mvs(30),
                        marginTop: mvs(2),
                      }}
                    >
                      €
                      {sub?.billingCycle === "YEARLY"
                        ? plan?.yearlyPrice
                        : plan?.monthlyPrice}
                      /
                    </ScaledText>
                    <ScaledText
                      allowScaling={false}
                      variant="lg"
                      className="font-neueMedium"
                      style={{ color: "#080101", marginLeft: s(2) }}
                    >
                      {sub?.billingCycle === "YEARLY" ? "year" : "month"}
                    </ScaledText>
                  </View>
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="font-neueLightItalic"
                    style={{ color: "#080101", marginTop: mvs(6) }}
                  >
                    {plan?.description}
                  </ScaledText>
                </View>

                {/* Features */}
                <View style={{ gap: mvs(8) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="font-neueSemibold"
                    style={{ color: "#080101" }}
                  >
                    Includes:
                  </ScaledText>
                  <View>
                    {Array.isArray(plan?.features) &&
                    plan!.features.length > 0 ? (
                      plan!.features.map((feature: any, idx: number) => (
                        <View key={idx} className="flex-row items-center mb-1">
                          <ScaledText
                            allowScaling={false}
                            variant="11"
                            style={{ color: "#080101" }}
                          >
                            {feature.text}
                          </ScaledText>
                        </View>
                      ))
                    ) : (
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        style={{ color: "#080101" }}
                      >
                        No features listed
                      </ScaledText>
                    )}
                  </View>
                </View>

                <View style={{ marginTop: mvs(8) }}>
                  {(() => {
                    const other = plans.find((p) => p.id !== sub?.planId);
                    if (!other) return null;
                    const onUpgrade = () => {
                      updateStep13({
                        selectedPlanId: other.id,
                        billingCycle: sub?.billingCycle,
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
            className="bg-[#fff] rounded-xl max-w-[90vw]"
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
              Are you sure you want to{"\n"}cancel your subscription?
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-background text-center font-montserratSemibold"
              style={{ marginBottom: mvs(20) }}
            >
              Once cancelled, your plan stays active until{" "}
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-background text-center font-montserratBold"
              >
                {new Date(sub?.endDate).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </ScaledText>
              .
            </ScaledText>
            <View
              className="flex-row justify-center"
              style={{ columnGap: s(10) }}
            >
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="rounded-full items-center justify-center flex-row border-primary"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  borderWidth: s(1),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-primary font-montserratSemibold"
                >
                  Cancel plan
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="rounded-full items-center justify-center flex-row"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratSemibold"
                >
                  Don’t cancel
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
