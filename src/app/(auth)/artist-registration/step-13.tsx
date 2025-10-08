import { useAuth } from "@/providers/AuthProvider";
import { SubscriptionPlan, SubscriptionService } from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import type { CompleteArtistRegistration } from "@/types/auth";
import { WorkArrangement } from "@/types/auth";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ArtistStep13V2() {
  const { step13, updateStep13, totalStepsDisplay, setCurrentStepDisplay, reset } = useArtistRegistrationV2Store();
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
      const premiumPlan = fetchedPlans.find(p => p.isDefault);
      if (premiumPlan) {
        updateStep13({ selectedPlanId: premiumPlan.id });
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    updateStep13({ selectedPlanId: planId });
  };

  const handleBillingToggle = () => {
    const newCycle = step13.billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY';
    updateStep13({ billingCycle: newCycle });
  };

  const handleCompleteRegistration = async () => {
    if (!step13.selectedPlanId) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setSubmitting(true);
    try {
      // Get all registration data from store
      const { step3, step4, step5, step7, step8, step9, step10, step11, step12 } = useArtistRegistrationV2Store.getState();
      
      console.log('Step 13 - Registration data from store:', {
        step3, step4, step5, step7, step8, step9, step10, step11, step12
      });
      
      const registrationData: CompleteArtistRegistration = {
        step3: {
          firstName: step3.firstName || '',
          lastName: step3.lastName || '',
          avatar: step3.avatar || ''
        },
        step4: {
          workArrangement: step4.workArrangement || WorkArrangement.FREELANCE
        },
        step5: {
          studioName: step5.studioName || '',
          province: step5.province || '',
          municipality: step5.municipality || '',
          studioAddress: step5.studioAddress || '',
          website: step5.website || '',
          phone: step5.phone || ''
        },
        step6: {
          certificateUrl: step4.certificateUrl || ''
        },
        step7: {
          bio: step7.bio || '',
          instagram: step7.instagram || '',
          tiktok: step7.tiktok || ''
        },
        step8: {
          favoriteStyles: step8.favoriteStyles || [],
          mainStyleId: step8.mainStyleId || ''
        },
        step9: {
          servicesOffered: step9.servicesOffered || []
        },
        step10: {
          bodyParts: step10.bodyParts || []
        },
        step11: {
          minimumPrice: step11.minimumPrice || 0,
          hourlyRate: step11.hourlyRate || 0
        },
        step12: {
          projects: (step12.projects || []).map((project, index) => ({
            title: project.title,
            description: project.description,
            photos: project.photos,
            videos: project.videos,
            associatedStyles: [],
            order: index + 1
          }))
        },
        step13: {
          selectedPlanId: step13.selectedPlanId,
          billingCycle: step13.billingCycle
        }
      };

      // Complete registration
      await completeArtistRegistration(registrationData);
      
      // Get current user ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No authenticated user found');
      }

      // Create subscription
      await SubscriptionService.createUserSubscription(
        session.user.id,
        step13.selectedPlanId,
        step13.billingCycle
      );

      // Reset store and redirect to home
      reset();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === step13.selectedPlanId);
  const isYearly = step13.billingCycle === 'YEARLY';

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text className="text-foreground mt-4">Loading subscription plans...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 10} 
      className="flex-1 bg-black"
    >
      <ScrollView className="flex-1" contentContainerClassName="flex-grow">
        {/* Header */}
        <View className="px-4 my-8">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => router.replace('/(auth)/welcome')} 
              className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
            >
              <Image source={require("@/assets/images/icons/close.png")} resizeMode="contain" />
            </TouchableOpacity>
            <Image source={require("@/assets/logo/logo-light.png")} className="h-10" resizeMode="contain" />
            <View className="w-10" />
          </View>
          <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
        </View>

        {/* Progress */}
        <View className="items-center mb-6">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
              <View 
                key={idx} 
                className={`${idx < 13 ? (idx === 12 ? 'bg-foreground w-3 h-3' : 'bg-success w-2 h-2') : 'bg-gray w-2 h-2'} rounded-full`} 
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="px-6 mb-4 flex-row gap-2 items-center">
          <Image source={require("@/assets/images/icons/pen.png")} className="w-6 h-6" resizeMode="contain" />
          <Text className="text-foreground section-title font-neueBold">Choose your plan</Text>
        </View>

        {/* Billing Toggle */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-center bg-black/40 rounded-full p-1">
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: 'MONTHLY' })}
              className={`flex-1 py-2 px-4 rounded-full ${step13.billingCycle === 'MONTHLY' ? 'bg-primary' : 'bg-transparent'}`}
            >
              <Text className={`text-center font-neueBold ${step13.billingCycle === 'MONTHLY' ? 'text-foreground' : 'text-foreground/60'}`}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateStep13({ billingCycle: 'YEARLY' })}
              className={`flex-1 py-2 px-4 rounded-full ${step13.billingCycle === 'YEARLY' ? 'bg-primary' : 'bg-transparent'}`}
            >
              <Text className={`text-center font-neueBold ${step13.billingCycle === 'YEARLY' ? 'text-foreground' : 'text-foreground/60'}`}>
                Yearly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        <View className="px-6 mb-8">
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => handlePlanSelect(plan.id)}
              className={`mb-4 p-6 rounded-2xl border-2 ${
                step13.selectedPlanId === plan.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray bg-black/40'
              }`}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-foreground text-xl font-neueBold">{plan.name}</Text>
                  <Text className="text-foreground/80 text-sm">{plan.description}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-foreground text-2xl font-neueBold">
                    €{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </Text>
                  <Text className="text-foreground/60 text-sm">
                    {isYearly ? 'per year' : 'per month'}
                  </Text>
                </View>
              </View>

              {/* Features */}
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                  <Text className="text-foreground/80 text-sm">
                    {plan.features.mainStyles} main styles
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                  <Text className="text-foreground/80 text-sm">
                    {plan.features.canUploadVideos ? 'Video uploads' : 'Image uploads only'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                  <Text className="text-foreground/80 text-sm">
                    {plan.features.canCreateStudio ? 'Studio creation' : 'No studio features'}
                  </Text>
                </View>
                {plan.freeTrialDays > 0 && (
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-success rounded-full mr-3" />
                    <Text className="text-success text-sm font-neueBold">
                      {plan.freeTrialDays} days free trial
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View className="flex-row justify-between px-6 mt-auto mb-10">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="rounded-full border border-foreground px-6 py-4"
          >
            <Text className="text-foreground">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleCompleteRegistration}
            disabled={submitting || !step13.selectedPlanId}
            className={`rounded-full px-8 py-4 ${submitting || !step13.selectedPlanId ? 'bg-gray/40' : 'bg-primary'}`}
          >
            <Text className="text-foreground">
              {submitting ? 'Completing...' : 'Complete Registration'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
