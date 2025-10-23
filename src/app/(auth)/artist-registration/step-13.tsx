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
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
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
      console.error("Error fetching plans:", error);
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
      console.error("Registration error:", error);
      toast.error("Failed to complete registration. Please try again.");
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
          icon={<SVGIcons.Wallet width={22} height={22} />}
        />

        {/* Billing Toggle */}
        <View style={{ paddingHorizontal: s(24), marginBottom: mvs(20) }}>
          <View
            className="flex-row items-center justify-center rounded-full p-1"
            style={{ gap: mvs(10) }}
          >
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: "MONTHLY" })}
              className={`flex-1 py-2 px-8 rounded-full border ${step13.billingCycle === "MONTHLY" ? "bg-primary border-transparent" : "bg-transparent border-foreground"}`}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className={`text-center font--nfont-neueMedium text-foreground`}
              >
                Monthly
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: "YEARLY" })}
              className={`flex-1 py-2 px-8 rounded-full border ${step13.billingCycle === "YEARLY" ? "bg-primary border-transparent" : "bg-transparent border-foreground"}`}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className={`text-center font-neueMedium text-foreground`}
              >
                Yearly
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        <View style={{ paddingHorizontal: s(24) }}>
          {loading ? (
            // Render as many skeletons as number of plans you'd expect, or fallback to 2
            <>
              {[...Array(Math.max(plans.length, 2))].map((_, i) => (
                <PlanLoadingSkeleton key={i} />
              ))}
            </>
          ) : (
            plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => handlePlanSelect(plan.id)}
                disabled={loading}
                className={`mb-4 p-6 rounded-2xl border-2 ${
                  step13.selectedPlanId === plan.id
                    ? "border-primary bg-primary/10"
                    : "border-gray bg-black/40"
                }`}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1">
                    <ScaledText
                      allowScaling={false}
                      variant="xl"
                      className="text-foreground font-neueMedium"
                    >
                      Piano {plan.name}
                    </ScaledText>
                    <View className="flex-row items-end mb-1">
                      <ScaledText
                        allowScaling={false}
                        variant="5xl"
                        className="text-foreground font-neueBold"
                      >
                        €{isYearly ? plan.yearlyPrice : plan.monthlyPrice}/
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="lg"
                        className="text-foreground"
                      >
                        {isYearly ? "year" : "month"}
                      </ScaledText>
                    </View>
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-foreground italic"
                    >
                      {plan.description}
                    </ScaledText>
                  </View>
                </View>

                {/* Features */}
                <View style={{ gap: mvs(8) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-foreground font-neueSemibold"
                  >
                    Includes
                  </ScaledText>
                  <View className="flex-row items-center">
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-foreground"
                    >
                      {plan.features.canUploadVideos
                        ? "Video uploads"
                        : "Image uploads only"}
                    </ScaledText>
                  </View>
                  <View className="flex-row items-center">
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-foreground"
                    >
                      {plan.features.canCreateStudio
                        ? "Studio creation"
                        : "No studio features"}
                    </ScaledText>
                  </View>
                  {plan.freeTrialDays > 0 && (
                    <View className="flex-row items-center mt-2">
                      <ScaledText
                        allowScaling={false}
                        variant="body2"
                        className="text-success font-neueBold"
                      >
                        {plan.freeTrialDays} days free trial
                      </ScaledText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <NextBackFooter
        onNext={handleCompleteRegistration}
        nextLabel={submitting ? "Saving..." : "save"}
        nextDisabled={loading || submitting || !canProceed}
        backLabel="Back"
        onBack={() => router.back()}
      />
    </View>
  );
}
