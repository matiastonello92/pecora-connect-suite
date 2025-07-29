import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  email: string;
  title: string;
  message: string;
  severity: string;
  alertType: string;
  metadata?: any;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#d97706';
    case 'low': return '#65a30d';
    default: return '#6b7280';
  }
};

const getSeverityEmoji = (severity: string) => {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return 'ℹ️';
    default: return '📧';
  }
};

const getAlertTypeLabel = (alertType: string) => {
  switch (alertType) {
    case 'new_function_detected': return 'Nuova Funzione Rilevata';
    case 'stress_test_failure': return 'Test di Stress Fallito';
    case 'performance_bottleneck': return 'Bottleneck di Performance';
    default: return 'Alert di Sistema';
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Alert email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      title, 
      message, 
      severity, 
      alertType, 
      metadata 
    }: AlertEmailRequest = await req.json();

    console.log('Processing alert email for:', email, 'severity:', severity);

    if (!email || !title || !message) {
      throw new Error('Email, title, and message are required');
    }

    const severityColor = getSeverityColor(severity);
    const severityEmoji = getSeverityEmoji(severity);
    const alertTypeLabel = getAlertTypeLabel(alertType);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert di Sistema - Dashboard Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${severityColor}, ${severityColor}dd);
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .alert-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      margin-top: 8px;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
    }
    .alert-info {
      background: #f8fafc;
      border-left: 4px solid ${severityColor};
      padding: 16px;
      margin-bottom: 20px;
      border-radius: 0 4px 4px 0;
    }
    .alert-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    .alert-message {
      color: #4b5563;
      margin: 0;
      font-size: 14px;
    }
    .metadata-section {
      margin-top: 20px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .metadata-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    .metadata-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .metadata-key {
      color: #6b7280;
      font-weight: 500;
    }
    .metadata-value {
      color: #1f2937;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 12px;
      margin: 0;
    }
    .dashboard-link {
      display: inline-block;
      background: ${severityColor};
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 20px;
      transition: opacity 0.2s;
    }
    .dashboard-link:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${severityEmoji} Alert di Sistema</h1>
      <div class="alert-badge">${alertTypeLabel}</div>
    </div>
    
    <div class="content">
      <div class="alert-info">
        <h3 class="alert-title">${title}</h3>
        <p class="alert-message">${message}</p>
      </div>
      
      ${metadata && Object.keys(metadata).length > 0 ? `
      <div class="metadata-section">
        <div class="metadata-title">Dettagli Aggiuntivi</div>
        ${Object.entries(metadata).map(([key, value]) => `
        <div class="metadata-item">
          <span class="metadata-key">${key}:</span>
          <span class="metadata-value">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      <div style="text-align: center;">
        <a href="https://app.managementpn.services/app/test" class="dashboard-link">
          Vai alla Dashboard Test
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Questo è un alert automatico dal sistema di monitoraggio dei test.</p>
      <p>Dashboard Management PN Services - ${new Date().toLocaleString('it-IT')}</p>
    </div>
  </div>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Dashboard Test <alerts@managementpn.services>",
      to: [email],
      subject: `${severityEmoji} ${alertTypeLabel} - ${title}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-alert-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);