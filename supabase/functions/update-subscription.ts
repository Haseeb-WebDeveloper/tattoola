// @ts-nocheck

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2020-08-27'
});

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Update Subscription Function booted!');

Deno.serve(async (request) => {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const body = await request.json();
    const { subscriptionId, autoRenew } = body || {};

    // Validate required fields
    if (!subscriptionId) {
      return new Response(JSON.stringify({
        error: 'subscriptionId is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (typeof autoRenew !== 'boolean') {
      return new Response(JSON.stringify({
        error: 'autoRenew must be a boolean'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Authorization header required'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired token'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Retrieve subscription from database and verify ownership
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id, userId, stripeSubscriptionId')
      .eq('id', subscriptionId)
      .eq('userId', user.id)
      .single();

    if (subError || !subscription) {
      return new Response(JSON.stringify({
        error: 'Subscription not found or access denied'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // If no Stripe subscription ID, only update database (backward compatibility)
    if (!subscription.stripeSubscriptionId) {
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          autoRenew,
          updatedAt: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Database updated (no Stripe subscription ID)'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Update Stripe subscription
    try {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: !autoRenew
      });

      console.log('Stripe subscription updated:', {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        cancel_at_period_end: !autoRenew
      });
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      // Still update database even if Stripe fails
      // The webhook will sync it back later
    }

    // Update database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        autoRenew,
        cancelAtPeriodEnd: !autoRenew,
        updatedAt: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription updated successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('Update subscription error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update subscription';
    return new Response(JSON.stringify({
      error: message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

