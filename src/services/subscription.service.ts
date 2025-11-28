import { supabase } from "@/utils/supabase";
import SUPABASE_FUNCTIONS_NAMES from "@/constants/supabase";

// Simple UUID generator for React Native
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyFeatures: {
    index: number;
    text: string;
    details: string;
    imageUrl: string;
  }[];
  yearlyFeatures: {
    index: number;
    text: string;
    details: string;
    imageUrl: string;
  }[];
  monthlyPrice: number;
  yearlyPrice: number;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
  isActive: boolean;
  isDefault: boolean;
  freeTrialDays: number;
}

export class SubscriptionService {
  static async fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("isActive", true)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching subscription plans:", error);
      throw new Error(error.message);
    }

    return data || [];
  }

  static async createUserSubscription(
    userId: string,
    planId: string,
    billingCycle: "MONTHLY" | "YEARLY" = "MONTHLY",
    isTrial: boolean = false
  ): Promise<void> {
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Subscription plan not found");
    }

    const startDate = new Date();
    let endDate = new Date();
    let trialEndsAt: Date | null = null;

    if (isTrial) {
      // For trial subscriptions, use freeTrialDays from plan
      const trialDays = plan.freeTrialDays || 30;
      trialEndsAt = new Date(startDate);
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      endDate = new Date(trialEndsAt); // End date is same as trial end date
    } else {
      // For paid subscriptions, calculate based on billing cycle
      if (billingCycle === "YEARLY") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
    }

    const subscriptionData: any = {
      id: generateUUID(),
      userId,
      planId,
      status: "ACTIVE",
      billingCycle,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isTrial,
      isFree: false,
      isAdminAssigned: false,
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add trialEndsAt only if it's a trial
    if (isTrial && trialEndsAt) {
      subscriptionData.trialEndsAt = trialEndsAt.toISOString();
    }

    const { error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .insert(subscriptionData);

    if (subscriptionError) {
      console.error("Error creating user subscription:", subscriptionError);
      throw new Error(subscriptionError.message);
    }
  }

  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("userId", userId)
      .eq("status", "ACTIVE")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking active subscription:", error);
      return false;
    }

    return !!data;
  }

  static async getActiveSubscriptionWithPlan() {
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (!userId) throw new Error("No authenticated user found");

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("userId", userId)
      .eq("status", "ACTIVE")
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as any;
  }

  static async toggleAutoRenew(subscriptionId: string, autoRenew: boolean) {
    // First, update database
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({ autoRenew, updatedAt: new Date().toISOString() })
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If subscription has Stripe ID, sync with Stripe via Edge Function
    if (data?.stripeSubscriptionId) {
      try {
        const { error: functionError } = await supabase.functions.invoke(
          SUPABASE_FUNCTIONS_NAMES.UPDATE_SUBSCRIPTION,
          {
            body: {
              subscriptionId,
              autoRenew,
            },
          }
        );

        if (functionError) {
          console.error("Failed to sync with Stripe:", functionError);
          // Don't throw - database update succeeded, Stripe will sync via webhook
        }
      } catch (err) {
        console.error("Error calling update-subscription function:", err);
        // Don't throw - database update succeeded, Stripe will sync via webhook
      }
    }

    return data;
  }
}

export const subscriptionService = new SubscriptionService();

/**
 * Determine plan type (PREMIUM or STUDIO) from plan name
 * @param planName The name of the subscription plan
 * @returns 'PREMIUM' or 'STUDIO'
 */
export function getPlanTypeFromName(planName: string): "PREMIUM" | "STUDIO" {
  const nameLower = planName.toLowerCase();
  if (nameLower.includes("studio")) {
    return "STUDIO";
  }
  // Default to PREMIUM if not studio
  return "PREMIUM";
}
