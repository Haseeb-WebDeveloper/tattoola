# Email Update Flow Documentation

## Overview
This document describes the complete flow for updating a user's email address in the TattooLA application. The process involves multiple security steps to ensure the email change is legitimate.

## Flow Steps

### 1. Password Verification (`/settings/email` - Step 1)
**File**: `src/app/settings/email.tsx`

- User navigates to Settings → Email
- First screen asks for current password
- Password is verified by attempting to sign in with current credentials using `supabase.auth.signInWithPassword()`
- If password is incorrect, error is shown under input field with red border
- If password is correct, user proceeds to Step 2

**UI/UX Features**:
- Password visibility toggle (eye icon)
- Error state with red border and error message
- Loading state during verification
- "Next" button disabled until password is entered
- Unsaved changes modal if user tries to go back

### 2. Email Update (`/settings/email` - Step 2)
**File**: `src/app/settings/email.tsx`

- User enters new email address
- User confirms new email address
- Validation checks:
  - Valid email format
  - New email is different from current email
  - Both email fields match
- On validation success, calls `supabase.auth.updateUser({ email: newEmail })`
- Supabase sends verification email to new address
- User is redirected to confirmation screen

**UI/UX Features**:
- Current email displayed for reference
- Two email input fields (new email + confirmation)
- Error states with red borders and error messages
- Loading state during update
- "Update Email" button disabled until both fields are filled
- Unsaved changes modal if user tries to go back

### 3. Email Confirmation Screen (`/settings/email-confirmation`)
**File**: `src/app/settings/email-confirmation.tsx`

- Shows success message with mail icon
- Instructs user to check their inbox
- Displays image with verification instructions
- Provides "Resend email" button
- User can close and return to settings

**UI/UX Features**:
- Similar design to signup email confirmation
- Resend functionality with loading state
- Close button to return to settings
- Visual feedback with icon and image

### 4. Email Verification (`/(auth)/verify-email`)
**File**: `src/app/(auth)/verify-email.tsx`

**Deep Link Handling**:
- User clicks verification link in email
- App opens via deep link with token and type parameters
- Screen detects `type === "email_change"` or `type === "emailChange"`
- Calls `supabase.auth.exchangeCodeForSession(token)` to verify
- On success, updates custom `users` table with new email
- Shows success toast
- Redirects to `/settings`

**Database Updates**:
```typescript
// Update custom users table
await supabase
  .from("users")
  .update({ email: newEmail })
  .eq("id", userId);
```

**Error Handling**:
- Invalid token → Shows error screen with message
- Network error → Shows error toast
- Failed to update users table → Logs error but doesn't block success

## Security Considerations

1. **Password Verification**: Ensures the email change request is from the account owner
2. **Email Confirmation**: Prevents accidental email changes
3. **Verification Link**: Ensures the user has access to the new email
4. **Token-Based Verification**: Uses Supabase's secure token system
5. **Database Consistency**: Updates both auth.users (automatic) and custom users table

## Database Schema

### Supabase Auth Table (`auth.users`)
- Managed automatically by Supabase
- Email updated after verification

### Custom Users Table (`public.users`)
```sql
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    -- other fields...
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);
```

## Error Messages

### Password Verification Errors
- "Current password is required" - Empty password field
- "The password is incorrect" - Wrong password

### Email Validation Errors
- "This field is required" - Empty email field
- "Invalid format" - Invalid email format
- "New email must be different from current email" - Same as current
- "Both emails don't match" - Confirmation doesn't match
- "Please confirm your email" - Empty confirmation field

### System Errors
- "Failed to update email" - Supabase update failed
- "Failed to verify email change" - Verification token invalid
- "No pending email change found" - When trying to resend

## User Experience Flow

```
Settings
  ↓
Email Settings
  ↓
Enter Current Password
  ↓
Password Verified ✓
  ↓
Enter New Email
  ↓
Confirm New Email
  ↓
Update Initiated ✓
  ↓
Confirmation Screen (Check Inbox)
  ↓
User Clicks Email Link
  ↓
App Opens (Deep Link)
  ↓
Verification Processed ✓
  ↓
Database Updated ✓
  ↓
Success → Settings
```

## Code References

### Main Files
- `src/app/settings/email.tsx` - Multi-step email update form
- `src/app/settings/email-confirmation.tsx` - Confirmation screen
- `src/app/(auth)/verify-email.tsx` - Verification handler
- `src/app/settings/index.tsx` - Settings menu with email option

### Utilities
- `src/utils/validation.ts` - Email validation rules
- `src/utils/supabase.ts` - Supabase client

### Components
- `src/components/ui/ScaledText.tsx` - Text component
- `src/components/ui/ScaledTextInput.tsx` - Input component

## Testing Checklist

- [ ] Password verification with correct password
- [ ] Password verification with incorrect password
- [ ] Email validation (invalid format)
- [ ] Email validation (same as current)
- [ ] Email validation (mismatch confirmation)
- [ ] Update email successfully
- [ ] Receive verification email
- [ ] Click verification link
- [ ] App opens with deep link
- [ ] Email updated in auth.users
- [ ] Email updated in custom users table
- [ ] Resend verification email
- [ ] Back navigation with unsaved changes
- [ ] Back navigation without unsaved changes
- [ ] Step navigation (password → email)
- [ ] Close from confirmation screen

## Future Improvements

1. **Email History**: Track email change history
2. **Cooldown Period**: Limit frequency of email changes
3. **Old Email Notification**: Notify old email about the change
4. **Two-Factor Authentication**: Add 2FA requirement for email changes
5. **Email Verification Status**: Show pending email change in settings

