// @ts-nocheck


// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'npm:stripe@12.0.0';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2020-08-27'
});
console.log('Create Checkout Session Function booted!');
Deno.serve(async (request)=>{
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
    const { priceId, userId, returnToApp, planType, cycle } = body || {};
    // Validate required environment variables
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return new Response(JSON.stringify({
        error: 'Server configuration error (missing STRIPE_SECRET_KEY)'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate required fields
    if (!priceId) {
      return new Response(JSON.stringify({
        error: 'priceId is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'userId is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Get app URL from environment variable
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL');
    if (!appUrl) {
      return new Response(JSON.stringify({
        error: 'Server configuration error (missing NEXT_PUBLIC_APP_URL)'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Build success and cancel URLs
    const successUrl = new URL('/payment/success', appUrl);
    successUrl.searchParams.set('returnToApp', returnToApp ? '1' : '0');
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    const cancelUrl = new URL('/payment/cancel', appUrl);
    const sessionConfig = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        userId,
        planType: planType ?? '',
        cycle: cycle ?? ''
      },
      // ADD THIS: Set subscription metadata directly
      subscription_data: {
        metadata: {
          userId,
          planType: planType ?? ''
        }
      },
      allow_promotion_codes: true,
      expand: [
        'subscription'
      ]
    };
    console.log('Creating checkout session with:', {
      success_url: sessionConfig.success_url,
      cancel_url: sessionConfig.cancel_url,
      priceId,
      userId
    });
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('Checkout session created:', {
      id: session.id,
      url: session.url,
      success_url: session.success_url,
      cancel_url: session.cancel_url
    });
    return new Response(JSON.stringify({
      url: session.url
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Error creating Stripe checkout session', err);
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
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
