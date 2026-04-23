// ═══════════════════════════════════════════════════════════════════════════
// send-ticket-email — šalje email sa QR kartama nakon plaćanja / resend.
// Provajder-agnostičan: bira se preko EMAIL_PROVIDER env (postmark | resend |
// sendgrid | smtp). Template: engleski primarno, fallback na jezik order-a.
//
// POST /send-ticket-email  { order_id?, email?, reason? }  (ili direktno tickets)
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PROVIDER      = (Deno.env.get("EMAIL_PROVIDER") ?? "postmark").toLowerCase();
const FROM_ADDRESS  = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "tickets@kotorwalls.me";
const FROM_NAME     = Deno.env.get("EMAIL_FROM_NAME")    ?? "Kotor Walls";
const TICKETS_URL   = Deno.env.get("TICKETS_VIEW_URL")   ?? "https://kotorwalls.me/karte";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Ticket {
  id?:            string;
  qr_code?:       string;
  qr_image_url?:  string;
  category_name?: string;
  price?:         number;
  language?:      string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "method not allowed" }, 405);

  try {
    const body = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Ako je dostavljen order_id, povuci podatke iz baze; u suprotnom koristi direktan payload.
    let customer = {
      name:  body.customer_name  ?? "",
      email: body.customer_email ?? body.email ?? "",
    };
    let tickets: Ticket[] = body.tickets ?? [];
    let orderTotal   = body.total     ?? null;
    let orderCurrency = body.currency ?? "EUR";
    let language     = body.language ?? "en";
    let orderId      = body.order_id ?? null;

    if (orderId) {
      const { data: order } = await supabase
        .from("kotorwalls_orders")
        .select("id, customer_name, customer_email, total, currency, language")
        .eq("id", orderId)
        .single();
      if (!order) return json({ error: "order not found" }, 404);

      customer.name  = customer.name  || order.customer_name  || "";
      customer.email = customer.email || order.customer_email || "";
      orderTotal     = orderTotal     ?? order.total;
      orderCurrency  = orderCurrency  || order.currency || "EUR";
      language       = language       || order.language || "en";

      const { data: ts } = await supabase
        .from("kotorwalls_tickets")
        .select("id, qr_code, qr_image_url, category_name, price, language")
        .eq("order_id", orderId)
        .order("issued_at", { ascending: true });
      if (ts && ts.length) tickets = ts;
    }

    if (!customer.email) return json({ error: "missing recipient email" }, 400);
    if (!tickets.length) return json({ error: "no tickets to send" }, 400);

    const isReminder = body.reason === "reminder";
    const isResend   = body.reason === "resend";
    const subject    = isReminder
      ? "Reminder: your Kotor Walls tickets"
      : isResend
        ? "Your Kotor Walls tickets (resent)"
        : "Your Kotor Walls tickets";

    const htmlBody = renderEmailHtml({
      customerName: customer.name,
      tickets,
      total:    orderTotal,
      currency: orderCurrency,
      isReminder,
      isResend,
      orderId,
    });

    const textBody = renderEmailText({
      customerName: customer.name,
      tickets,
      total:    orderTotal,
      currency: orderCurrency,
    });

    await sendEmail({
      to:      customer.email,
      toName:  customer.name,
      subject,
      htmlBody,
      textBody,
    });

    if (orderId) {
      await supabase.from("kotorwalls_audit_log").insert({
        actor_type: "system", action: "email.ticket_sent",
        entity: "order", entity_id: orderId,
        metadata: { to: customer.email, reason: body.reason ?? "purchase", provider: PROVIDER },
      });
    }

    return json({ ok: true, sent_to: customer.email, tickets: tickets.length });
  } catch (e) {
    console.error("send-ticket-email:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

// ─── HTML template (engleski primarno) ──────────────────────────────────────
function renderEmailHtml(args: {
  customerName: string;
  tickets: Ticket[];
  total: number | null;
  currency: string;
  isReminder: boolean;
  isResend: boolean;
  orderId: string | null;
}): string {
  const { customerName, tickets, total, currency, isReminder, isResend, orderId } = args;
  const count  = tickets.length;
  const viewUrl = orderId ? `${TICKETS_URL}?order=${orderId}` : TICKETS_URL;

  const headerSubtitle = isReminder
    ? "Reminder for your visit"
    : isResend
      ? "Your tickets — resent"
      : "Your tickets are ready";

  const intro = isReminder
    ? `This is a reminder that you have tickets for the <strong>Kotor City Walls</strong>. Please have your QR codes ready at the entrance.`
    : isResend
      ? `As requested, here are your tickets for the <strong>Kotor City Walls</strong> again.`
      : `Thank you for your purchase. Below are your <strong>${count}</strong> ticket(s) for the <strong>Kotor City Walls</strong> (UNESCO World Heritage Site).`;

  const ticketsHtml = tickets.map((t, i) => `
    <tr>
      <td style="padding: 14px 18px; border-bottom: 1px solid #eee;">
        <div style="font-size: 13px; color: #6B7684; letter-spacing: 0.4px; text-transform: uppercase; font-weight: 600;">Ticket ${i + 1}${t.category_name ? ` · ${esc(t.category_name)}` : ""}</div>
        <div style="font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: #1A1F2B; margin-top: 4px; font-weight: 600;">${esc(t.qr_code ?? "")}</div>
        ${t.price != null ? `<div style="font-size: 12px; color: #9AA3B2; margin-top: 2px;">${fmtMoney(t.price, currency)}</div>` : ""}
      </td>
      <td style="padding: 14px 18px; border-bottom: 1px solid #eee; text-align: right; vertical-align: middle;">
        ${t.qr_image_url ? `<img src="${esc(t.qr_image_url)}" alt="QR" width="80" height="80" style="display: inline-block; border: 1px solid #E6E8EB; border-radius: 6px; padding: 4px; background: #fff;" />` : `<div style="font-size: 12px; color: #9AA3B2;">QR unavailable</div>`}
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Kotor Walls — tickets</title></head>
<body style="margin: 0; padding: 0; background: #F7F8FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1F2B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F7F8FA; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(16,24,40,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #B23A3A 0%, #8E2A2A 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">Kotor City Walls</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px; font-weight: 500;">${headerSubtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <p style="font-size: 15px; color: #1A1F2B; margin: 0 0 10px; font-weight: 600;">Dear ${esc(customerName || "guest")},</p>
              <p style="font-size: 14px; color: #4A5363; margin: 0 0 24px; line-height: 1.6;">${intro}</p>

              <!-- CTA -->
              <div style="background: #FBF2D6; border: 1px solid #EADD9C; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="font-size: 13px; color: #A8841C; margin: 0 0 12px; font-weight: 700; letter-spacing: 0.2px;">VIEW ALL YOUR TICKETS ONLINE</p>
                <a href="${esc(viewUrl)}" style="display: inline-block; background: #B23A3A; color: #FFFFFF; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">Open my ${count > 1 ? `tickets (${count})` : "ticket"}</a>
              </div>

              ${count > 0 ? `
              <p style="font-size: 12px; color: #6B7684; margin: 0 0 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;">Your QR codes</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E6E8EB; border-radius: 10px; overflow: hidden;">
                ${ticketsHtml}
              </table>
              ` : ""}

              ${total != null ? `
              <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #F0F1F4; display: flex; justify-content: space-between;">
                <span style="font-size: 13px; color: #6B7684;">Total paid</span>
                <span style="font-size: 14px; color: #1A1F2B; font-weight: 700;">${fmtMoney(total, currency)}</span>
              </div>
              ` : ""}

              <p style="font-size: 12px; color: #9AA3B2; margin: 24px 0 0; line-height: 1.6;">
                Present the QR code at the automated gate. Each QR can be used once. The walls open from 08:00 — please check local conditions on the day of your visit.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F7F8FA; padding: 20px 40px; text-align: center; border-top: 1px solid #F0F1F4;">
              <p style="font-size: 11px; color: #6B7684; margin: 0 0 4px; font-weight: 600;">Kotor City Walls d.o.o. · PIB 03123456</p>
              <p style="font-size: 11px; color: #9AA3B2; margin: 0; line-height: 1.6;">
                Stari grad bb, 85330 Kotor, Montenegro · support@kotorwalls.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderEmailText(args: {
  customerName: string;
  tickets: Ticket[];
  total: number | null;
  currency: string;
}): string {
  const lines = [
    `Dear ${args.customerName || "guest"},`,
    "",
    "Here are your tickets for the Kotor City Walls (UNESCO World Heritage Site).",
    "",
    ...args.tickets.map((t, i) => `Ticket ${i + 1}: ${t.qr_code ?? "—"}${t.category_name ? ` (${t.category_name})` : ""}`),
    "",
  ];
  if (args.total != null) lines.push(`Total paid: ${fmtMoney(args.total, args.currency)}`);
  lines.push("", "Present the QR code at the automated gate.", "", "Kotor City Walls d.o.o. — support@kotorwalls.com");
  return lines.join("\n");
}

// ─── Provajder-agnostičan slanje ────────────────────────────────────────────
async function sendEmail(args: {
  to: string; toName?: string;
  subject: string; htmlBody: string; textBody: string;
}): Promise<void> {
  switch (PROVIDER) {
    case "postmark":  return sendViaPostmark(args);
    case "resend":    return sendViaResend(args);
    case "sendgrid":  return sendViaSendgrid(args);
    case "zeptomail": return sendViaZepto(args);
    default: throw new Error(`Unknown EMAIL_PROVIDER: ${PROVIDER}`);
  }
}

async function sendViaPostmark(a: { to: string; toName?: string; subject: string; htmlBody: string; textBody: string; }) {
  const token = Deno.env.get("POSTMARK_SERVER_TOKEN");
  if (!token) throw new Error("POSTMARK_SERVER_TOKEN not set");
  const r = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type":     "application/json",
      Accept:             "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From:     `${FROM_NAME} <${FROM_ADDRESS}>`,
      To:       a.toName ? `${a.toName} <${a.to}>` : a.to,
      Subject:  a.subject,
      HtmlBody: a.htmlBody,
      TextBody: a.textBody,
      MessageStream: Deno.env.get("POSTMARK_MESSAGE_STREAM") ?? "outbound",
    }),
  });
  if (!r.ok) throw new Error(`Postmark ${r.status}: ${await r.text()}`);
}

async function sendViaResend(a: { to: string; toName?: string; subject: string; htmlBody: string; textBody: string; }) {
  const token = Deno.env.get("RESEND_API_KEY");
  if (!token) throw new Error("RESEND_API_KEY not set");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      from:    `${FROM_NAME} <${FROM_ADDRESS}>`,
      to:      [a.to],
      subject: a.subject,
      html:    a.htmlBody,
      text:    a.textBody,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

async function sendViaSendgrid(a: { to: string; toName?: string; subject: string; htmlBody: string; textBody: string; }) {
  const token = Deno.env.get("SENDGRID_API_KEY");
  if (!token) throw new Error("SENDGRID_API_KEY not set");
  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: a.to, name: a.toName }] }],
      from:    { email: FROM_ADDRESS, name: FROM_NAME },
      subject: a.subject,
      content: [
        { type: "text/plain", value: a.textBody },
        { type: "text/html",  value: a.htmlBody },
      ],
    }),
  });
  if (!r.ok && r.status !== 202) throw new Error(`SendGrid ${r.status}: ${await r.text()}`);
}

async function sendViaZepto(a: { to: string; toName?: string; subject: string; htmlBody: string; textBody: string; }) {
  const token = Deno.env.get("ZEPTO_API_KEY");
  if (!token) throw new Error("ZEPTO_API_KEY not set");
  const r = await fetch("https://api.zeptomail.eu/v1.1/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: token },
    body: JSON.stringify({
      from: { address: FROM_ADDRESS, name: FROM_NAME },
      to:   [{ email_address: { address: a.to, name: a.toName ?? "" } }],
      subject:  a.subject,
      htmlbody: a.htmlBody,
      textbody: a.textBody,
      track_opens: true,
    }),
  });
  if (!r.ok) throw new Error(`Zepto ${r.status}: ${await r.text()}`);
}

// ─── util ───────────────────────────────────────────────────────────────────
function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function fmtMoney(n: number, cur = "EUR"): string {
  const v = Number(n ?? 0);
  const sym = cur === "EUR" ? "€" : `${cur} `;
  return `${sym}${v.toFixed(2)}`;
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
