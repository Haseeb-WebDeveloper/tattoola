# Subscription System - Business Flow & User Journey

## Overview
TattooLA offers a **30-day free trial** of the Premium plan to all new users upon signup. After the trial, users can continue with a paid subscription or downgrade to a free plan.

---

## User Journey

### 1. **Signup (Expo App)**
When a new user signs up, the following happens:

**Data to Save:**
- **Free Trial Subscription** (`user_subscriptions` table):
  - Automatically create a Premium plan subscription with:
    - `status`: `ACTIVE`
    - `isTrial`: `true`
    - `isFree`: `false` (trial is not free, it's a trial period)
    - `startDate`: Current date
    - `endDate`: `startDate + 30 days`
    - `trialEndsAt`: `startDate + 30 days`
    - `planId`: Premium plan ID (from `subscription_plans` where `isDefault = true`)
    - `billingCycle`: `MONTHLY` (default)
    - `autoRenew`: `true` (will auto-renew after trial ends)

**Implementation in Expo:**
```typescript
// After successful user creation
const userId = createdUser.id;
const premiumPlan = await getDefaultPlan(); // Get Premium plan

// Create free trial subscription
await createTrialSubscription({
  userId,
  planId: premiumPlan.id,
  trialDays: 30
});
```

---

### 2. **Trial Period (Days 1-30)**
- User has **full Premium features** access
- No payment required
- User can use all Premium features:
  - Unlimited posts
  - Unlimited collections
  - Video uploads
  - Studio creation
  - Priority support
  - All Premium features

**User Experience:**
- App shows: "Premium Trial - X days remaining"
- Reminder notifications at 7 days, 3 days, and 1 day before trial ends

---

### 3. **Trial Ending (Day 30)**
**Before Trial Ends:**
- User receives notifications about upcoming trial expiration
- User can:
  - **Subscribe** → Continue with paid Premium plan
  - **Cancel** → Downgrade to free plan (loses Premium features. User profile will only be visible to the user and admins not the public)

**If User Subscribes:**
- Redirected to Stripe Checkout
- Select billing cycle: Monthly ($39) or Yearly ($390 - 2 months free)
- Payment method added
- Subscription continues seamlessly after trial

**If User Doesn't Subscribe:**
- Trial expires automatically
- Subscription status changes to `SUSPENDED` or `CANCELLED`
- User loses Premium features
- Can subscribe later to regain access

---

### 4. **Active Paid Subscription**
- User is charged based on billing cycle (Monthly/Yearly)
- Full Premium features continue
- Automatic renewal unless canceled
- Invoices generated and stored
- Payment history tracked

---

### 5. **Subscription Management**
Users can:
- **Upgrade/Downgrade**: Change between Premium and Studio plans
- **Change Billing Cycle**: Switch between Monthly and Yearly
- **Cancel**: Cancel at period end (keeps access until period ends)
- **Resume**: Reactivate canceled subscription
- **View Invoices**: Access payment history

---

## Business Flow Diagram

```
┌─────────────────┐
│   User Signup   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Create User Account    │
│  + Free Trial (30 days) │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Trial Active (30d)    │
│   Full Premium Access   │
└────────┬────────────────┘
         │
         ▼
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐      ┌──────────────┐
│ Subscribe│      │   Cancel     │
│ (Stripe) │      │ (Downgrade)  │
└────┬────┘      └──────┬───────┘
     │                  │
     ▼                  ▼
┌─────────────┐   ┌──────────────┐
│ Paid Plan   │   │  Free Plan   │
│ (Premium)   │   │ (Limited)     │
└─────────────┘   └──────────────┘
```

## Database Schema (Key Tables)

### `user_subscriptions`
- `id`: UUID
- `userId`: User reference
- `planId`: Plan reference
- `status`: `ACTIVE`, `SUSPENDED`, `CANCELLED`
- `billingCycle`: `MONTHLY`, `YEARLY`
- `isTrial`: Boolean (true during trial)
- `trialEndsAt`: DateTime (trial expiration)
- `startDate`: Subscription start
- `endDate`: Subscription end
- `autoRenew`: Boolean

### `invoices`
- Tracks all Stripe invoices
- Linked to subscriptions
- Payment status tracking

### `payments`
- Payment records
- Linked to invoices
- Provider: STRIPE

---

## Stripe Integration Flow

1. **Checkout Session** (`create-checkout-session` Edge Function)
   - Creates Stripe checkout session
   - Passes `userId` and `planType` in metadata
   - Returns checkout URL

2. **Webhook Handler** (`stripe-webhook` Edge Function)
   - Receives Stripe events
   - Updates database:
     - `checkout.session.completed` → Creates/updates subscription
     - `invoice.payment_succeeded` → Records invoice & payment
     - `invoice.payment_failed` → Updates subscription status
     - `customer.subscription.updated` → Syncs subscription changes
     - `customer.subscription.deleted` → Cancels subscription

3. **Metadata Flow**
   - `userId` passed in checkout session metadata
   - Copied to subscription metadata
   - Used in webhook to link Stripe objects to database users

---

## Production Checklist

### Environment Setup
- [ ] Switch Stripe to **Live Mode**
- [ ] Update all environment variables with live keys:
  - `STRIPE_SECRET_KEY` (live key: `sk_live_...`)
  - `STRIPE_WEBHOOK_SECRET` (live webhook secret)
  - `SUPABASE_URL` (production URL)
  - `SUPABASE_SERVICE_ROLE_KEY` (production key)
  - `NEXT_PUBLIC_APP_URL` (production app URL)

### Stripe Configuration
- [ ] Create **live products** in Stripe Dashboard
- [ ] Create **live prices** (monthly & yearly) for each plan
- [ ] Update database `subscription_plans` table with live Price IDs:
  - `stripeMonthlyPriceId` → Live monthly price ID
  - `stripeYearlyPriceId` → Live yearly price ID
- [ ] Configure **live webhook endpoint**:
  - URL: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
  - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Copy signing secret to Supabase Edge Function secrets

### Supabase Edge Functions
- [ ] Deploy `create-checkout-session` function
- [ ] Deploy `stripe-webhook` function
- [ ] Verify all secrets are set in Supabase Dashboard
- [ ] Test webhook signature verification
- [ ] Verify database permissions (service_role has GRANT access)

### Database
- [ ] Verify `subscription_plans` table has correct plan data
- [ ] Ensure Premium plan has `isDefault: true` and `freeTrialDays: 30`
- [ ] Verify all required indexes exist
- [ ] Test subscription creation flow
- [ ] Verify RLS policies (if enabled) allow service_role access

### Expo App
- [ ] Update API endpoints to production URLs
- [ ] Test deep linking for payment success/cancel flows
- [ ] Verify `NEXT_PUBLIC_EXPO_SCHEME` matches `app.json` scheme
- [ ] Test trial subscription creation on signup
- [ ] Test checkout flow with real Stripe test cards
- [ ] Implement trial expiration notifications

### Testing
- [ ] Test complete signup → trial → subscription flow
- [ ] Test payment success scenarios
- [ ] Test payment failure scenarios
- [ ] Test subscription cancellation
- [ ] Test subscription renewal
- [ ] Verify all webhook events are handled correctly
- [ ] Test invoice generation and storage
- [ ] Verify payment history tracking

### Monitoring & Alerts
- [ ] Set up error logging for Edge Functions
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up alerts for failed webhooks
- [ ] Monitor subscription status changes
- [ ] Track trial-to-paid conversion rate
- [ ] Monitor payment failures

### Security
- [ ] Verify webhook signature verification is working
- [ ] Ensure service_role key is never exposed to client
- [ ] Review RLS policies for user data access
- [ ] Verify all API endpoints require authentication
- [ ] Test for SQL injection vulnerabilities
- [ ] Review error messages (don't expose sensitive info)

### Documentation
- [ ] Document production URLs and endpoints
- [ ] Create runbook for common issues
- [ ] Document rollback procedures
- [ ] Update API documentation

---

## Common Scenarios

### Scenario 1: User Signs Up
1. User creates account in Expo app
2. System creates user record
3. System automatically creates 30-day Premium trial subscription
4. User has immediate Premium access

### Scenario 2: Trial Expires (No Payment)
1. Trial ends after 30 days
2. Subscription status → `SUSPENDED`
3. User loses Premium features
4. User can subscribe anytime to regain access

### Scenario 3: User Subscribes During Trial
1. User clicks "Subscribe" in app
2. Redirected to Stripe Checkout
3. Enters payment method
4. Webhook receives `checkout.session.completed`
5. Subscription continues seamlessly (no interruption)
6. First charge occurs after trial ends

### Scenario 4: Payment Fails
1. Stripe attempts charge
2. Payment fails
3. Webhook receives `invoice.payment_failed`
4. Subscription status → `SUSPENDED`
5. User notified to update payment method
6. User can retry payment

---

## Notes

- **Trial is not "free"** - it's a trial period. Set `isFree: false` and `isTrial: true`
- **Auto-renewal**: Enabled by default. User can cancel anytime
- **Metadata is critical**: Always pass `userId` in Stripe metadata for webhook linking
- **Webhook reliability**: Stripe retries failed webhooks. Ensure idempotency in handlers
- **Database permissions**: Service role needs explicit GRANT permissions on all subscription-related tables

