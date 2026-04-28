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

    let fiscalIkof: string | null = null;
    let isFiscalized = false;

    if (orderId) {
      const { data: order } = await supabase
        .from("kotorwalls_orders")
        .select("id, customer_name, customer_email, total, currency, language, fiscal_status, fiscal_ikof")
        .eq("id", orderId)
        .single();
      if (!order) return json({ error: "order not found" }, 404);

      customer.name  = customer.name  || order.customer_name  || "";
      customer.email = customer.email || order.customer_email || "";
      orderTotal     = orderTotal     ?? order.total;
      orderCurrency  = orderCurrency  || order.currency || "EUR";
      language       = language       || order.language || "en";
      isFiscalized   = order.fiscal_status === "fiscalized";
      fiscalIkof     = order.fiscal_ikof ?? null;

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
      ? "🎫 Podsjetnik: Vaše karte za Kotorske zidine"
      : isResend
        ? "🎫 Vaše karte za Kotorske zidine (ponovo poslato)"
        : "🎫 Vaše karte: Kotorske zidine";

    const htmlBody = renderEmailHtml({
      customerName: customer.name,
      tickets,
      total:    orderTotal,
      currency: orderCurrency,
      isReminder,
      isResend,
      orderId,
      isFiscalized,
      fiscalIkof,
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

// ─── HTML template (premium dizajn, identičan etiketing.me, prilagođen za
// Zidine: nema event_name/datum/vrijeme/venue/calendar dugmadi). ───────────
function renderEmailHtml(args: {
  customerName: string;
  tickets: Ticket[];
  total: number | null;
  currency: string;
  isReminder: boolean;
  isResend: boolean;
  orderId: string | null;
  isFiscalized: boolean;
  fiscalIkof: string | null;
}): string {
  const { customerName, tickets, total, currency, isReminder, isResend, orderId, isFiscalized, fiscalIkof } = args;
  const count   = tickets.length;
  const viewUrl = orderId ? `${TICKETS_URL}?order=${orderId}` : TICKETS_URL;
  const orderRef = orderId ? orderId.slice(0, 8).toUpperCase() : "—";

  const subtotal = tickets.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const totalAmount = total ?? subtotal;
  const cur = currency || "EUR";

  // Ticket stubs — identičan dizajn kao etiketing premium template
  const ticketStubsHtml = tickets.map((t, i) => {
    const qrUrl = t.qr_image_url
      ? esc(t.qr_image_url)
      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(t.qr_code ?? "ticket")}`;
    const ticketLabel = t.category_name ? esc(t.category_name) : "Ulaznica";
    const ticketIdShort = t.qr_code ? esc(t.qr_code) : (t.id ? esc(t.id).slice(0, 12) : "");
    return `
<tr>
  <td style="padding: 0 28px 10px 28px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-card" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
      <tr>
        <td width="5" style="background: linear-gradient(180deg, #1e3a8a, #2d55c7); width: 5px;"></td>
        <td style="padding: 16px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td valign="top">
                <p class="dm-blue-accent" style="margin: 0 0 2px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #1e3a8a; text-transform: uppercase;">Ulaznica #${String(i + 1).padStart(2, "0")}</p>
                <p class="dm-text-primary" style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">${ticketLabel}</p>
                <p class="dm-text-mono" style="margin: 0; font-size: 11px; color: #999; font-family: monospace;">${ticketIdShort}</p>
                ${t.price != null ? `<p class="dm-text-secondary" style="margin: 6px 0 0; font-size: 12px; color: #666;">${fmtMoney(Number(t.price), cur)}</p>` : ""}
              </td>
              <td width="100" align="right" valign="top">
                <img src="${qrUrl}" alt="QR" width="96" height="96" style="border-radius: 4px; display: block;" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
  }).join("\n");

  const greeting = customerName ? esc(customerName) : "kupac";
  const headerStatusText = isReminder ? "Podsjetnik" : isResend ? "Karte ponovo poslate" : "Plaćanje potvrđeno";
  const introText = isReminder
    ? "Podsjećamo vas na karte za posjetu Kotorskim zidinama. Sačuvajte QR kodove i pokažite ih na ulazu."
    : isResend
      ? "Po vašem zahtjevu, evo ponovo vaših karata za Kotorske zidine."
      : "Vaše karte su spremne. Sačuvajte ih ili ih pokažite na ulazu.";

  return `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Vaše karte — Kotorske zidine</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "Reservation",
  "reservationNumber": "${orderRef}",
  "reservationStatus": "http://schema.org/ReservationConfirmed",
  "underName": { "@type": "Person", "name": "${esc(customerName || "")}" },
  "reservationFor": {
    "@type": "TouristAttraction",
    "name": "Kotor City Walls",
    "address": { "@type": "PostalAddress", "streetAddress": "Stari grad bb", "addressLocality": "Kotor", "postalCode": "85330", "addressCountry": "ME" }
  },
  "numSeats": "${count}",
  "ticketNumber": "${orderRef}",
  "ticketPrintUrl": "${esc(viewUrl)}",
  "potentialAction": { "@type": "ViewAction", "url": "${esc(viewUrl)}", "name": "Prikaži ulaznice" },
  "totalPrice": "${totalAmount.toFixed(2)}",
  "priceCurrency": "${cur}"
}
</script>
<style type="text/css">
:root{color-scheme:light dark;supported-color-schemes:light dark}
body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
body{margin:0!important;padding:0!important;width:100%!important}
@media (prefers-color-scheme:dark){
body,.dm-body{background-color:#1a1a2e!important}
.dm-content{background-color:#252540!important}
.dm-card{background-color:#2a2a45!important;border-color:rgba(255,255,255,0.1)!important}
.dm-text-primary{color:#e0e0e0!important}
.dm-text-secondary{color:#bbb!important}
.dm-text-muted{color:#aaa!important}
.dm-text-mono{color:#ccc!important}
.dm-divider{border-color:#3a3a55!important}
.dm-info{background-color:rgba(30,58,138,0.2)!important}
.dm-fiscal{background-color:rgba(22,101,52,0.15)!important}
.dm-fiscal p,.dm-fiscal a{color:#86efac!important}
.dm-refund{background-color:rgba(133,77,14,0.15)!important}
.dm-refund p,.dm-refund a{color:#fcd34d!important}
.dm-label{color:rgba(255,255,255,0.5)!important}
.dm-price-value{color:#e0e0e0!important}
.dm-header-dark{background-color:#1a1a2e!important}
.dm-blue-accent{color:#93b4ff!important}
.dm-link{color:#93b4ff!important}
.dm-footer-border{border-color:#3a3a55!important}
}
</style>
</head>
<body class="dm-body" style="margin:0;padding:0;background-color:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<!-- Preview text -->
<div style="display:none;font-size:1px;color:#f0ede8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Vaše karte za Kotorske zidine · UNESCO svjetska baština
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-body" style="background-color:#f0ede8;">
<tr>
<td align="center" style="padding: 32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;">

<!-- DARK HEADER -->
<tr>
<td style="background-color:#1a1a2e;border-radius:16px 16px 0 0;padding:32px 28px 28px 28px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="40" height="40" align="center" valign="middle">
              <img src="https://hvpytasddzeprgqkwlbu.supabase.co/storage/v1/object/public/razno/kotor.png" alt="Kotor Walls" width="40" height="40" style="display:block;border-radius:6px;" />
            </td>
            <td style="padding-left:10px;">
              <span style="color:#ffffff;font-size:16px;font-weight:600;letter-spacing:-0.01em;">Kotor Walls</span>
            </td>
          </tr>
        </table>
      </td>
      <td align="right">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background-color:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);border-radius:16px;padding:4px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="6" height="6" style="background-color:#4ade80;border-radius:3px;"></td>
                  <td style="padding-left:6px;font-size:11px;color:rgba(255,255,255,0.9);font-weight:500;">${esc(headerStatusText)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 8px 0;font-size:11px;font-weight:500;letter-spacing:0.12em;color:rgba(255,255,255,0.5);text-transform:uppercase;">
    Potvrda rezervacije · #${orderRef}
  </p>
  <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">
    Kotorske gradske zidine
  </h1>
  <p style="margin:8px 0 0 0;font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;letter-spacing:0.05em;">
    UNESCO World Heritage · Stari grad Kotor
  </p>
</td>
</tr>

<!-- MAIN CONTENT -->
<tr>
<td class="dm-content" style="background-color:#f8f6f2;padding:0;border-radius:0 0 16px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

    <!-- Greeting -->
    <tr>
      <td style="padding:28px 28px 8px 28px;">
        <p class="dm-text-primary" style="margin:0;font-size:15px;color:#444;line-height:1.6;">
          Dragi/a <strong class="dm-text-primary" style="color:#1a1a2e;">${greeting}</strong>,
        </p>
        <p class="dm-text-secondary" style="margin:8px 0 0;font-size:14px;color:#666;line-height:1.6;">
          ${esc(introText)}
        </p>
      </td>
    </tr>

    <!-- Tickets label -->
    <tr>
      <td style="padding:20px 28px 10px 28px;">
        <p class="dm-text-muted" style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#999;text-transform:uppercase;">Vaše ulaznice</p>
      </td>
    </tr>

    ${ticketStubsHtml}

    <!-- CTA Button -->
    <tr>
      <td style="padding:14px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="background-color:#1e3a8a;border-radius:10px;">
              <a href="${esc(viewUrl)}" target="_blank" style="display:block;padding:15px 0;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;text-align:center;">Prikaži sve ulaznice →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Price summary -->
    <tr>
      <td style="padding:20px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-card" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:18px 20px;">
              <p class="dm-text-muted" style="margin:0 0 14px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;color:#999;text-transform:uppercase;">Rekapitulacija</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="dm-text-secondary" style="font-size:13px;color:#666;padding-bottom:12px;">${count} ${count === 1 ? "ulaznica" : "ulaznice"}</td>
                  <td align="right" class="dm-text-primary" style="font-size:13px;color:#333;font-weight:500;padding-bottom:12px;">${fmtMoney(subtotal, cur)}</td>
                </tr>
                <tr>
                  <td colspan="2" class="dm-divider" style="border-top:1px solid #f0ede8;padding-top:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td class="dm-text-primary" style="font-size:14px;font-weight:600;color:#1a1a2e;">Ukupno plaćeno</td>
                        <td align="right" class="dm-price-value" style="font-size:20px;font-weight:700;color:#1a1a2e;">${fmtMoney(totalAmount, cur)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Fiscal receipt block — link na fiskalni račun (CG CIS) -->
    ${isFiscalized && orderId ? `<tr>
      <td style="padding:12px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-fiscal" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
          <tr>
            <td style="padding:14px 16px;">
              <p class="dm-fiscal" style="margin:0 0 4px 0;font-size:13px;color:#166534;line-height:1.5;font-weight:700;">
                ✓ Fiskalni račun
              </p>
              <p class="dm-fiscal" style="margin:0 0 12px 0;font-size:12px;color:#166534;line-height:1.5;">
                Vaš fiskalni račun je registrovan u Crnogorskom poreskom sistemu (CIS).${fiscalIkof ? ` IKOF: <span style="font-family:monospace;">${esc(fiscalIkof.slice(0, 16))}…</span>` : ""}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#166534;border-radius:8px;">
                    <a href="https://www.kotorwalls.com/racun?order=${esc(orderId)}" target="_blank" style="display:inline-block;padding:10px 18px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">
                      📄 Preuzmite račun →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : (orderId ? `<tr>
      <td style="padding:12px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-fiscal" style="background-color:#f0fdf4;border-radius:8px;">
          <tr>
            <td style="padding:12px 14px;">
              <p class="dm-fiscal" style="margin:0;font-size:12px;color:#166534;line-height:1.5;">
                <span style="font-weight:600;">✓ Plaćanje primljeno.</span> Fiskalni račun će biti dostupan u kratkom roku. Pišite na <a href="mailto:support@kotorwalls.com" style="color:#166534;font-weight:600;text-decoration:underline;">support@kotorwalls.com</a> ako vam ne stigne za 1h.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : "")}

    <!-- Right of withdrawal notice (ZZP CG 12/2026, čl. 119 st. 1 t. 12) -->
    <tr>
      <td style="padding:10px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-refund" style="background-color:#fefce8;border-radius:8px;">
          <tr>
            <td style="padding:12px 14px;">
              <p class="dm-refund" style="margin:0 0 8px 0;font-size:12px;color:#854d0e;line-height:1.5;">
                <strong>⚠️ Right of withdrawal (Art. 119 §1(12) MNE Consumer Protection Act 12/2026):</strong> Dated entrance tickets to a tourist attraction are a final purchase. You do not have the right to unilaterally withdraw from this contract within 14 days. Refunds apply only in case of attraction closure or force majeure.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${orderId ? `<!-- Distance Sales Contract (čl. 109 ZZP CG) — frontend ruta na kotorwalls.com -->
    <tr>
      <td style="padding:12px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border:1px solid #d1d5db;border-radius:8px;">
          <tr>
            <td style="padding:12px 14px;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#111827;line-height:1.5;"><strong>📄 Distance Sales Contract (Art. 109 of the Act)</strong></p>
              <p style="margin:0 0 10px 0;font-size:11px;color:#4b5563;line-height:1.5;">The official contract document with all legally required elements is available at the link below. You can print it or save it as PDF from your browser.</p>
              <a href="https://www.kotorwalls.com/ugovor-na-daljinu?order_id=${esc(orderId)}" style="display:inline-block;padding:8px 14px;background:#1e3a8a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">Open distance sales contract →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ""}

    <!-- Prodavac & podrška -->
    <tr>
      <td style="padding:10px 28px 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#eff6ff;border-radius:8px;">
          <tr>
            <td style="padding:12px 14px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#1e3a8a;line-height:1.5;">
                <strong>Prodavac:</strong> Opština Kotor, Stari grad bb, 85330 Kotor, Crna Gora.
              </p>
              <p style="margin:0;font-size:12px;color:#1e3a8a;line-height:1.5;">
                <strong>Podrška i prigovori:</strong> <a href="mailto:support@kotorwalls.com" style="color:#1e3a8a;text-decoration:underline;font-weight:500;">support@kotorwalls.com</a> · odgovor u roku od 8 dana.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Napomena o korišćenju -->
    <tr>
      <td style="padding:14px 28px 0 28px;">
        <p style="margin:0;font-size:11px;color:#666;line-height:1.6;">
          QR kod pokažite na automatskoj kapiji. Svaki QR se može iskoristiti samo jednom. Zidine se otvaraju u 08:00 — provjerite dnevne uslove pred posjetu.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="dm-footer-border" style="padding:24px 28px 6px 28px;border-top:1px solid #e5e0d8;margin-top:20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td>
              <p class="dm-text-muted" style="margin:0 0 2px 0;font-size:11px;color:#aaa;">Datum kupovine</p>
              <p class="dm-text-secondary" style="margin:0;font-size:12px;color:#666;font-weight:500;">${new Date().toLocaleDateString("sr-ME")}</p>
            </td>
            <td align="right">
              <p class="dm-text-muted" style="margin:0 0 2px 0;font-size:11px;color:#aaa;">Pitanja i podrška</p>
              <a href="mailto:support@kotorwalls.com" class="dm-link" style="font-size:12px;color:#1e3a8a;font-weight:500;text-decoration:none;">support@kotorwalls.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Copyright -->
    <tr>
      <td style="padding:16px 28px 24px 28px;" align="center">
        <p class="dm-text-muted" style="margin:0;font-size:10px;color:#ccc;letter-spacing:0.05em;">
          © ${new Date().getFullYear()} Kotor Walls · Opština Kotor · Crna Gora
        </p>
      </td>
    </tr>

  </table>
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
    `Dragi/a ${args.customerName || "kupac"},`,
    "",
    "Vaše karte za Kotorske gradske zidine (UNESCO svjetska baština) su spremne.",
    "",
    ...args.tickets.map((t, i) => `Ulaznica ${i + 1}: ${t.qr_code ?? "—"}${t.category_name ? ` (${t.category_name})` : ""}`),
    "",
  ];
  if (args.total != null) lines.push(`Ukupno plaćeno: ${fmtMoney(args.total, args.currency)}`);
  lines.push(
    "",
    "QR kod pokažite na automatskoj kapiji. Svaki QR se može iskoristiti samo jednom.",
    "",
    "Opština Kotor — support@kotorwalls.com",
  );
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
