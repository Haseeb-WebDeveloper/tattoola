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
    const webLink = `${process.env.EXPO_PUBLIC_APP_URL || "https://tattoola-admin.vercel.app"}/studio-invitation?token=${params.invitationToken}`;

    // Option 1: Use Next.js API (if available)
    const nextjsApiUrl = process.env.EXPO_PUBLIC_NEXTJS_API_URL;
    // if (nextjsApiUrl) {
    //   const response = await fetch(`${nextjsApiUrl}/api/studio/send-invitation-email`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       toEmail: params.toEmail,
    //       studioName: params.studioName,
    //       studioLogo: params.studioLogo,
    //       senderName: params.senderName,
    //       deepLink: deepLink,
    //       webLink: webLink,
    //       invitationToken: params.invitationToken,
    //     }),
    //   });

    //   const data = await response.json();

    //   if (!response.ok || !data.success) {
    //     console.error("Error sending studio invitation email:", data.error);
    //     return { success: false, error: data.error || "Failed to send email" };
    //   }

    //   return { success: true };
    // }

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
