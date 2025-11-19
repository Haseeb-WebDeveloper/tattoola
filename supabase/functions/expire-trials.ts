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

console.log('Expire Trials Function booted!');

Deno.serve(async () => {
  try {
    const now = new Date().toISOString();
    
    console.log('Checking for expired trials...', { now });
    
    // Find all active trial subscriptions that have expired
    const { data: expiredTrials, error } = await supabase
      .from('user_subscriptions')
      .select('id, userId')
      .eq('status', 'ACTIVE')
      .eq('isTrial', true)
      .not('trialEndsAt', 'is', null)
      .lt('trialEndsAt', now);

    if (error) {
      console.error('Error fetching expired trials:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        success: false 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      console.log('No expired trials found');
      return new Response(JSON.stringify({ 
        message: 'No expired trials found',
        count: 0,
        success: true 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${expiredTrials.length} expired trial(s) to update`);

    // Update all expired trials
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'EXPIRED',
        isTrial: false,
        updatedAt: now
      })
      .in('id', expiredTrials.map(t => t.id));

    if (updateError) {
      console.error('Error updating expired trials:', updateError);
      return new Response(JSON.stringify({ 
        error: updateError.message,
        success: false 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully expired ${expiredTrials.length} trial subscription(s)`);

    return new Response(JSON.stringify({ 
      message: `Expired ${expiredTrials.length} trial subscription(s)`,
      count: expiredTrials.length,
      subscriptionIds: expiredTrials.map(t => t.id),
      success: true 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Unexpected error in expire-trials function:', err);
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

