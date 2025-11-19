/**
 * Payment Service
 * Handles Stripe checkout session creation via Supabase Edge Function
 */

import { supabase } from '@/utils/supabase';
import SUPABASE_FUNCTIONS_NAMES from '@/constants/supabase';

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  planType: 'PREMIUM' | 'STUDIO';
  cycle: 'MONTHLY' | 'YEARLY';
  returnToApp?: boolean;
}

export interface CreateCheckoutSessionResponse {
  url: string;
}

export class PaymentService {
  /**
   * Create a Stripe checkout session
   * Uses Supabase Edge Function: create-checkout-session
   * @param params Checkout session parameters
   * @returns Checkout URL from Stripe
   */
  static async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke(
        SUPABASE_FUNCTIONS_NAMES.CREATE_CHECKOUT_SESSION,
        {
          body: {
            priceId: params.priceId,
            userId: params.userId,
            planType: params.planType,
            cycle: params.cycle,
            returnToApp: params.returnToApp ?? true,
          },
        }
      );

      if (error) {
        console.error('PaymentService: Edge function error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data || !data.url) {
        throw new Error('No checkout URL returned from server');
      }

      return data.url;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create checkout session');
    }
  }
}

