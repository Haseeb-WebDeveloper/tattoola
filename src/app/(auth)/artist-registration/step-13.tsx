import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { PaymentService } from "@/services/payment.service";
import {
  SubscriptionPlan,
  SubscriptionService,
  getPlanTypeFromName,
} from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step13Schema } from "@/utils/artistRegistrationValidation";
import { logger } from "@/utils/logger";
import { mvs, s, scaledFont } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

// Skeleton that closely matches the plan card (layout, sizes, gradient)
function PlanLoadingSkeleton({ accent }: { accent: string }) {
  return (
    <View
      className="rounded-2xl"
      style={{ borderWidth: 1, borderColor: "#a49a99", borderRadius: 8 }}
    >
      <LinearGradient
        colors={["#FFFFFF", "#FFCACA"]}
        locations={[0.0095, 0.995]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 8, paddingVertical: mvs(16), paddingHorizontal: s(16) }}
      >
        <View className="mb-4">
          {/* Title row */}
          <View className="flex-row items-center">
            <View style={{ width: s(45), height: mvs(24), borderRadius: 4, backgroundColor: "#E8E0E0" }} />
            <View style={{ width: s(80), height: mvs(24), borderRadius: 4, marginLeft: s(6), backgroundColor: accent }} />
          </View>
          {/* Price row */}
          <View className="flex-row items-end mt-2">
            <View style={{ width: s(90), height: mvs(34), borderRadius: 6, backgroundColor: "#E8E0E0" }} />
            <View style={{ width: s(40), height: mvs(18), borderRadius: 4, marginLeft: s(6), backgroundColor: "#E8E0E0" }} />
          </View>
          {/* Description */}
          <View style={{ width: s(180), height: mvs(16), borderRadius: 4, marginTop: mvs(6), backgroundColor: "#E8E0E0" }} />
        </View>

        {/* Includes */}
        <View style={{ gap: mvs(8) }}>
          <View style={{ width: s(60), height: mvs(14), borderRadius: 4, backgroundColor: "#E8E0E0" }} />
          <View style={{ width: s(180), height: mvs(12), borderRadius: 4, backgroundColor: "#F0E8E8" }} />
          <View style={{ width: s(160), height: mvs(12), borderRadius: 4, backgroundColor: "#E8E0E0", marginTop: mvs(6) }} />
          <View style={{ width: s(140), height: mvs(12), borderRadius: 4, backgroundColor: "#F0E8E8", marginTop: mvs(6) }} />
        </View>

        {/* CTA area */}
        <View style={{ marginTop: mvs(16) }}>
          <View
            style={{ backgroundColor: "#AE0E0E", paddingVertical: mvs(12), borderRadius: 38 }}
          />
          <View style={{ paddingVertical: mvs(10) }} />
        </View>
      </LinearGradient>
    </View>
  );
}

export default function ArtistStep13V2() {
  const {
    step13,
    updateStep13,
    totalStepsDisplay,
    setCurrentStepDisplay,
    reset,
  } = useArtistRegistrationV2Store();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStepDisplay(13);
    fetchPlans();
  }, []);

  useEffect(() => {
    toast.success("🎉 All set!  Pick a plan to get started.");
  }, []);

  const fetchPlans = async () => {
    try {
      const fetchedPlans = await SubscriptionService.fetchSubscriptionPlans();
      
      // Sort plans: default plan (with free trial) first
      const sortedPlans = [...fetchedPlans].sort((a, b) => {
        // If one is default and the other isn't, default comes first
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        // If both are default or both aren't, maintain original order
        return 0;
      });
      
      setPlans(sortedPlans);

      // Auto-select Premium plan (default)
      const premiumPlan = sortedPlans.find((p) => p.isDefault);
      if (premiumPlan) {
        updateStep13({ selectedPlanId: premiumPlan.id });
      }
    } catch (error) {
      logger.error("Error fetching plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    updateStep13({ selectedPlanId: planId });
  };


  const handleSubscribe = async (planId: string, action: 'trial' | 'buy' | 'studio' = 'trial') => {
    if (submitting) return;
    // Persist selected plan locally as well
    updateStep13({ selectedPlanId: planId });

    setSubmitting(true);
    try {
      const picked = plans.find((p) => p.id === planId);
      if (!picked) {
        throw new Error("Plan not found");
      }

      const planName = (picked.name || '').toLowerCase();
      const isStudio = planName.includes('studio');

      // Get current user ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const userId = session.user.id;

      // Scenario C: Studio plan - navigate to checkout screen
      if (isStudio || action === 'studio') {
        router.push('/(auth)/artist-registration/checkout');
        return;
      }

      // Scenario A: Start free trial (Premium plan)
      if (action === 'trial') {
        // Check if user already has active subscription
        const hasActive = await SubscriptionService.hasActiveSubscription(userId);
        if (hasActive) {
          toast.success("You already have an active subscription");
          router.replace("/(tabs)");
          return;
        }

        // Create trial subscription
        await SubscriptionService.createUserSubscription(
          userId,
          planId,
          step13.billingCycle,
          true // isTrial: true
        );

        toast.success("Free trial started! Enjoy Premium features for 30 days.");
        router.replace("/(tabs)");
        return;
      }

      // Scenario B: Buy Premium (immediate payment)
      if (action === 'buy') {
        // Get Stripe price ID based on billing cycle
        const isYearly = step13.billingCycle === 'YEARLY';
        const priceId = isYearly ? picked.stripeYearlyPriceId : picked.stripeMonthlyPriceId;

        if (!priceId) {
          throw new Error("Stripe price ID not configured for this plan. Please contact support.");
        }

        // Determine plan type
        const planType = getPlanTypeFromName(picked.name);
        const cycle = step13.billingCycle;

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
        return;
      }
    } catch (error) {
      logger.error("Subscription error:", error);

      // Extract meaningful error message
      let errorMessage = "Failed to process subscription. Please try again.";

      if (error instanceof Error) {
        // Check for specific error patterns
        if (
          error.message.includes("duplicate") ||
          error.message.includes("already exists")
        ) {
          errorMessage = "You already have an active subscription.";
        } else if (
          error.message.includes("foreign key") ||
          error.message.includes("violates")
        ) {
          errorMessage = "Invalid data provided. Please check your entries.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          error.message.includes("column") &&
          error.message.includes("does not exist")
        ) {
          errorMessage =
            "Database configuration error. Please contact support.";
          logger.error("Database schema mismatch:", error.message);
        } else if (
          error.message.includes("cache") ||
          error.message.includes("schema")
        ) {
          errorMessage = "Database sync error. Please try again in a moment.";
          logger.error("Database cache/schema error:", error.message);
        } else if (error.message) {
          // Use the actual error message if it's user-friendly (max 100 chars)
          errorMessage =
            error.message.length > 100
              ? error.message.substring(0, 100) + "..."
              : error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === step13.selectedPlanId);
  const isYearly = step13.billingCycle === "YEARLY";
  const canProceed = isValid(step13Schema, {
    selectedPlanId: step13.selectedPlanId || "",
  });

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <AuthStepHeader
        onClose={() => {
          if (step13?.selectedPlanId) {
            router.replace("/(auth)/artist-registration/tattoola-pro");
          } else {
            router.replace("/(auth)/welcome");
          }
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: mvs(20),
        }}
      >
        {/* Progress */}
        <RegistrationProgress
          currentStep={13}
          totalSteps={totalStepsDisplay}
          name="Scegli il tuo piano"
          icon={<SVGIcons.Wallet width={20} height={20} />}
          nameVariant="2xl"
        />

        {/* Billing Toggle */}
        <View style={{ paddingHorizontal: s(24), marginBottom: mvs(20) }}>
          <View
            className="flex-row items-center justify-center"
            style={{ gap: mvs(8) }}
          >
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: "MONTHLY" })}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(5),
                paddingHorizontal: s(30),
                minWidth: s(98),
                borderWidth: 1,
                borderColor: step13.billingCycle === "MONTHLY" ? "transparent" : "#a49a99",
                backgroundColor: step13.billingCycle === "MONTHLY" ? "#AE0E0E" : "transparent",
              }}  
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-center font-neueLight"
                style={{ color: "#FFFFFF" }}
              >
                Mensile
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: "YEARLY" })}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(5),
                paddingHorizontal: s(30),
                minWidth: s(98),
                borderWidth: 1,
                borderColor: step13.billingCycle === "YEARLY" ? "transparent" : "#a49a99",
                backgroundColor: step13.billingCycle === "YEARLY" ? "#AE0E0E" : "transparent",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-center font-neueLight"
                style={{ color: "#FFFFFF" }}
              >
                Annuale
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        <View style={{ paddingHorizontal: s(24), gap: mvs(16) }}>
          {loading ? (
            <>
              <PlanLoadingSkeleton accent="#f79410" />
              <PlanLoadingSkeleton accent="#AE0E0E" />
            </>
          ) : (
            plans.map((plan) => {
              const planName = (plan.name || "").toLowerCase();
              const accentColor = planName.includes("premium")
                ? "#f79410"
                : planName.includes("studio")
                ? "#AE0E0E"
                : "#080101";
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const unit = isYearly ? "year" : "month";
              const showTrialCta = planName.includes("premium");

              return (
                <TouchableOpacity
                  activeOpacity={1}
                  key={plan.id}
                  onPress={() => handlePlanSelect(plan.id)}
                  disabled={loading}
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
                      borderRadius: 8,
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
                        style={{ color: "#080101", lineHeight: scaledFont(38) }}
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
                      Include:
                    </ScaledText>
                    <View>
                      {(() => {
                        const features = isYearly ? plan.yearlyFeatures : plan.monthlyFeatures;
                        return Array.isArray(features) && features.length > 0 ? (
                          features.map((feature: any, idx: number) => (
                            <View key={idx} className="flex-row items-center mb-1">
                              <ScaledText
                                allowScaling={false}
                                variant="11"
                                className="font-neueLight"
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
                            Nessuna funzionalità elencata
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
                          onPress={() => handleSubscribe(plan.id, 'trial')}
                          disabled={submitting}
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
                            {submitting ? "Salvataggio..." : "Inizia prova gratuita"}
                          </ScaledText>
                        </TouchableOpacity>

                        {/* Buy Premium button */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSubscribe(plan.id, 'buy')}
                          disabled={submitting}
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
                            {submitting ? "Elaborazione..." : "Acquista Premium"}
                          </ScaledText>
                        </TouchableOpacity>
                      </>
                    ) : (
                      /* Studio plan - Get started button */
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleSubscribe(plan.id, 'studio')}
                        disabled={submitting}
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
                          {submitting ? "Elaborazione..." : "Inizia"}
                        </ScaledText>
                      </TouchableOpacity>
                    )}
                  </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
