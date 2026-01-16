import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'sent' | 'received' | 'deposit' | 'reversal';
  email: string;
  name: string;
  amount: number;
  recipientName?: string;
  senderName?: string;
  description?: string;
  accountNumber?: string;
  referenceNumber?: string;
  originalTransaction?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { type, email, name, amount, recipientName, senderName, description, accountNumber, referenceNumber, originalTransaction }: NotificationRequest = await req.json();

    let subject = "";
    let htmlContent = "";
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    if (type === 'sent') {
      subject = `Transfer Sent - ${formattedAmount}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a365d; margin: 0;">United Bank</h1>
          </div>
          <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin: 0 0 16px 0;">💸 Money Sent</h2>
            <p style="font-size: 32px; font-weight: bold; color: #1a365d; margin: 0;">-${formattedAmount}</p>
          </div>
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">To</p>
            <p style="font-weight: 600; margin: 0;">${recipientName || 'Recipient'}</p>
          </div>
          ${description ? `
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Description</p>
            <p style="margin: 0;">${description}</p>
          </div>
          ` : ''}
          ${referenceNumber ? `
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Reference</p>
            <p style="font-family: monospace; margin: 0;">${referenceNumber}</p>
          </div>
          ` : ''}
          <div style="padding: 20px 0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">From Account</p>
            <p style="margin: 0;">****${accountNumber?.slice(-4) || '****'}</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">This is an automated notification from United Bank.</p>
          </div>
        </div>
      `;
    } else if (type === 'received') {
      subject = `Money Received - ${formattedAmount}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a365d; margin: 0;">United Bank</h1>
          </div>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #16a34a; margin: 0 0 16px 0;">💰 Money Received</h2>
            <p style="font-size: 32px; font-weight: bold; color: #16a34a; margin: 0;">+${formattedAmount}</p>
          </div>
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">From</p>
            <p style="font-weight: 600; margin: 0;">United Bank</p>
          </div>
          ${description ? `
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Description</p>
            <p style="margin: 0;">${description}</p>
          </div>
          ` : ''}
          <div style="padding: 20px 0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">To Account</p>
            <p style="margin: 0;">****${accountNumber?.slice(-4) || '****'}</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">This is an automated notification from United Bank.</p>
          </div>
        </div>
      `;
    } else if (type === 'deposit') {
      subject = `Deposit Received - ${formattedAmount}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a365d; margin: 0;">United Bank</h1>
          </div>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #16a34a; margin: 0 0 16px 0;">💵 Deposit Received</h2>
            <p style="font-size: 32px; font-weight: bold; color: #16a34a; margin: 0;">+${formattedAmount}</p>
          </div>
          ${description ? `
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Description</p>
            <p style="margin: 0;">${description}</p>
          </div>
          ` : ''}
          <div style="padding: 20px 0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">To Account</p>
            <p style="margin: 0;">****${accountNumber?.slice(-4) || '****'}</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">This is an automated notification from United Bank.</p>
          </div>
        </div>
      `;
    } else if (type === 'reversal') {
      subject = `Payment Reversed - ${formattedAmount} Credited`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a365d; margin: 0;">United Bank</h1>
          </div>
          <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #d97706; margin: 0 0 16px 0;">↩️ Payment Reversed</h2>
            <p style="font-size: 32px; font-weight: bold; color: #16a34a; margin: 0;">+${formattedAmount}</p>
          </div>
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Status</p>
            <p style="font-weight: 600; color: #16a34a; margin: 0;">Successfully Reversed</p>
          </div>
          ${originalTransaction ? `
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Original Transaction</p>
            <p style="margin: 0;">${originalTransaction}</p>
          </div>
          ` : ''}
          <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Credited To Account</p>
            <p style="margin: 0;">****${accountNumber?.slice(-4) || '****'}</p>
          </div>
          <div style="padding: 20px 0;">
            <p style="color: #64748b; margin: 0 0 4px 0;">Message</p>
            <p style="margin: 0;">Your payment reversal request has been processed instantly. The funds have been credited back to your account.</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">This is an automated notification from United Bank.</p>
          </div>
        </div>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "United Bank <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    console.log("Email sent:", data);

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);