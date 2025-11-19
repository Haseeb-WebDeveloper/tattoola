import { CustomToast } from "@/components/ui/CustomToast";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { PaymentService } from "@/services/payment.service";
import {
  SubscriptionService,
  getPlanTypeFromName,
} from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { mvs, s, scaledFont } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Linking, ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

export default function ArtistCheckoutScreen() {
  const { step13 } = useArtistRegistrationV2Store();
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await SubscriptionService.fetchSubscriptionPlans();
        setPlans(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const plan = useMemo(
    () => plans.find((p) => p.id === step13.selectedPlanId),
    [plans, step13.selectedPlanId]
  );

  const isYearly = step13.billingCycle === "YEARLY";
  const price = plan ? (isYearly ? plan.yearlyPrice : plan.monthlyPrice) : 0;
  const unit = isYearly ? "year" : "month";
  const planName = (plan?.name || "").toLowerCase();
  const accentColor = planName.includes("studio")
    ? "#AE0E0E"
    : planName.includes("premium")
      ? "#f79410"
      : "#080101";

  const renewsOn = useMemo(() => {
    const d = new Date();
    if (isYearly) d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d;
  }, [isYearly]);

  const handleCheckout = async () => {
    // Validate user is authenticated
    if (!user?.id) {
      const toastId = toast.custom(
        <CustomToast
          message="Please sign in to continue"
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
      return;
    }

    // Validate plan is selected
    if (!plan) {
      const toastId = toast.custom(
        <CustomToast
          message="Please select a subscription plan"
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
      return;
    }

    // Get Stripe price ID based on billing cycle
    const priceId = isYearly
      ? plan.stripeYearlyPriceId
      : plan.stripeMonthlyPriceId;

    if (!priceId) {
      const toastId = toast.custom(
        <CustomToast
          message="Stripe price ID not configured for this plan. Please contact support."
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 5000 }
      );
      return;
    }

    // Determine plan type
    const planType = getPlanTypeFromName(plan.name);
    const cycle = isYearly ? "YEARLY" : "MONTHLY";

    setCheckoutLoading(true);

    try {
      // Create checkout session
      const checkoutUrl = await PaymentService.createCheckoutSession({
        priceId,
        userId: user.id,
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
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start checkout. Please try again.";
      const toastId = toast.custom(
        <CustomToast
          message={errorMessage}
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 5000 }
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4" style={{ marginTop: mvs(15) }}>
        <View className="flex flex-row items-center justify-start">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full items-center justify-center"
            style={{
              width: s(32),
              height: s(32),
              backgroundColor: "#FFFFFF1A",
            }}
          >
            <SVGIcons.ChevronLeft width={s(12)} height={s(12)} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: mvs(20) }}
      >
        {/* Title */}
        <View
          style={{
            paddingHorizontal: s(24),
            marginTop: mvs(12),
            marginBottom: mvs(24),
          }}
        >
          <View
            className="flex-row items-center justify-center"
            style={{ gap: s(8) }}
          >
            <SVGIcons.Wallet width={s(18)} height={s(18)} />
            <ScaledText
              allowScaling={false}
              variant="2xl"
              className="text-foreground font-neueBold"
            >
              Checkout
            </ScaledText>
          </View>
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground text-center font-neueLight"
            style={{ marginTop: mvs(3) }}
          >
            Review your plan and complete payment.
          </ScaledText>
        </View>

        {/* Summary Card */}
        <View style={{ paddingHorizontal: s(24) }}>
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
              <View>
                <View className="flex-row items-center">
                  <ScaledText
                    allowScaling={false}
                    variant="20"
                    className="font-neueMedium"
                    style={{ color: "#080101" }}
                  >
                    Piano
                  </ScaledText>
                  <ScaledText
                    allowScaling={false}
                    variant="20"
                    className="font-neueMedium"
                    style={{ color: accentColor, marginLeft: s(6) }}
                  >
                    {plan?.name || "Studio"}
                  </ScaledText>
                </View>
                <View
                  className="flex-row items-end"
                  style={{ marginTop: mvs(9) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="6xl"
                    className="font-neueBold"
                    style={{ lineHeight: scaledFont(30) }}
                  >
                    €{price}
                  </ScaledText>
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="font-neueLight w-full ml-2"
                    style={{ paddingBottom: mvs(2) }}
                  >
                    renews on{" "}
                    {renewsOn.toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </ScaledText>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Divider */}
        <View style={{ paddingHorizontal: s(24), marginTop: mvs(16) }}>
          <View
            style={{
              height: s(0.5),
              backgroundColor: "#A49A99",
              marginVertical: mvs(8),
            }}
          />
        </View>

        {/* Breakdown */}
        <View style={{ paddingHorizontal: s(24), marginTop: mvs(16) }}>
          <View
            className="rounded-2xl border-gray"
            style={{
              borderWidth: s(0.5),
              borderRadius: s(12),
              paddingHorizontal: s(28),
              paddingVertical: mvs(20),
            }}
          >
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: mvs(12) }}
            >
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                >
                  Base price
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-gray font-neueLight"
                >
                  Billed {isYearly ? "annually" : "monthly"}
                </ScaledText>
              </View>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                €{price}
              </ScaledText>
            </View>
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: mvs(12) }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                Trial Discount
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                €0
              </ScaledText>
            </View>
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: mvs(12) }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                Tax
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                €0
              </ScaledText>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: "#2A2A2A",
                marginVertical: mvs(8),
              }}
            />
            <View className="flex-row items-center justify-between">
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                Total
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                €{price}
              </ScaledText>
            </View>
          </View>
          <ScaledText
            allowScaling={false}
            variant="11"
            className="text-gray text-center font-neueLightItalic"
            style={{ marginTop: mvs(10) }}
          >
            Cancel anytime before trial ends to avoid charges.
          </ScaledText>
        </View>

        {/* CTA */}
        <View
          style={{ paddingHorizontal: s(24), marginTop: mvs(52), gap: mvs(12) }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            className="rounded-full items-center justify-center flex-row"
            style={{
              backgroundColor: checkoutLoading ? "#AD2E2E80" : "#AD2E2E",
              paddingVertical: mvs(12),
            }}
            onPress={handleCheckout}
            disabled={checkoutLoading || !plan || !user}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueMedium"
            >
              {checkoutLoading ? "Processing..." : "Checkout with Stripe"}
            </ScaledText>
          </TouchableOpacity>

          {/* Payment brands */}
          <View
            className="flex-row items-center justify-center"
            style={{ gap: s(10), marginTop: mvs(10) }}
          >
            <SVGIcons.Visa width={s(36)} height={s(22)} />
            <SVGIcons.Mastercard width={s(36)} height={s(22)} />
            <SVGIcons.AmericanExpress width={s(36)} height={s(22)} />
            <SVGIcons.Paypal width={s(36)} height={s(22)} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
