// @ts-nocheck

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

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

console.log('Expire Subscriptions Function booted!');

Deno.serve(async () => {
  try {
    const now = new Date().toISOString();
    
    console.log('Checking for expired subscriptions...', { now });
    
    // Find all active subscriptions that have expired and should not renew
    // Conditions:
    // 1. Status is ACTIVE
    // 2. endDate has passed
    // 3. Either autoRenew is false OR cancelAtPeriodEnd is true
    const { data: expiredSubscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('id, userId, planId, endDate, autoRenew, cancelAtPeriodEnd')
      .eq('status', 'ACTIVE')
      .not('endDate', 'is', null)
      .lt('endDate', now)
      .or('autoRenew.eq.false,cancelAtPeriodEnd.eq.true');

    if (error) {
      console.error('Error fetching expired subscriptions:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        success: false 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('No expired subscriptions found');
      return new Response(JSON.stringify({ 
        message: 'No expired subscriptions found',
        count: 0,
        success: true 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${expiredSubscriptions.length} expired subscription(s) to update`);

    // Update all expired subscriptions
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'EXPIRED',
        updatedAt: now
      })
      .in('id', expiredSubscriptions.map(s => s.id));

    if (updateError) {
      console.error('Error updating expired subscriptions:', updateError);
      return new Response(JSON.stringify({ 
        error: updateError.message,
        success: false 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully expired ${expiredSubscriptions.length} subscription(s)`);

    // Optionally: Create subscription events for tracking
    const events = expiredSubscriptions.map(sub => ({
      subscriptionId: sub.id,
      type: 'EXPIRED',
      data: {
        reason: sub.cancelAtPeriodEnd ? 'CANCELLED_BY_USER' : 'NOT_RENEWED',
        expiredAt: now,
        endDate: sub.endDate
      },
      createdAt: now
    }));

    if (events.length > 0) {
      await supabase
        .from('subscription_events')
        .insert(events);
    }

    return new Response(JSON.stringify({ 
      message: `Expired ${expiredSubscriptions.length} subscription(s)`,
      count: expiredSubscriptions.length,
      subscriptionIds: expiredSubscriptions.map(s => s.id),
      success: true 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Unexpected error in expire-subscriptions function:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: message,
      success: false 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});