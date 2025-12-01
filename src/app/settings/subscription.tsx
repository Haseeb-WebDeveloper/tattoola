import FeatureDetailsModal from "@/components/billing/FeatureDetailsModal";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { PaymentService } from "@/services/payment.service";
import {
  SubscriptionService,
  getPlanTypeFromName,
} from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { logger } from "@/utils/logger";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

export default function SettingsSubscription() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sub, setSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<
    "MONTHLY" | "YEARLY"
  >("MONTHLY");
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const { updateStep13 } = useArtistRegistrationV2Store();

  const loadSubscription = async () => {
    try {
      const [data, allPlans] = await Promise.all([
        SubscriptionService.getActiveSubscriptionWithPlan(),
        SubscriptionService.fetchSubscriptionPlans(),
      ]);
      setSub(data);
      
      // Sort plans: default plan first (similar to step-13)
      const sortedPlans = [...allPlans].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      });
      setPlans(sortedPlans);
      
      // Set initial billing cycle from current subscription
      if (data?.billingCycle) {
        setSelectedBillingCycle(data.billingCycle);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load subscription");
    }
  };

  useEffect(() => {
    (async () => {
      await loadSubscription();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscription();
    setRefreshing(false);
  };

  const toggleAutoRenew = async () => {
    if (!sub) return;
    setSaving(true);
    try {
      await SubscriptionService.toggleAutoRenew(sub.id, !sub.autoRenew);
      setSub({ ...sub, autoRenew: !sub.autoRenew });
    } catch (e: any) {
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
  const isCancelled =
    sub?.cancelAtPeriodEnd === true || sub?.autoRenew === false;

  // Find opposite plan (if Premium, show Studio; if Studio, show Premium)
  const oppositePlan = plans.find((p) => p.id !== sub?.planId);
  const isYearly = selectedBillingCycle === "YEARLY";
  const currentIsMonthly = sub?.billingCycle === "MONTHLY";

  const handleUpgradeToYearly = async () => {
    if (!sub || !plan) return;
    setUpgrading(true);
    try {
      // Get current user ID from session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const priceId = plan.stripeYearlyPriceId;
      if (!priceId) {
        throw new Error("Stripe price ID not configured for yearly plan");
      }

      const planType = getPlanTypeFromName(plan.name);
      const checkoutUrl = await PaymentService.createCheckoutSession({
        priceId,
        userId: session.user.id,
        planType,
        cycle: "YEARLY",
        returnToApp: true,
      });

      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        throw new Error(`Cannot open URL: ${checkoutUrl}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to start upgrade");
    } finally {
      setUpgrading(false);
    }
  };

  const handleUpgradeToOtherPlan = () => {
    if (!oppositePlan || !sub) return;
    // Ensure we use the selected billing cycle from the toggle
    // Use the current state value explicitly
    const billingCycle: "MONTHLY" | "YEARLY" =
      selectedBillingCycle || "MONTHLY";

    // Update store with both plan ID and billing cycle
    updateStep13({
      selectedPlanId: oppositePlan.id,
      billingCycle: billingCycle,
    });
    router.push("/(auth)/artist-registration/checkout");
  };

  const handleStartFreeTrial = async (planId: string) => {
    if (!planId) return;
    
    try {
      // Get current user ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const userId = session.user.id;

      // Check if user already has active subscription
      const hasActive = await SubscriptionService.hasActiveSubscription(userId);
      if (hasActive) {
        toast.success("You already have an active subscription");
        await loadSubscription();
        return;
      }

      // Create trial subscription
      await SubscriptionService.createUserSubscription(
        userId,
        planId,
        selectedBillingCycle || "MONTHLY",
        true // isTrial: true
      );

      toast.success("Free trial started! Enjoy Premium features for 30 days.");
      await loadSubscription();
    } catch (error: any) {
      logger.error("Free trial error:", error);
      toast.error(error?.message || "Failed to start free trial");
    }
  };

  const handleBuyPlan = async (planId: string) => {
    if (!planId) return;
    const picked = plans.find((p) => p.id === planId);
    if (!picked) {
      toast.error("Plan not found");
      return;
    }

    // Get Stripe price ID based on billing cycle
    const priceId = isYearly ? picked.stripeYearlyPriceId : picked.stripeMonthlyPriceId;

    if (!priceId) {
      toast.error("Stripe price ID not configured for this plan. Please contact support.");
      return;
    }

    // Get current user ID
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error("No authenticated user found");
      return;
    }

    const userId = session.user.id;
    const planType = getPlanTypeFromName(picked.name);
    const cycle = selectedBillingCycle || "MONTHLY";

    try {
      // Create checkout session
      const checkoutUrl = await PaymentService.createCheckoutSession({
        priceId,
        userId,
        planType,
        cycle,
        returnToApp: true,
      });

      // Open Stripe checkout URL
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        throw new Error(`Cannot open URL: ${checkoutUrl}`);
      }
    } catch (error: any) {
      logger.error("Checkout error:", error);
      toast.error(error?.message || "Failed to start checkout");
    }
  };

  const handleSubscribeFromNoSubscription = (planId: string) => {
    if (!planId) return;
    // Ensure we use the selected billing cycle from the toggle
    const billingCycle: "MONTHLY" | "YEARLY" =
      selectedBillingCycle || "MONTHLY";

    // Update store with both plan ID and billing cycle
    updateStep13({
      selectedPlanId: planId,
      billingCycle: billingCycle,
    });
    router.push("/(auth)/artist-registration/checkout");
  };

  const handleCancelSubscription = async () => {
    if (!sub) return;
    setCancelling(true);
    try {
      await SubscriptionService.toggleAutoRenew(sub.id, false);
      toast.success("Subscription cancelled successfully");
      // Add a small delay to ensure database updates are reflected
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadSubscription();
      setShowCancelModal(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!sub) return;
    setCancelling(true);
    try {
      await SubscriptionService.toggleAutoRenew(sub.id, true);
      toast.success("Subscription resumed successfully");
      // Add a small delay to ensure database updates are reflected
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadSubscription();
    } catch (e: any) {
      toast.error(e?.message || "Failed to resume subscription");
    } finally {
      setCancelling(false);
    }
  };

  const handleFeaturePress = (feature: any) => {
    if (feature.details) {
      setSelectedFeature(feature);
      setShowFeatureModal(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="bg-background min-h-screen"
      style={{
        flex: 1,
      }}
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
            gap: mvs(12),
            marginTop: mvs(24),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: s(8),
                  padding: s(14),
                }}
                className="bg-tat-darkMaroon border-gray"
              >
                <View
                  className="items-center"
                  style={{ marginBottom: mvs(12) }}
                >
                  <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
                </View>
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold text-center"
                  style={{ marginBottom: mvs(4) }}
                >
                  You haven't subscribed to any plan
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-error font-neueMedium text-center"
                >
                  Your profile will not be visible to public.
                </ScaledText>
              </View>
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
                      (
                      {isCancelled
                        ? "Ends on"
                        : isTrial
                          ? "Renews on"
                          : "Renews on"}{" "}
                      {new Date(nextDate).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      )
                    </ScaledText>
                  ) : null}
                </View>

                {/* <TouchableOpacity
                  onPress={toggleAutoRenew}
                  disabled={saving}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    columnGap: s(6),
                    marginTop: mvs(8),
                  }}
                >
                  <SVGIcons.AutoPlay
                    width={s(17)}
                    height={s(17)}
                    className={`${saving ? "animate-spin" : ""}`}
                  />
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-foreground font-neueMedium"
                  >
                    {saving
                      ? "Saving..."
                      : sub?.autoRenew
                        ? "Autopay enabled"
                        : "Autopay disabled"}
                  </ScaledText>
                </TouchableOpacity> */}
              </View>
            )}
          </View>

          {sub?.endDate ? (
            <>
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
                {sub?.autoRenew && sub?.plan ? (
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-green font-neueMedium"
                    style={{ marginTop: mvs(5) }}
                  >
                    {`Renews automatically at €${sub.plan.price} / ${sub.plan.billingPeriod?.toLowerCase() || selectedBillingCycle.toLowerCase()}`}
                  </ScaledText>
                ) : null}
              </ScaledText>
              {isCancelled && (
                <View
                  style={{
                    marginTop: mvs(8),
                    padding: s(12),
                    borderRadius: s(8),
                    backgroundColor: "rgba(174, 14, 14, 0.1)",
                    borderWidth: 1,
                    borderColor: "#AE0E0E",
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-error font-neueMedium text-center"
                  >
                    Your subscription is cancelled
                  </ScaledText>
                </View>
              )}
            </>
          ) : null}
          {sub && (
            <View
              style={{
                marginTop: mvs(12),
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {currentIsMonthly && !isTrial && (
                <TouchableOpacity
                  onPress={handleUpgradeToYearly}
                  disabled={upgrading}
                  className="flex-row items-center justify-center"
                  style={{ columnGap: s(4) }}
                >
                  <SVGIcons.Reload width={s(17)} height={s(17)} />
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-foreground font-montserratSemibold"
                  >
                    {upgrading ? "Processing..." : "Upgrade to yearly"}
                  </ScaledText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={
                  isCancelled
                    ? handleResumeSubscription
                    : () => setShowCancelModal(true)
                }
                disabled={cancelling}
                className="flex-row items-center justify-center"
                style={{ columnGap: s(4), opacity: cancelling ? 0.6 : 1 }}
              >
                {isCancelled ? (
                  <>
                    <SVGIcons.ReloadGreen width={s(16)} height={s(16)} />
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-success font-montserratSemibold"
                    >
                      {cancelling ? "Resuming..." : "Resume subscription"}
                    </ScaledText>
                  </>
                ) : (
                  <>
                    <SVGIcons.CloseRed width={s(16)} height={s(16)} />
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-error font-montserratSemibold"
                    >
                      Cancel subscription
                    </ScaledText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Line */}
          <View
            className="h-[0.5px] bg-gray"
            style={{ marginVertical: mvs(12) }}
          />

          {/* Billing Cycle Toggle */}
          <View
            className="flex-row items-center justify-center"
            style={{ marginBottom: mvs(10), gap: mvs(8), marginTop: mvs(12) }}
          >
            <TouchableOpacity
              onPress={() => setSelectedBillingCycle("MONTHLY")}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(5),
                paddingHorizontal: s(30),
                minWidth: s(98),
                borderWidth: 1,
                borderColor:
                  selectedBillingCycle === "MONTHLY"
                    ? "transparent"
                    : "#a49a99",
                backgroundColor:
                  selectedBillingCycle === "MONTHLY"
                    ? "#AE0E0E"
                    : "transparent",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-center font-neueLight"
                style={{ color: "#FFFFFF" }}
              >
                Monthly
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedBillingCycle("YEARLY")}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(5),
                paddingHorizontal: s(30),
                minWidth: s(98),
                borderWidth: 1,
                borderColor:
                  selectedBillingCycle === "YEARLY" ? "transparent" : "#a49a99",
                backgroundColor:
                  selectedBillingCycle === "YEARLY" ? "#AE0E0E" : "transparent",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-center font-neueLight"
                style={{ color: "#FFFFFF" }}
              >
                Annually
              </ScaledText>
            </TouchableOpacity>
          </View>

          {/* Plans Display */}
          {!loading && (
            <>
              {/* Show all plans when no subscription */}
              {!sub && plans.length > 0 && (
                <View style={{ gap: mvs(16) }}>
                  {plans.map((plan) => {
                    const planName = (plan.name || "").toLowerCase();
                    const accentColor = planName.includes("premium")
                      ? "#f79410"
                      : planName.includes("studio")
                        ? "#AE0E0E"
                        : "#080101";
                    const price = isYearly
                      ? plan.yearlyPrice
                      : plan.monthlyPrice;
                    const unit = isYearly ? "year" : "month";
                    const isDefaultPlan = plan.isDefault;
                    const showTrialCta = isDefaultPlan;

                    return (
                      <View
                        key={plan.id}
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
                                style={{ color: accentColor, marginLeft: s(6) }}
                              >
                                {plan.name}
                              </ScaledText>
                            </View>
                            <View className="flex-row items-end mt-2">
                              <ScaledText
                                allowScaling={false}
                                variant="6xl"
                                className="font-neueBold "
                                style={{
                                  color: "#080101",
                                  lineHeight: mvs(40),
                                  marginTop: mvs(2),
                                }}
                              >
                                €{price}/
                              </ScaledText>
                              <ScaledText
                                allowScaling={false}
                                variant="lg"
                                className="font-neueMedium"
                                style={{ color: "#080101", marginLeft: s(2) }}
                              >
                                {unit}
                              </ScaledText>
                            </View>
                            <ScaledText
                              allowScaling={false}
                              variant="11"
                              className="font-neueLightItalic"
                              style={{ color: "#080101", marginTop: mvs(6) }}
                            >
                              {plan.description}
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
                              {(() => {
                                const features = isYearly ? plan.yearlyFeatures : plan.monthlyFeatures;
                                return Array.isArray(features) &&
                                features.length > 0 ? (
                                  features.map(
                                    (feature: any, idx: number) => (
                                      <TouchableOpacity
                                        key={idx}
                                        onPress={() => handleFeaturePress(feature)}
                                        disabled={!feature.details}
                                        activeOpacity={feature.details ? 0.7 : 1}
                                        className="flex-row items-center mb-1"
                                      >
                                        <ScaledText
                                          allowScaling={false}
                                          variant="11"
                                          className="font-neueLight text-background"
                                          style={{
                                            textDecorationLine: feature.details
                                              ? "underline"
                                              : "none",
                                          }}
                                        >
                                          {feature.text}
                                        </ScaledText>
                                      </TouchableOpacity>
                                    )
                                  )
                                ) : (
                                  <ScaledText
                                    allowScaling={false}
                                    variant="11"
                                    style={{ color: "#080101" }}
                                  >
                                    No features listed
                                  </ScaledText>
                                );
                              })()}
                            </View>
                          </View>

                          {/* CTAs */}
                          <View style={{ marginTop: mvs(16) }}>
                            {showTrialCta ? (
                              <>
                                {/* Start free trial button */}
                                <TouchableOpacity
                                  activeOpacity={0.9}
                                  onPress={() => handleStartFreeTrial(plan.id)}
                                  disabled={upgrading}
                                  style={{
                                    backgroundColor: "#AE0E0E",
                                    paddingVertical: mvs(12),
                                    borderRadius: 38,
                                    alignItems: "center",
                                  }}
                                >
                                  <ScaledText
                                    allowScaling={false}
                                    variant="body2"
                                    style={{ color: "#FFFFFF" }}
                                    className="font-neueMedium"
                                  >
                                    {upgrading ? "Processing..." : "Start free trial"}
                                  </ScaledText>
                                </TouchableOpacity>

                                {/* Buy Premium button */}
                                <TouchableOpacity
                                  activeOpacity={0.8}
                                  onPress={() => handleBuyPlan(plan.id)}
                                  disabled={upgrading}
                                  style={{
                                    paddingVertical: mvs(10),
                                    alignItems: "center",
                                  }}
                                >
                                  <ScaledText
                                    allowScaling={false}
                                    variant="body2"
                                    style={{ color: "#AE0E0E" }}
                                    className="font-neueMedium"
                                  >
                                    {upgrading ? "Processing..." : "Buy Premium"}
                                  </ScaledText>
                                </TouchableOpacity>
                              </>
                            ) : (
                              /* Subscribe button for non-default plans */
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() =>
                                  handleSubscribeFromNoSubscription(plan.id)
                                }
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
                                  Subscribe
                                </ScaledText>
                              </TouchableOpacity>
                            )}
                          </View>
                        </LinearGradient>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Show opposite plan when subscribed */}
              {sub && oppositePlan && (
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
                          style={{
                            color: oppositePlan.name
                              ?.toLowerCase()
                              .includes("studio")
                              ? "#AE0E0E"
                              : "#f79410",
                            marginLeft: s(6),
                          }}
                        >
                          {oppositePlan.name}
                        </ScaledText>
                      </View>
                      <View className="flex-row items-end mt-2">
                        <ScaledText
                          allowScaling={false}
                          variant="6xl"
                          className="font-neueBold "
                          style={{
                            color: "#080101",
                            lineHeight: mvs(40),
                            marginTop: mvs(2),
                          }}
                        >
                          €
                          {isYearly
                            ? oppositePlan.yearlyPrice
                            : oppositePlan.monthlyPrice}
                          /
                        </ScaledText>
                        <ScaledText
                          allowScaling={false}
                          variant="lg"
                          className="font-neueMedium"
                          style={{ color: "#080101", marginLeft: s(2) }}
                        >
                          {isYearly ? "year" : "month"}
                        </ScaledText>
                      </View>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="font-neueLightItalic"
                        style={{ color: "#080101", marginTop: mvs(6) }}
                      >
                        {oppositePlan.description}
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
                        {(() => {
                          const features = isYearly ? oppositePlan.yearlyFeatures : oppositePlan.monthlyFeatures;
                          return Array.isArray(features) &&
                          features.length > 0 ? (
                            features.map(
                              (feature: any, idx: number) => (
                                <TouchableOpacity
                                  key={idx}
                                  onPress={() => handleFeaturePress(feature)}
                                  disabled={!feature.details}
                                  activeOpacity={feature.details ? 0.7 : 1}
                                  className="flex-row items-center mb-1"
                                >
                                  <ScaledText
                                    allowScaling={false}
                                    variant="11"
                                    className="text-background font-neueLight"
                                    style={{
                                      textDecorationLine: feature.details
                                        ? "underline"
                                        : "none",
                                    }}
                                  >
                                    {feature.text}
                                  </ScaledText>
                                </TouchableOpacity>
                              )
                            )
                          ) : (
                            <ScaledText
                              allowScaling={false}
                              variant="11"
                              style={{ color: "#080101" }}
                            >
                              No features listed
                            </ScaledText>
                          );
                        })()}
                      </View>
                    </View>

                    <View style={{ marginTop: mvs(8) }}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleUpgradeToOtherPlan}
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
                          Upgrade to {oppositePlan.name}
                        </ScaledText>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>
      {/* Cancel Subscription Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelling && setShowCancelModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !cancelling && setShowCancelModal(false)}
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
                onPress={handleCancelSubscription}
                disabled={cancelling}
                className="rounded-full items-center justify-center flex-row border-primary"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  borderWidth: s(1),
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-primary font-montserratSemibold"
                >
                  {cancelling ? "Cancelling..." : "Cancel plan"}
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => !cancelling && setShowCancelModal(false)}
                disabled={cancelling}
                className="rounded-full items-center justify-center flex-row"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratSemibold"
                >
                  Don't cancel
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Feature Details Modal */}
      <FeatureDetailsModal
        visible={showFeatureModal}
        onClose={() => {
          setShowFeatureModal(false);
          setSelectedFeature(null);
        }}
        feature={selectedFeature}
      />
    </KeyboardAvoidingView>
  );
}
