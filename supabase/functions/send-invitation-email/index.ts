import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  location: string;
  invitationToken: string;
  invitedByName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const {
      email,
      firstName,
      lastName,
      role,
      location,
      invitationToken,
      invitedByName,
    }: InvitationEmailRequest = await req.json();

    console.log("Sending invitation email to:", email);

    // Create invitation link - use the current app's origin for the redirect
    // Get the origin from the request headers or use the Lovable app URL as fallback
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || "https://cqlbidkagiknfplzbwse.lovable.app";
    const redirectUrl = `${origin}/auth/complete-signup`;
    const invitationLink = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${invitationToken}&type=invite&redirect_to=${encodeURIComponent(redirectUrl)}`;

    const emailResponse = await resend.emails.send({
      from: "Team <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join our team!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">You're Invited!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
              Hi ${firstName},
            </p>
            <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
              ${invitedByName} has invited you to join our team as a <strong>${role}</strong> at <strong>${location}</strong>.
            </p>
            <p style="margin: 0; color: #333; font-size: 16px;">
              Click the button below to accept your invitation and set up your account.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
              <strong>Your Details:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px;">
              <li>Name: ${firstName} ${lastName}</li>
              <li>Role: ${role}</li>
              <li>Location: ${location}</li>
              <li>Email: ${email}</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              If you didn't expect this invitation, you can safely ignore this email.
              <br>
              This invitation will expire in 7 days.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Invitation email sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send invitation email",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);