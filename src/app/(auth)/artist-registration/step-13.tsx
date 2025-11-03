import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  SubscriptionPlan,
  SubscriptionService,
} from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import type { CompleteArtistRegistration } from "@/types/auth";
import { WorkArrangement } from "@/types/auth";
import { isValid, step13Schema } from "@/utils/artistRegistrationValidation";
import { logger } from "@/utils/logger";
import { mvs, s, scaledFont } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

// Skeleton component that mirrors the Subscription plan block layout and sizing exactly
function PlanLoadingSkeleton() {
  return (
    <View className="mb-4 p-6 rounded-2xl border-2 border-gray bg-black/40">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <View className="w-36 h-7 bg-gray/30 rounded mb-2" />
          <View className="w-28 h-5 bg-gray/20 rounded mb-1" />
          <View className="w-36 h-4 bg-gray/20 rounded" />
        </View>
      </View>
      {/* Features skeleton */}
      <View style={{ gap: mvs(8) }}>
        <View className="w-20 h-3 bg-gray/20 rounded mb-2" />
        <View className="flex-row items-center mb-2">
          <View className="w-24 h-3 bg-gray/30 rounded" />
        </View>
        <View className="flex-row items-center mb-2">
          <View className="w-32 h-3 bg-gray/20 rounded" />
        </View>
        {/* Trial badge skeleton */}
        <View className="flex-row items-center mt-2">
          <View className="w-24 h-4 bg-gray/30 rounded" />
        </View>
      </View>
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
  const { completeArtistRegistration } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStepDisplay(13);
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const fetchedPlans = await SubscriptionService.fetchSubscriptionPlans();
      setPlans(fetchedPlans);

      // Auto-select Premium plan (default)
      const premiumPlan = fetchedPlans.find((p) => p.isDefault);
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

  const handleBillingToggle = () => {
    const newCycle = step13.billingCycle === "MONTHLY" ? "YEARLY" : "MONTHLY";
    updateStep13({ billingCycle: newCycle });
  };

  const handleCompleteRegistration = async () => {
    if (!step13.selectedPlanId) {
      toast.error("Please select a subscription plan");
      return;
    }

    setSubmitting(true);
    try {
      // Get all registration data from store
      const {
        step3,
        step4,
        step5,
        step7,
        step8,
        step9,
        step10,
        step11,
        step12,
      } = useArtistRegistrationV2Store.getState();

      const registrationData: CompleteArtistRegistration = {
        step3: {
          firstName: step3.firstName || "",
          lastName: step3.lastName || "",
          avatar: step3.avatar || "",
        },
        step4: {
          workArrangement: step4.workArrangement || WorkArrangement.FREELANCE,
        },
        step5: {
          studioName: step5.studioName || "",
          province: step5.province || "",
          provinceId: step5.provinceId || "",
          municipalityId: step5.municipalityId || "",
          municipality: step5.municipality || "",
          studioAddress: step5.studioAddress || "",
          website: step5.website || "",
          phone: step5.phone || "",
        },
        step6: {
          certificateUrl: step4.certificateUrl || "",
        },
        step7: {
          bio: step7.bio || "",
          instagram: step7.instagram || "",
          tiktok: step7.tiktok || "",
        },
        step8: {
          favoriteStyles: step8.favoriteStyles || [],
          mainStyleId: step8.mainStyleId || "",
        },
        step9: {
          servicesOffered: step9.servicesOffered || [],
        },
        step10: {
          bodyParts: step10.bodyParts || [],
        },
        step11: {
          minimumPrice: step11.minimumPrice || 0,
          hourlyRate: step11.hourlyRate || 0,
        },
        step12: {
          projects: (step12.projects || []).map((project, index) => ({
            title: project.title,
            description: project.description,
            photos: project.photos,
            videos: project.videos,
            associatedStyles: [],
            order: index + 1,
          })),
        },
        step13: {
          selectedPlanId: step13.selectedPlanId,
          billingCycle: step13.billingCycle,
        },
      };

      // Complete registration
      await completeArtistRegistration(registrationData);

      // Get current user ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      // Create subscription
      await SubscriptionService.createUserSubscription(
        session.user.id,
        step13.selectedPlanId,
        step13.billingCycle
      );

      // Reset store and redirect to home
      // reset();
      router.replace("/(tabs)");
    } catch (error) {
      logger.error("Registration error:", error);

      // Extract meaningful error message
      let errorMessage = "Failed to complete registration. Please try again.";

      if (error instanceof Error) {
        // Check for specific error patterns
        if (
          error.message.includes("duplicate") ||
          error.message.includes("already exists")
        ) {
          errorMessage =
            "Some information already exists. Your profile has been updated.";
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
    <View className="flex-1 bg-black">
      {/* Header */}
      <AuthStepHeader />

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
          name="Choose your plan"
          icon={<SVGIcons.Wallet width={20} height={20} />}
          nameVariant="2xl"
        />

        {/* Billing Toggle */}
        <View style={{ paddingHorizontal: s(24), marginBottom: mvs(20) }}>
          <View
            className="flex-row items-center justify-center"
            style={{ gap: mvs(10) }}
          >
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: "MONTHLY" })}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(6),
                paddingHorizontal: s(20),
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
                Monthly
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: "YEARLY" })}
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(6),
                paddingHorizontal: s(20),
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
                Annually
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        <View style={{ paddingHorizontal: s(24), gap: mvs(16) }}>
          {loading ? (
            // Render as many skeletons as number of plans you'd expect, or fallback to 2
            <>
              {[...Array(Math.max(plans.length, 2))].map((_, i) => (
                <PlanLoadingSkeleton key={i} />
              ))}
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
                    borderRadius: 8,
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
                      Includes:
                    </ScaledText>
                    <View>
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.map((feature: any, idx: number) => (
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

                  {/* CTAs */}
                  <View style={{ marginTop: mvs(16) }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
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
                        {showTrialCta ? "Start free trial" : "Get started"}
                      </ScaledText>
                    </TouchableOpacity>

                    {showTrialCta && (
                      <TouchableOpacity
                        activeOpacity={0.8}
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
                          Buy Premium
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

      {/* Footer */}
      <NextBackFooter
        onNext={handleCompleteRegistration}
        nextLabel={submitting ? "Saving..." : "Almost there!"}
        nextDisabled={loading || submitting || !canProceed}
        backLabel="Back"
        onBack={() => router.back()}
      />
    </View>
  );
}
