# Stripe Subscriptions Setup Guide

## Setup

### 1. Stripe Account
- Get API keys from Stripe Dashboard → Developers → API keys
- Copy secret key (starts with `sk_test_...`)

### 2. Install Dependencies
```bash
bun add stripe @types/stripe
```

### 3. Environment Variables
Create `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EXPO_SCHEME=tattoola
```

### 4. Stripe Client
File: `src/lib/stripe.ts` (already created)

### 5. Create Products in Stripe
- Stripe Dashboard → Products → Add product
- Copy Price IDs (starts with `price_...`)

## Implementation

### 6. Checkout Session

#### Option A: Supabase Edge Function (Recommended for Production)

**Deploy:**
```bash
supabase functions deploy create-checkout-session
```

**Secrets (Supabase Dashboard → Edge Functions):**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

**Endpoint:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session`

#### Option B: Next.js API Route (Alternative/Fallback)

**File:** `src/app/api/payments/create-checkout-session/route.ts` (already created)

**Environment Variables (`.env.local`):**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

**Endpoint:** `http://localhost:3000/api/payments/create-checkout-session` (dev) or `https://your-domain.com/api/payments/create-checkout-session` (production)

**Note:** Next.js API routes are kept as fallback/alternative. For production, Supabase Edge Functions are recommended.

### 7. Success/Cancel Pages
Files already created:
- `src/app/payment/success/page.tsx`
- `src/app/payment/cancel/page.tsx`

### 8. Webhook Handler

#### Option A: Supabase Edge Function (Recommended for Production)

**Files:**
- `supabase/functions/stripe-webhook/index.ts` - Webhook handler
- `supabase/config.toml` - Allows public access (verified by Stripe signature)

**Deploy:**
```bash
supabase functions deploy stripe-webhook
```

**Secrets (Supabase Dashboard → Edge Functions):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (get from Stripe after adding endpoint)
- `SUPABASE_URL` - `https://YOUR_PROJECT_REF.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Project Settings → API)

**Stripe Dashboard:**
- Add endpoint: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy signing secret to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

#### Option B: Next.js API Route (Alternative/Fallback)

**File:** `src/app/api/webhooks/stripe/route.ts` (already created)

**Environment Variables (`.env.local`):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Stripe Dashboard:**
- Add endpoint: `http://localhost:3000/api/webhooks/stripe` (dev) or `https://your-domain.com/api/webhooks/stripe` (production)
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy signing secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`

**Note:** 
- Next.js API routes use Prisma for database access
- For production, Supabase Edge Functions are recommended to avoid Prisma engine issues
- Next.js routes are kept for local development and as fallback

### 9. Database Price Mapping
Update `SubscriptionPlan` records with Stripe Price IDs:
- `stripeMonthlyPriceId`
- `stripeYearlyPriceId`

Use Prisma Studio: `bun run db:studio`

### 10. Expo Integration

**Deep Link Config (`app.json`):**
```json
{
  "expo": {
    "scheme": "tattoola"
  }
}
```

**Checkout Function (Supabase Edge Function):**
```typescript
const response = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_...',
    userId: 'user-id',
    returnToApp: true,
    planType: 'PREMIUM',
    cycle: 'MONTHLY'
  })
});
const { url } = await response.json();
Linking.openURL(url);
```

**Checkout Function (Next.js API Route):**
```typescript
const response = await fetch('https://your-domain.com/api/payments/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_...',
    userId: 'user-id',
    returnToApp: true,
    planType: 'PREMIUM',
    cycle: 'MONTHLY'
  })
});
const { url } = await response.json();
Linking.openURL(url);
```

## Testing

1. Start dev server: `bun run dev`
2. Test checkout: Use cURL or Expo app
3. Test card: `4242 4242 4242 4242`
4. Verify database updates in Prisma Studio

## Production

### Using Supabase Edge Functions (Recommended)
1. Switch Stripe to Live mode
2. Update Supabase Edge Function secrets with live keys:
   - `STRIPE_SECRET_KEY` (live key: `sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` (live webhook secret)
   - `SUPABASE_URL` (production URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (production key)
   - `NEXT_PUBLIC_APP_URL` (production app URL)
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```
4. Update Stripe webhook endpoint URL to production Supabase endpoint
5. Update database with live Price IDs

### Using Next.js API Routes (Alternative)
1. Switch Stripe to Live mode
2. Update environment variables in production (`.env.production` or hosting platform):
   - `STRIPE_SECRET_KEY` (live key: `sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` (live webhook secret)
   - `NEXT_PUBLIC_APP_URL` (production app URL)
3. Deploy Next.js application
4. Update Stripe webhook endpoint URL to production Next.js endpoint
5. Update database with live Price IDs

## Troubleshooting

- **Missing STRIPE_SECRET_KEY**: Check `.env.local` (Next.js) or Supabase Edge Function secrets
- **Webhook signature failed**: 
  - Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
  - For Next.js: Ensure raw body is used (already handled in route)
  - For Supabase: Check webhook secret in Edge Function secrets
- **No database updates**: 
  - Check webhook logs (Supabase Dashboard → Edge Functions → Logs or Next.js server logs)
  - Verify Price IDs in database match Stripe Price IDs
  - Check that `userId` is in metadata (both checkout session and subscription)
- **Deep link not working**: Verify `NEXT_PUBLIC_EXPO_SCHEME` matches `app.json` scheme
- **Prisma errors in Next.js webhook**: Consider using Supabase Edge Functions instead, or ensure Prisma client is properly initialized

## Choosing Between Supabase Edge Functions and Next.js API Routes

**Use Supabase Edge Functions when:**
- ✅ Production deployment
- ✅ Need serverless scaling
- ✅ Want to avoid Prisma engine issues
- ✅ Prefer managed infrastructure

**Use Next.js API Routes when:**
- ✅ Local development
- ✅ Already have Next.js deployment infrastructure
- ✅ Need to use Prisma directly
- ✅ Fallback/backup option
