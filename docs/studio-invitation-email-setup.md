# Studio Invitation Email Setup

## Overview

The studio invitation system requires server-side email sending via Brevo SMTP. You can implement this using either:

1. **Supabase Edge Function** (recommended if you don't have a Next.js backend)
2. **Next.js API Route** (recommended if you have a Next.js app)

---

## Option 1: Next.js API Route (Recommended if you have Next.js)

### Implementation Steps

1. **Create API Route**: `pages/api/studio/send-invitation-email.ts` (or `app/api/studio/send-invitation-email/route.ts` for App Router)

2. **Install Dependencies**:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

3. **Environment Variables** (add to `.env.local`):

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USERNAME=your-brevo-api-key
BREVO_SMTP_PASSWORD=your-brevo-smtp-key
BREVO_FROM_EMAIL=noreply@tattoola.com
BREVO_FROM_NAME=Tattoola
NEXT_PUBLIC_API_URL=https://your-nextjs-app.com
```

4. **API Route Implementation** (Pages Router - `pages/api/studio/send-invitation-email.ts`):

```typescript
import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

type ResponseData = {
  success: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      toEmail,
      studioName,
      studioLogo,
      senderName,
      deepLink,
      webLink,
      invitationToken,
    } = req.body;

    // Validate required fields
    if (!toEmail || !studioName || !senderName || !deepLink || !webLink) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_USERNAME,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });

    // Email HTML template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${studioLogo ? `<img src="${studioLogo}" alt="${studioName}" style="max-width: 120px; margin-bottom: 20px;" />` : ""}
            <h1 style="color: #CA2323; margin-top: 0;">You've been invited to join ${studioName}</h1>
            <p>Hi there,</p>
            <p><strong>${senderName}</strong> has invited you to join <strong>${studioName}</strong> on Tattoola.</p>
            <p>Click the button below to accept the invitation:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${deepLink}" style="background-color: #CA2323; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${webLink}">${webLink}</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to: toEmail,
      subject: `You've been invited to join ${studioName}`,
      html: html,
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to send email",
    });
  }
}
```

**For App Router** (`app/api/studio/send-invitation-email/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const {
      toEmail,
      studioName,
      studioLogo,
      senderName,
      deepLink,
      webLink,
      invitationToken,
    } = await req.json();

    // Validate required fields
    if (!toEmail || !studioName || !senderName || !deepLink || !webLink) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USERNAME,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });

    // Email HTML template (same as above)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${studioLogo ? `<img src="${studioLogo}" alt="${studioName}" style="max-width: 120px; margin-bottom: 20px;" />` : ""}
            <h1 style="color: #CA2323; margin-top: 0;">You've been invited to join ${studioName}</h1>
            <p>Hi there,</p>
            <p><strong>${senderName}</strong> has invited you to join <strong>${studioName}</strong> on Tattoola.</p>
            <p>Click the button below to accept the invitation:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${deepLink}" style="background-color: #CA2323; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${webLink}">${webLink}</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to: toEmail,
      subject: `You've been invited to join ${studioName}`,
      html: html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
```

5. **Update Email Service** (`src/services/email.service.ts`):

Update the service to call your Next.js API instead of Supabase Edge Function:

```typescript
import { supabase } from "@/utils/supabase";
import SUPABASE_FUNCTIONS_NAMES from "@/constants/supabase";

interface SendStudioInvitationEmailParams {
  toEmail: string;
  studioName: string;
  studioLogo?: string | null;
  senderName: string;
  invitationToken: string;
}

/**
 * Send studio invitation email via Next.js API or Supabase Edge Function
 */
export async function sendStudioInvitationEmail(
  params: SendStudioInvitationEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate deep link
    const deepLink = `tattoola://studio-invitation?token=${params.invitationToken}`;

    // Fallback web link (if app is not installed)
    const webLink = `${process.env.EXPO_PUBLIC_APP_URL || "https://tattoola.app"}/studio-invitation?token=${params.invitationToken}`;

    // Option 1: Use Next.js API (if available)
    const nextjsApiUrl = process.env.EXPO_PUBLIC_NEXTJS_API_URL;
    if (nextjsApiUrl) {
      const response = await fetch(
        `${nextjsApiUrl}/api/studio/send-invitation-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toEmail: params.toEmail,
            studioName: params.studioName,
            studioLogo: params.studioLogo,
            senderName: params.senderName,
            deepLink: deepLink,
            webLink: webLink,
            invitationToken: params.invitationToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Error sending studio invitation email:", data.error);
        return { success: false, error: data.error || "Failed to send email" };
      }

      return { success: true };
    }

    // Option 2: Fallback to Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      SUPABASE_FUNCTIONS_NAMES.SEND_STUDIO_INVITATION_EMAIL,
      {
        body: {
          toEmail: params.toEmail,
          studioName: params.studioName,
          studioLogo: params.studioLogo,
          senderName: params.senderName,
          deepLink: deepLink,
          webLink: webLink,
          invitationToken: params.invitationToken,
        },
      }
    );

    if (error) {
      console.error("Error sending studio invitation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in sendStudioInvitationEmail:", error);
    return {
      success: false,
      error: error.message || "Failed to send invitation email",
    };
  }
}
```

6. **Add Environment Variable to Expo App** (`.env`):

```env
EXPO_PUBLIC_NEXTJS_API_URL=https://your-nextjs-app.com
```

---

## Option 2: Supabase Edge Function

### Required Supabase Edge Function

Create a Supabase Edge Function named `send-studio-invitation-email` that:

1. **Location**: `supabase/functions/send-studio-invitation-email/index.ts`

2. **Environment Variables** (set in Supabase dashboard):
   - `BREVO_SMTP_HOST` - Brevo SMTP host (usually `smtp-relay.brevo.com`)
   - `BREVO_SMTP_PORT` - Brevo SMTP port (usually `587`)
   - `BREVO_SMTP_USERNAME` - Your Brevo SMTP username (usually your Brevo API key)
   - `BREVO_SMTP_PASSWORD` - Your Brevo SMTP password (usually your Brevo SMTP key)
   - `BREVO_FROM_EMAIL` - Sender email address (must be verified in Brevo)
   - `BREVO_FROM_NAME` - Sender name (e.g., "Tattoola")

3. **Function Implementation**: The function should:
   - Accept POST requests with body:
     ```typescript
     {
       toEmail: string;
       studioName: string;
       studioLogo?: string | null;
       senderName: string;
       deepLink: string;
       webLink: string;
       invitationToken: string;
     }
     ```
   - Send an HTML email using Brevo SMTP with:
     - Studio logo (if provided)
     - Studio name
     - Sender name
     - "Accept Invitation" button linking to `deepLink`
     - Fallback web link
   - Return success/error response

4. **Example Implementation** (using nodemailer):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@^6.9.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      toEmail,
      studioName,
      studioLogo,
      senderName,
      deepLink,
      webLink,
      invitationToken,
    } = await req.json();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: Deno.env.get("BREVO_SMTP_HOST"),
      port: parseInt(Deno.env.get("BREVO_SMTP_PORT") || "587"),
      secure: false,
      auth: {
        user: Deno.env.get("BREVO_SMTP_USERNAME"),
        pass: Deno.env.get("BREVO_SMTP_PASSWORD"),
      },
    });

    // Email HTML template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${studioLogo ? `<img src="${studioLogo}" alt="${studioName}" style="max-width: 120px; margin-bottom: 20px;" />` : ""}
            <h1 style="color: #CA2323;">You've been invited to join ${studioName}</h1>
            <p>Hi there,</p>
            <p><strong>${senderName}</strong> has invited you to join <strong>${studioName}</strong> on Tattoola.</p>
            <p>Click the button below to accept the invitation:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${deepLink}" style="background-color: #CA2323; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${webLink}">${webLink}</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"${Deno.env.get("BREVO_FROM_NAME")}" <${Deno.env.get("BREVO_FROM_EMAIL")}>`,
      to: toEmail,
      subject: `You've been invited to join ${studioName}`,
      html: html,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
```

### Deployment

1. Create the function directory: `supabase/functions/send-studio-invitation-email/`
2. Add the `index.ts` file with the implementation above
3. Set environment variables in Supabase dashboard
4. Deploy using: `supabase functions deploy send-studio-invitation-email`

---

## Testing

### Next.js API Route Testing:

```bash
curl -X POST https://your-nextjs-app.com/api/studio/send-invitation-email \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "studioName": "Test Studio",
    "senderName": "John Doe",
    "deepLink": "tattoola://studio-invitation?token=test-token",
    "webLink": "https://tattoola.app/studio-invitation?token=test-token",
    "invitationToken": "test-token"
  }'
```

### Supabase Edge Function Testing:

```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/send-studio-invitation-email \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "studioName": "Test Studio",
    "senderName": "John Doe",
    "deepLink": "tattoola://studio-invitation?token=test-token",
    "webLink": "https://tattoola.app/studio-invitation?token=test-token",
    "invitationToken": "test-token"
  }'
```

## Recommendation

**Use Next.js API Route** if you already have a Next.js app - it's simpler to maintain and deploy alongside your existing backend. Use Supabase Edge Function only if you don't have a Next.js backend or prefer serverless functions.
