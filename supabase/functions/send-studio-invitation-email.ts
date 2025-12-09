// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@^6.9.0";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { toEmail, studioName, studioLogo, senderName, deepLink, webLink, invitationToken, recipientName } = await req.json();
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('BREVO_SMTP_HOST'),
      port: parseInt(Deno.env.get('BREVO_SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: Deno.env.get('BREVO_SMTP_USERNAME'),
        pass: Deno.env.get('BREVO_SMTP_PASSWORD')
      }
    });
    
    // Extract username from email if recipientName not provided
    const displayName = recipientName || toEmail.split('@')[0];
    
    // Email HTML template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
              <p style="margin: 20px 0; font-size: 16px; color: #333; text-align: center;">
                Hey <strong>@${displayName}</strong>,
              </p>
              <p style="margin: 20px 0; font-size: 16px; color: #333; text-align: center;">
                hai ricevuto l'invito per collegarti alla pagina <strong>${studioName}</strong>
              </p>
              <p style="margin: 20px 0; font-size: 18px; font-weight: bold; color: #333; text-align: center;">
                ${studioName}
              </p>
              <p style="margin: 20px 0; font-size: 16px; color: #333; text-align: center;">
                Se è corretto ti chiediamo di cliccare sul pulsante qua sotto:
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${deepLink}" style="background-color: #4CAF50; color: white; padding: 16px 48px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); text-align: center;">
                  Accetto l'invito
                </a>
              </div>
              <p style="margin: 30px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                Se invece pensi si sia trattato di un errore, ti chiediamo di non rispondere a questa email e per qualunque richiesta di informazioni puoi scrivere a <a href="mailto:support@tattoola.app" style="color: #CA2323; text-decoration: none;">support@tattoola.app</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    // Send email
    await transporter.sendMail({
      from: `"${Deno.env.get('BREVO_FROM_NAME')}" <${Deno.env.get('BREVO_FROM_EMAIL')}>`,
      to: toEmail,
      subject: `Sei stato invitato a collegarti a ${studioName}!`,
      html: html
    });
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
