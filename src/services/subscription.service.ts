import { supabase } from '@/utils/supabase';

// Simple UUID generator for React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: {
    maxPosts?: number | null;
    maxCollections?: number | null;
    maxStudioMembers?: number | null;
    canCreateStudio: boolean;
    canUploadVideos: boolean;
    prioritySupport: boolean;
    mainStyles: number;
    accessType: string;
    yearsExperience: boolean;
    coverMedia: boolean;
    studioPage?: boolean;
    campaignDiscounts?: boolean;
  };
  monthlyPrice: number;
  yearlyPrice: number;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  freeTrialDays: number;
}

export class SubscriptionService {
  static async fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('isActive', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  static async createUserSubscription(
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY'
  ): Promise<void> {
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Subscription plan not found');
    }

    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Add free trial days if available
    if (plan.freeTrialDays > 0) {
      endDate.setDate(endDate.getDate() + plan.freeTrialDays);
    }

    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        id: generateUUID(),
        userId,
        planId,
        status: 'ACTIVE',
        billingCycle,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAdminAssigned: false,
        autoRenew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error('Error creating user subscription:', subscriptionError);
      throw new Error(subscriptionError.message);
    }
  }

  static async getActiveSubscriptionWithPlan() {
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (!userId) throw new Error('No authenticated user found');

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('userId', userId)
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as any;
  }

  static async toggleAutoRenew(subscriptionId: string, autoRenew: boolean) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({ autoRenew, updatedAt: new Date().toISOString() })
      .eq('id', subscriptionId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export const subscriptionService = new SubscriptionService();
