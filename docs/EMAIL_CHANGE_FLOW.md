# Email Change Flow

## Overview

Supabase email changes require **TWO confirmations** for security:
1. Confirm from the **OLD email** (to prevent hijacking)
2. Confirm from the **NEW email** (to verify ownership)

## Flow Steps

### 1. User Initiates Email Change
**Screen:** `settings/email.tsx`
- User enters current password → verified
- User enters new email + confirmation
- Calls `supabase.auth.updateUser({ email: newEmail })`
- Success → Shows loading, redirects to confirmation screen

### 2. First Confirmation Email Sent (OLD Email)
**Email Recipient:** Current email address
**Link:** Confirms user wants to change email
**Click → Opens:** Browser → Supabase verifies
**Redirects to:** `tattoola://auth/verify?message=Confirmation+link+accepted.+Please+proceed+to+confirm+link+sent+to+the+other+email`

### 3. Intermediate Screen
**Screen:** `settings/email-confirmation.tsx`
**Purpose:** Tell user to check their NEW email for the second confirmation
**Deep Link Handler:** Detects message parameter and routes here

### 4. Second Confirmation Email Sent (NEW Email)
**Email Recipient:** New email address
**Link:** Actually changes the email
**Click → Opens:** Browser → Supabase changes email
**Redirects to:** `tattoola://auth/verify?token=...&type=email_change`

### 5. Email Change Completed
**Screen:** `(auth)/verify-email.tsx`
**Actions:**
- Exchanges token for session
- Updates `auth.users` table (Supabase)
- Updates `users` table (custom)
- Shows success toast
- Redirects to `/settings`

## Code Changes Made

### 1. Fixed Query to Use `.maybeSingle()`
**File:** `src/providers/AuthProvider.tsx`
**Lines:** 59, 228, 307
**Reason:** `.single()` throws error if no user found. `.maybeSingle()` returns null instead.

### 2. Added Intermediate Step Detection
**File:** `src/utils/deepLinking.ts`
**Lines:** 31, 41-46
**Reason:** Detect the "proceed to confirm" message and route to confirmation screen.

## Testing

1. **Start email change:**
   ```
   Settings → Email → Enter password → Enter new email → Submit
   ```

2. **Check old email:**
   ```
   Open email → Click "Confirm email change"
   ```
   Expected: App shows "Verification email sent" screen

3. **Check new email:**
   ```
   Open email → Click "Confirm email address"
   ```
   Expected: App verifies → Shows success → Back to settings with new email

## Common Issues

### Loading Stuck on Email Screen
**Cause:** Query using `.single()` throws error when user not found
**Fix:** Changed to `.maybeSingle()` to handle gracefully. Also added `finally` block to always clear loading state.

### "Unmatched Route" Error
**Cause:** Deep linking handler not recognizing intermediate confirmation
**Fix:** Added message parameter detection

### Email Not Updated
**Cause:** User only clicked first confirmation, not second
**Solution:** Make sure both emails are confirmed:
1. Check OLD email → Click confirmation link
2. Check NEW email → Click verification link

### Old Email Change Link (type=signup)
**Cause:** User clicked an old email change link from before the code was fixed
**Solution:** Ignore old links and start a fresh email change. Check the NEW email address for the latest confirmation links.

### Multiple Pending Email Changes
**Cause:** User tried to change email multiple times without completing
**Solution:** Complete or cancel the current change before starting a new one. Look for `new_email` field in the auth user object to see pending change.

