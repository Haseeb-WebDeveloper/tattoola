// @ts-nocheck


// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.0.0';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2020-08-27'
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
// Initialize Supabase client
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
// After creating the supabase client, add:
console.log('Supabase client initialized:', {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...' // First 20 chars for verification
});
// Mapping functions
function mapStripeSubStatus(status) {
  switch(status){
    case "active":
    case "trialing":
    case "past_due":
      return "ACTIVE";
    case "canceled":
      return "CANCELLED";
    case "unpaid":
    default:
      return "SUSPENDED";
  }
}
function mapIntervalToCycle(interval) {
  return interval === "year" ? "YEARLY" : "MONTHLY";
}
function mapInvoiceStatus(status) {
  switch(status){
    case "paid":
      return "PAID";
    case "void":
      return "VOID";
    case "uncollectible":
      return "UNCOLLECTIBLE";
    case "draft":
      return "DRAFT";
    case "open":
    default:
      return "OPEN";
  }
}
function mapPaymentStatus(status) {
  switch(status){
    case "succeeded":
      return "SUCCEEDED";
    case "requires_payment_method":
      return "REQUIRES_PAYMENT_METHOD";
    case "requires_confirmation":
      return "REQUIRES_CONFIRMATION";
    case "requires_action":
    case "processing":
    default:
      return "REQUIRES_CONFIRMATION";
  }
}
async function ensureUserSubscription(args) {
  console.log("ensureUserSubscription: webhook args", args);
  const { userId, subscription, price, planTypeMeta } = args;
  const billingCycle = mapIntervalToCycle(price?.recurring?.interval ?? null);
  const priceId = price?.id ?? "";
  let planId;
  if (priceId) {
    const { data: plan, error } = await supabase.from('subscription_plans').select('id').or(`stripeMonthlyPriceId.eq.${priceId},stripeYearlyPriceId.eq.${priceId}`).limit(1).single();
    if (!error && plan) {
      planId = plan.id;
    }
  }
  if (!planId && planTypeMeta) {
    const { data: plan, error } = await supabase.from('subscription_plans').select('id').eq('type', planTypeMeta).limit(1).single();
    if (!error && plan) {
      planId = plan.id;
    }
  }
  if (!planId) {
    const { data: def, error } = await supabase.from('subscription_plans').select('id').eq('isDefault', true).limit(1).single();
    if (!error && def) {
      planId = def.id;
    }
  }
  if (!planId) {
    console.warn("No plan found for subscription");
    return null;
  }
  const startDate = new Date((subscription.start_date ?? subscription.created) * 1000).toISOString();
  const endDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
  const status = mapStripeSubStatus(subscription.status);
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null;
  
  // First, try to find existing subscription by Stripe subscription ID
  let existing = null;
  if (subscription.id) {
    const { data: existingByStripeId } = await supabase
      .from('user_subscriptions')
      .select('id, isTrial, planId')
      .eq('stripeSubscriptionId', subscription.id)
      .maybeSingle();
    existing = existingByStripeId;
  }
  
  // If not found by Stripe ID, find active subscription for this user (for plan changes)
  if (!existing) {
    const { data: existingActive } = await supabase
      .from('user_subscriptions')
      .select('id, isTrial, planId')
      .eq('userId', userId)
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    existing = existingActive;
  }
  
  // If still not found, try by userId and planId (original logic)
  if (!existing) {
    const { data: existingByPlan } = await supabase
      .from('user_subscriptions')
      .select('id, isTrial, planId')
      .eq('userId', userId)
      .eq('planId', planId)
      .limit(1)
      .maybeSingle();
    existing = existingByPlan;
  }
  
  if (existing) {
    // If plan changed, cancel other active subscriptions for this user
    if (existing.planId !== planId) {
      await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'CANCELLED',
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .neq('id', existing.id);
    }
    
    // Check if subscription is converting from trial to paid
    const isNowPaid = status === "ACTIVE" && subscription.status !== "trialing";
    const wasTrial = existing.isTrial;
    
    // When converting to paid, end the trial
    const updateData = {
      planId: planId, // Update planId when plan changes
      status,
      billingCycle: billingCycle,
      startDate: startDate,
      endDate: endDate,
      trialEndsAt: isNowPaid ? null : trialEndsAt, // Clear trial end if paid
      isTrial: isNowPaid ? false : (wasTrial ? true : false), // End trial if paid
      cancelAtPeriodEnd: cancelAtPeriodEnd,
      canceledAt: canceledAt,
      stripeSubscriptionId: subscription.id, // Store Stripe subscription ID
      autoRenew: !cancelAtPeriodEnd, // Sync autoRenew with cancelAtPeriodEnd
      updatedAt: new Date().toISOString()
    };
    
    const { error } = await supabase.from('user_subscriptions').update(updateData).eq('id', existing.id);
    if (error) {
      console.error("Error updating subscription:", error);
      return null;
    }
    
    if (isNowPaid && wasTrial) {
      console.log("Trial ended, subscription converted to paid", {
        userId,
        subscriptionId: existing.id
      });
    }
    
    if (existing.planId !== planId) {
      console.log("Plan changed, subscription updated", {
        userId,
        subscriptionId: existing.id,
        oldPlanId: existing.planId,
        newPlanId: planId
      });
    }
    
    return existing.id;
  }
  console.log("Creating new subscription", {
    userId,
    planId,
    status,
    billingCycle
  });
  // Generate UUID for the id field (required by database)
  const subscriptionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { data: created, error } = await supabase.from('user_subscriptions').insert({
    id: subscriptionId,
    userId: userId,
    planId: planId,
    status,
    billingCycle: billingCycle,
    startDate: startDate,
    endDate: endDate,
    trialEndsAt: trialEndsAt,
    cancelAtPeriodEnd: cancelAtPeriodEnd,
    canceledAt: canceledAt,
    stripeSubscriptionId: subscription.id, // Store Stripe subscription ID
    isAdminAssigned: false,
    isFree: false,
    isTrial: Boolean(subscription.status === "trialing"),
    autoRenew: !cancelAtPeriodEnd, // Sync autoRenew with cancelAtPeriodEnd
    createdAt: now,
    updatedAt: now
  }).select('id').single();
  if (error) {
    console.error("Error creating subscription:", error);
    return null;
  }
  return created.id;
}
async function upsertInvoiceAndPayment(args) {
  const { invoice, userId, subscriptionId } = args;
  console.log("upsertInvoiceAndPayment:", {
    invoiceId: invoice.id,
    userId
  });
  const number = invoice.number ?? invoice.id;
  const currency = invoice.currency?.toUpperCase() ?? "USD";
  
  // Check if invoice already exists (fetch paidAt to preserve it if status changes)
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id, paidAt')
    .eq('number', number)
    .maybeSingle();
  
  // Map invoice status
  const mappedStatus = mapInvoiceStatus(invoice.status ?? null);
  
  // Set paidAt if invoice is paid and has status_transitions.paid_at
  // Preserve existing paidAt if invoice was already paid and status is still paid
  // Clear paidAt if status changes from paid to something else
  let paidAt = null;
  if (invoice.status === "paid" && invoice.status_transitions?.paid_at) {
    // Invoice is paid - use Stripe's paid_at timestamp
    paidAt = new Date(invoice.status_transitions.paid_at * 1000).toISOString();
  } else if (mappedStatus === "PAID" && existingInvoice?.paidAt) {
    // Invoice is still paid but no new paid_at timestamp - preserve existing
    paidAt = existingInvoice.paidAt;
  }
  // If status is not PAID, paidAt remains null (clears it if status changed)
  
  const invoiceData = {
    userId: userId,
    subscriptionId: subscriptionId,
    number,
    currency,
    amountSubtotal: invoice.amount_subtotal ?? 0,
    amountTax: invoice.amount_tax ?? 0,
    amountDiscount: invoice.total_discount_amounts?.reduce((s, d)=>s + (d.amount ?? 0), 0) ?? 0,
    amountTotal: invoice.amount_due ?? 0,
    periodStart: new Date((invoice.period_start ?? invoice.created) * 1000).toISOString(),
    periodEnd: new Date((invoice.period_end ?? invoice.created) * 1000).toISOString(),
    status: mappedStatus,
    paidAt: paidAt,
    pdfUrl: invoice.invoice_pdf ?? undefined,
    updatedAt: new Date().toISOString()
  };
  
  let inv;
  if (existingInvoice) {
    // Update existing invoice
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', existingInvoice.id)
      .select('id')
      .single();
    if (updateError) {
      console.error("Error updating invoice:", updateError);
      console.error("Invoice data attempted:", invoiceData);
      return;
    }
    inv = updated;
  } else {
    // Insert new invoice with generated UUID
    invoiceData.id = crypto.randomUUID();
    const { data: inserted, error: insertError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select('id')
      .single();
    if (insertError) {
      console.error("Error inserting invoice:", insertError);
      console.error("Invoice data attempted:", invoiceData);
      return;
    }
    inv = inserted;
  }
  if (invoice.lines?.data?.length) {
    for (const line of invoice.lines.data){
      const unitAmount = line.price?.unit_amount ?? line.amount ?? 0;
      const amount = line.amount ?? unitAmount * (line.quantity ?? 1);
      await supabase.from('invoice_items').upsert({
        id: `${inv.id}-${line.id}`,
        invoiceId: inv.id,
        planId: null,
        description: line.description ?? undefined,
        quantity: line.quantity ?? 1,
        unitAmount: unitAmount ?? 0,
        amount: amount ?? 0
      }, {
        onConflict: 'id'
      });
    }
  }
  const pi = invoice.payment_intent;
  const charge = invoice.charge || undefined;
  if (pi) {
    // Check if payment already exists to prevent duplicates
    // Use providerChargeId if available, otherwise use payment_intent id
    const providerChargeId = charge?.id || pi.id;
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('invoiceId', inv.id)
      .eq('provider', 'STRIPE')
      .eq('providerChargeId', providerChargeId || '')
      .maybeSingle();
    
    if (!existingPayment) {
      // Insert new payment
      await supabase.from('payments').insert({
        userId: userId,
        invoiceId: inv.id,
        currency,
        amount: pi.amount_received ?? pi.amount ?? 0,
        status: mapPaymentStatus(pi.status),
        provider: "STRIPE",
        providerChargeId: providerChargeId ?? undefined,
        receiptUrl: charge && typeof charge.receipt_url === "string" ? charge.receipt_url : undefined
      });
    } else if (existingPayment) {
      // Update existing payment status if it changed
      await supabase
        .from('payments')
        .update({
          status: mapPaymentStatus(pi.status),
          amount: pi.amount_received ?? pi.amount ?? 0,
          receiptUrl: charge && typeof charge.receipt_url === "string" ? charge.receipt_url : undefined,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingPayment.id);
    }
  }
}
console.log('Stripe Webhook Function booted!');
Deno.serve(async (request)=>{
  // Get the signature header (Stripe sends it as lowercase 'stripe-signature')
  const signature = request.headers.get('stripe-signature') || request.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return new Response(JSON.stringify({
      error: "Missing STRIPE_WEBHOOK_SECRET"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  if (!signature) {
    console.error('Missing stripe-signature header');
    return new Response(JSON.stringify({
      error: "Missing stripe-signature header"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  
  // CRITICAL: Read the raw body as ArrayBuffer first to preserve exact bytes
  // This is required for Stripe signature verification
  const rawBody = await request.arrayBuffer();
  const body = new TextDecoder().decode(rawBody);
  
  let receivedEvent;
  try {
    // Use constructEventAsync with the raw body string and crypto provider
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body, 
      signature, 
      webhookSecret, 
      undefined, 
      cryptoProvider
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature verification failed:", message);
    console.error("Error details:", err);
    return new Response(JSON.stringify({
      error: message
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  console.log("Webhook event received:", {
    type: receivedEvent.type,
    id: receivedEvent.id,
    created: new Date(receivedEvent.created * 1000).toISOString()
  });
  try {
    switch(receivedEvent.type){
      case "checkout.session.completed":
        {
          const session = receivedEvent.data.object;
          const userId = session.metadata?.userId ?? "";
          console.log("checkout.session.completed:", {
            sessionId: session.id,
            userId,
            subscriptionId: session.subscription
          });
          if (!userId) {
            console.warn("No userId in metadata");
            break;
          }
          const subId = session.subscription ?? undefined;
          if (!subId) break;
          let subscription = await stripe.subscriptions.retrieve(subId);
          
          // Ensure subscription has metadata
          if (!subscription.metadata?.userId) {
            await stripe.subscriptions.update(subId, {
              metadata: {
                userId,
                planType: session.metadata?.planType ?? ''
              }
            });
            // Re-fetch subscription with updated metadata
            subscription = await stripe.subscriptions.retrieve(subId);
          }
          
          const price = subscription.items.data[0]?.price ?? null;
          const planTypeMeta = session.metadata?.planType ?? null;
          const userSubscriptionId = await ensureUserSubscription({
            userId,
            subscription,
            price,
            planTypeMeta
          });
          console.log("User subscription created/updated:", {
            userSubscriptionId,
            userId
          });
          if (session.invoice) {
            const invoice = await stripe.invoices.retrieve(session.invoice);
            if (userSubscriptionId) {
              await upsertInvoiceAndPayment({
                invoice,
                userId,
                subscriptionId: userSubscriptionId
              });
            }
          }
          break;
        }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
      case "invoice.paid":
      case "invoice_payment.paid":
      case "invoice.finalized":
      case "invoice.voided":
      case "invoice.marked_uncollectible":
        {
          const invoice = receivedEvent.data.object;
          // Get userId from invoice metadata first, then from subscription metadata
          let userId = invoice.metadata?.userId;
          let subscription = null;
          if (invoice.subscription) {
            subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            // If userId not in invoice metadata, get it from subscription metadata
            if (!userId) {
              userId = subscription.metadata?.userId;
            }
          }
          // If still no userId, try to find it from existing subscription in database
          if (!userId && invoice.subscription) {
            const { data: existingSub } = await supabase
              .from('user_subscriptions')
              .select('userId')
              .eq('stripeSubscriptionId', invoice.subscription)
              .maybeSingle();
            if (existingSub) {
              userId = existingSub.userId;
            }
          }
          if (!userId) {
            console.warn("No userId found in invoice or subscription metadata");
            break;
          }
          if (subscription) {
            const price = subscription.items.data[0]?.price ?? null;
            const userSubscriptionId = await ensureUserSubscription({
              userId,
              subscription,
              price,
              planTypeMeta: null
            });
            if (userSubscriptionId) {
              await upsertInvoiceAndPayment({
                invoice,
                userId,
                subscriptionId: userSubscriptionId
              });
            }
          }
          break;
        }
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        {
          const subscription = receivedEvent.data.object;
          const userId = subscription.metadata?.userId ?? "";
          if (!userId) break;
          const price = subscription.items.data[0]?.price ?? null;
          await ensureUserSubscription({
            userId,
            subscription,
            price,
            planTypeMeta: null
          });
          break;
        }
      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`);
        break;
    }
    return new Response(JSON.stringify({
      received: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return new Response(JSON.stringify({
      error: message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
