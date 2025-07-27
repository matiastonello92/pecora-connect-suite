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
  isResend?: boolean;
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
      isResend = false,
    }: InvitationEmailRequest = await req.json();

    console.log("Sending invitation email to:", email);
    console.log("Invitation token:", invitationToken);
    console.log("Request headers origin:", req.headers.get('origin'));
    console.log("Request headers referer:", req.headers.get('referer'));

    // Create invitation link - DIRECT to our app with token as query parameter
    // Get the origin from the request headers or use the Lovable app URL as fallback
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || "https://cqlbidkagiknfplzbwse.lovable.app";
    // Direct link to our registration page with token - NOT through Supabase auth
    const invitationLink = `${origin}/auth/complete-signup?token=${invitationToken}&type=invite`;
    
    console.log("Generated invitation link:", invitationLink);

    // Generate unique identifiers to prevent email threading
    const timestamp = new Date().toISOString();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    
    // Create subject that prevents threading
    const subject = isResend 
      ? `New invitation to join our team - ${firstName}`
      : `You're invited to join our team!`;

    const emailResponse = await resend.emails.send({
      from: "Management PN <noreply@managementpn.services>",
      to: [email],
      subject,
      headers: {
        // Prevent email threading by using unique message ID
        'Message-ID': `<invitation-${uniqueId}-${Date.now()}@managementpn.services>`,
        // Ensure this doesn't thread with previous emails
        'X-Entity-Ref-ID': `invitation-${invitationToken}`,
      },
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 12px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${isResend ? '🔄 New Invitation!' : '🎉 You\'re Invited!'}
            </h1>
            ${isResend ? '<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">This is a fresh invitation with an updated link.</p>' : '<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Join our team at La Pecoranegra</p>'}
          </div>
          
          <!-- Main Content -->
          <div style="background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 30px;">
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 18px; line-height: 1.6;">
              Hi <strong>${firstName}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              ${invitedByName} has ${isResend ? 'sent you a new' : 'invited you to join our'} team as a <strong style="color: #667eea;">${role}</strong> at <strong style="color: #667eea;">${location}</strong>.
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Click the button below to accept your invitation and set up your account securely.
            </p>
            ${isResend ? '<div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;"><p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: 600;">⚠️ This new link replaces any previous invitation. Previous links are now invalid.</p></div>' : ''}
          </div>
           
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${invitationLink}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: #ffffff; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600; 
                      font-size: 16px;
                      display: inline-block; 
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                      transition: all 0.3s ease;">
              ${isResend ? '🔗 Accept New Invitation' : '✨ Accept Invitation & Register'}
            </a>
          </div>
          
          <!-- Details Section -->
          <div style="background: #f1f5f9; padding: 30px; border-radius: 12px; margin: 30px 0;">
            <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">
              📋 Your Details:
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500; width: 30%;">Name:</td>
                <td style="padding: 8px 0; color: #334155; font-weight: 600;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Role:</td>
                <td style="padding: 8px 0; color: #334155; font-weight: 600;">${role}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Location:</td>
                <td style="padding: 8px 0; color: #334155; font-weight: 600;">${location}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Email:</td>
                <td style="padding: 8px 0; color: #334155; font-weight: 600;">${email}</td>
              </tr>
            </table>
            ${isResend ? `<p style="color: #64748b; font-size: 14px; margin: 16px 0 0 0;">📅 New invitation sent: ${new Date().toLocaleString()}</p>` : ''}
          </div>
          
          <!-- Security Notice -->
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h4 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">🔒 Security Notice:</h4>
            <ul style="color: #047857; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
              <li>This invitation is valid for 7 days</li>
              <li>The link can only be used once</li>
              <li>Your account will be securely created upon registration</li>
              ${isResend ? '<li><strong>Previous invitation links are now invalid</strong></li>' : ''}
            </ul>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
              This invitation was sent by ${invitedByName} from La Pecoranegra Management System
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              If you didn't expect this invitation, you can safely ignore this email.
              <br>
              ${isResend ? '<strong>Note:</strong> This replaces any previous invitation links which are now invalid.' : ''}
            </p>
            <div style="margin-top: 20px;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} La Pecoranegra Restaurant Management • managementpn.services
              </p>
            </div>
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