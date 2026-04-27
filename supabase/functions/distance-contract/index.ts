// ═══════════════════════════════════════════════════════════════════════════
// distance-contract — generiše HTML "Distance Sales Contract" stranicu za
// jedan order (zakonska obaveza po MNE Consumer Protection Act 12/2026 čl. 109).
//
// GET /distance-contract?order_id=<uuid>     → HTML stranica (printable)
// GET /distance-contract?session_id=<stripe> → isto, fallback preko stripe sess id
//
// Engleski primarno (Kotor Walls = strani turisti), Montenegrin sekcija ispod.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const orderId   = url.searchParams.get("order_id");
    const sessionId = url.searchParams.get("session_id");

    if (!orderId && !sessionId) {
      return htmlResponse(renderError("Missing order_id or session_id"), 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let q = supabase
      .from("kotorwalls_orders")
      .select("id, customer_name, customer_email, customer_phone, customer_country, subtotal, service_fee, total, currency, language, created_at, paid_at, stripe_session_id, payment_status, fiscal_status, fiscal_ikof");

    if (orderId)   q = q.eq("id", orderId);
    else           q = q.eq("stripe_session_id", sessionId);

    const { data: order, error: orderErr } = await q.maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) return htmlResponse(renderError("Order not found"), 404);

    const { data: tickets } = await supabase
      .from("kotorwalls_tickets")
      .select("id, qr_code, category_name, price")
      .eq("order_id", order.id)
      .order("issued_at", { ascending: true });

    const html = renderContract({ order, tickets: tickets ?? [] });
    return htmlResponse(html, 200);
  } catch (e) {
    console.error("distance-contract:", e);
    return htmlResponse(renderError(String((e as Error)?.message ?? e)), 500);
  }
});

// ─── helpers ────────────────────────────────────────────────────────────────
function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function fmtMoney(n: number, cur = "EUR"): string {
  const v = Number(n ?? 0);
  const sym = cur === "EUR" ? "€" : `${cur} `;
  return `${sym}${v.toFixed(2)}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function renderError(msg: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title>
<style>body{font-family:system-ui,sans-serif;background:#f7f8fa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#1a1f2b}
.box{background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:32px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.04)}</style>
</head><body><div class="box"><h1 style="margin:0 0 8px;font-size:18px">Distance Sales Contract</h1><p style="color:#6b7684;margin:0;font-size:13px">${esc(msg)}</p></div></body></html>`;
}

function renderContract(args: {
  order: any;
  tickets: { id: string; qr_code?: string; category_name?: string; price?: number }[];
}): string {
  const { order, tickets } = args;
  const cur = order.currency || "EUR";
  const total = Number(order.total) || 0;
  const created = fmtDate(order.created_at);
  const orderRef = String(order.id || "").slice(0, 8).toUpperCase();
  const itemsRows = tickets.length
    ? tickets.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(t.category_name || "Entrance ticket — Kotor City Walls")}</td>
        <td style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#6b7684">${esc(t.qr_code || "—")}</td>
        <td style="text-align:right">${fmtMoney(Number(t.price || 0), cur)}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" style="text-align:center;color:#6b7684">No items</td></tr>`;
  const itemsTotal = tickets.reduce((s, t) => s + (Number(t.price) || 0), 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Distance Sales Contract · #${orderRef} · Kotor Walls</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f7f8fa;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1f2b;line-height:1.55;font-size:14px}
.toolbar{position:sticky;top:0;background:#fff;border-bottom:1px solid #e6e8eb;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;z-index:10}
.toolbar h1{margin:0;font-size:14px;font-weight:600;color:#4a5363;letter-spacing:0.2px}
.toolbar button{background:#b23a3a;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer}
.toolbar button:hover{background:#8e2a2a}
.page{max-width:820px;margin:24px auto;background:#fff;padding:48px 56px;box-shadow:0 2px 20px rgba(26,31,43,0.06);border-radius:8px}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a1f2b;padding-bottom:18px;margin-bottom:28px}
.head .logo{display:flex;align-items:center;gap:12px}
.head .logo img{width:48px;height:48px;border-radius:8px;display:block;object-fit:contain}
.head .logo .name{font-weight:700;font-size:16px}
.head .meta{text-align:right;font-size:11px;color:#6b7684}
.head .meta .ref{font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#1a1f2b;font-weight:600;margin-bottom:2px}
h1.title{font-size:22px;font-weight:800;letter-spacing:-0.4px;margin:0 0 4px;color:#1a1f2b}
.subtitle{font-size:12px;color:#6b7684;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;margin-bottom:24px}
.legal-ref{background:#fbf2d6;border:1px solid #eadd9c;border-radius:8px;padding:12px 14px;font-size:12px;color:#5d4915;margin-bottom:28px}
.legal-ref strong{color:#a8841c}
section{margin-bottom:24px}
section h2{font-size:13px;font-weight:700;color:#1a1f2b;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #e6e8eb}
.kv{display:grid;grid-template-columns:180px 1fr;gap:6px 16px;margin-bottom:8px}
.kv .k{color:#6b7684;font-size:12px}
.kv .v{color:#1a1f2b;font-size:13px}
table.items{width:100%;border-collapse:collapse;margin-top:6px}
table.items th{text-align:left;font-size:11px;font-weight:700;color:#6b7684;text-transform:uppercase;letter-spacing:0.4px;padding:8px 10px;background:#f7f8fa;border-bottom:1px solid #e6e8eb}
table.items td{padding:10px;border-bottom:1px solid #f0f1f4;font-size:13px}
table.items tfoot td{background:#fbf2d6;font-weight:700;font-size:14px}
.summary{display:flex;justify-content:flex-end;margin-top:14px}
.summary table{font-size:13px;min-width:280px}
.summary table td{padding:6px 12px}
.summary .total td{font-size:15px;font-weight:800;border-top:2px solid #1a1f2b;padding-top:10px;color:#1a1f2b}
.notice{background:#f7f8fa;border-left:3px solid #b23a3a;padding:12px 14px;font-size:12px;color:#4a5363;margin:8px 0;border-radius:0 6px 6px 0}
.notice strong{color:#1a1f2b}
.signature{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:36px;padding-top:24px;border-top:1px dashed #e6e8eb}
.signature .box{font-size:11px;color:#6b7684}
.signature .line{border-bottom:1px solid #1a1f2b;height:30px;margin-bottom:6px}
.footer-note{margin-top:32px;padding-top:16px;border-top:1px solid #e6e8eb;font-size:10px;color:#9aa3b2;text-align:center}
.lang-section{margin-top:48px;padding-top:24px;border-top:2px solid #1a1f2b}
.lang-section .label{font-size:11px;color:#6b7684;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;margin-bottom:14px}
@media print {
  .toolbar{display:none}
  body{background:#fff;font-size:11pt}
  .page{box-shadow:none;margin:0;padding:24px;max-width:none;border-radius:0}
}
</style>
</head>
<body>

<div class="toolbar">
  <h1>Distance Sales Contract · #${orderRef}</h1>
  <button onclick="window.print()">🖨 Print / Save as PDF</button>
</div>

<div class="page">

  <div class="head">
    <div class="logo">
      <img src="https://hvpytasddzeprgqkwlbu.supabase.co/storage/v1/object/public/razno/kotor.png" alt="Kotor Walls" />
      <div>
        <div class="name">Kotor Walls</div>
        <div style="font-size:11px;color:#6b7684">UNESCO World Heritage Site</div>
      </div>
    </div>
    <div class="meta">
      <div class="ref">#${orderRef}</div>
      <div>${esc(created)}</div>
    </div>
  </div>

  <h1 class="title">Distance Sales Contract</h1>
  <div class="subtitle">Confirmation of contract concluded at a distance</div>

  <div class="legal-ref">
    <strong>Legal basis:</strong> This document constitutes a written confirmation of the distance sales contract concluded between the Seller and the Buyer, in accordance with <strong>Article 109 of the Consumer Protection Act of Montenegro</strong> (Official Gazette of Montenegro No. 12/2026). It contains all elements required by law and is provided to the Buyer on a durable medium (email).
  </div>

  <!-- 1. SELLER -->
  <section>
    <h2>1. Seller</h2>
    <div class="kv"><div class="k">Legal name</div><div class="v">Opština Kotor (Municipality of Kotor)</div></div>
    <div class="kv"><div class="k">Address</div><div class="v">Stari grad bb, 85330 Kotor, Montenegro</div></div>
    <div class="kv"><div class="k">Contact email</div><div class="v"><a href="mailto:support@kotorwalls.com" style="color:#b23a3a">support@kotorwalls.com</a></div></div>
    <div class="kv"><div class="k">Website</div><div class="v">kotorwalls.com</div></div>
  </section>

  <!-- 2. BUYER -->
  <section>
    <h2>2. Buyer</h2>
    <div class="kv"><div class="k">Name</div><div class="v">${esc(order.customer_name || "—")}</div></div>
    <div class="kv"><div class="k">Email</div><div class="v">${esc(order.customer_email || "—")}</div></div>
    ${order.customer_phone ? `<div class="kv"><div class="k">Phone</div><div class="v">${esc(order.customer_phone)}</div></div>` : ""}
    ${order.customer_country ? `<div class="kv"><div class="k">Country</div><div class="v">${esc(order.customer_country)}</div></div>` : ""}
  </section>

  <!-- 3. SUBJECT OF THE CONTRACT -->
  <section>
    <h2>3. Subject of the Contract</h2>
    <p style="margin:0 0 10px;font-size:13px;color:#4a5363">
      Sale of dated entrance tickets for the <strong>Kotor City Walls</strong> (UNESCO World Heritage Site, Stari grad Kotor, Montenegro). Each ticket grants single-entry access on the day of validity, redeemed by scanning the QR code at the automated entrance gate.
    </p>
    <table class="items">
      <thead>
        <tr><th>#</th><th>Description</th><th>Ticket ID (QR)</th><th style="text-align:right">Price</th></tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
    <div class="summary">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${fmtMoney(itemsTotal, cur)}</td></tr>
        <tr class="total"><td>Total paid (incl. VAT where applicable)</td><td style="text-align:right">${fmtMoney(total, cur)}</td></tr>
      </table>
    </div>
  </section>

  <!-- 4. PAYMENT -->
  <section>
    <h2>4. Price &amp; Payment</h2>
    <div class="kv"><div class="k">Total amount</div><div class="v"><strong>${fmtMoney(total, cur)}</strong></div></div>
    <div class="kv"><div class="k">Currency</div><div class="v">${esc(cur)}</div></div>
    <div class="kv"><div class="k">Payment method</div><div class="v">Online card payment (Stripe payment processing, PCI-DSS compliant)</div></div>
    <div class="kv"><div class="k">Payment status</div><div class="v">${esc(order.payment_status || "Confirmed")}</div></div>
    <div class="kv"><div class="k">Date of contract</div><div class="v">${esc(created)}</div></div>
    ${order.stripe_session_id ? `<div class="kv"><div class="k">Transaction reference</div><div class="v" style="font-family:ui-monospace,Menlo,monospace;font-size:11px">${esc(order.stripe_session_id)}</div></div>` : ""}
  </section>

  <!-- 5. RIGHT OF WITHDRAWAL -->
  <section>
    <h2>5. Right of Withdrawal — Important Notice</h2>
    <div class="notice">
      <strong>The 14-day right of withdrawal does NOT apply to this contract.</strong>
      In accordance with <strong>Article 119, paragraph 1, item 12 of the Consumer Protection Act of Montenegro</strong> (Off. Gazette No. 12/2026), the consumer's right to unilaterally withdraw from a distance contract within 14 days does not apply to leisure services provided on a specific date. Dated entrance tickets to a tourist attraction fall within this exemption and cannot be returned or exchanged at the buyer's initiative.
    </div>
    <p style="margin:10px 0 0;font-size:12px;color:#4a5363">Refunds are possible only in the following cases:</p>
    <ul style="margin:6px 0 0;padding-left:20px;font-size:12px;color:#4a5363">
      <li>Closure of the attraction by competent authorities</li>
      <li>Force majeure preventing access for more than 24 hours</li>
      <li>Technical fault on the Seller's side preventing valid ticket usage</li>
    </ul>
    <p style="margin:10px 0 0;font-size:12px;color:#4a5363">Refund requests are submitted to <a href="mailto:support@kotorwalls.com" style="color:#b23a3a">support@kotorwalls.com</a> with order reference <strong>#${orderRef}</strong>.</p>
  </section>

  <!-- 6. COMPLAINTS -->
  <section>
    <h2>6. Complaints &amp; Out-of-Court Dispute Resolution</h2>
    <p style="margin:0 0 8px;font-size:12px;color:#4a5363">
      <strong>Complaints (Art. 27–29 of the Consumer Protection Act):</strong> may be submitted in writing to <a href="mailto:support@kotorwalls.com" style="color:#b23a3a">support@kotorwalls.com</a>. The Seller will respond in writing within <strong>8 days</strong> of receipt. Complaints regarding the invoice may be submitted within 8 days from the date of payment.
    </p>
    <p style="margin:0;font-size:12px;color:#4a5363">
      <strong>Out-of-court dispute resolution:</strong> consumers have the right to refer disputes to the Board for Out-of-Court Resolution of Consumer Disputes at the <strong>Chamber of Commerce of Montenegro</strong> (Privredna komora Crne Gore).
    </p>
  </section>

  <!-- 7. APPLICABLE LAW -->
  <section>
    <h2>7. Applicable Law &amp; Jurisdiction</h2>
    <p style="margin:0;font-size:12px;color:#4a5363">
      This contract is governed by the laws of Montenegro. Any disputes that cannot be resolved amicably or through out-of-court resolution shall fall under the jurisdiction of the competent court in Kotor, Montenegro.
    </p>
  </section>

  <!-- 8. DURABLE MEDIUM -->
  <section>
    <h2>8. Provision on a Durable Medium</h2>
    <p style="margin:0;font-size:12px;color:#4a5363">
      A copy of this contract together with the QR tickets is delivered to the Buyer's email address (${esc(order.customer_email || "—")}) immediately after payment, in accordance with Art. 109 paragraph 2 of the Consumer Protection Act. The Buyer may save or print this document at any time.
    </p>
  </section>

  <div class="signature">
    <div class="box">
      <div style="margin-bottom:8px;font-weight:600;color:#1a1f2b">For the Seller</div>
      <div class="line"></div>
      <div>Opština Kotor</div>
      <div>Authorised representative</div>
    </div>
    <div class="box">
      <div style="margin-bottom:8px;font-weight:600;color:#1a1f2b">Buyer (electronic acceptance)</div>
      <div class="line"></div>
      <div>${esc(order.customer_name || "—")}</div>
      <div>Accepted at: ${esc(created)}</div>
    </div>
  </div>

  <div class="footer-note">
    Document automatically generated · #${orderRef} · ${new Date().toISOString().slice(0, 10)} · Reference legislation: Consumer Protection Act of Montenegro, Off. Gaz. No. 12/2026
  </div>

  <!-- ───── MONTENEGRIN VERSION (legal redundancy) ───── -->
  <div class="lang-section">
    <div class="label">Verzija na crnogorskom jeziku · Pravna redundansa</div>
    <h1 class="title" style="font-size:18px">Ugovor o prodaji na daljinu</h1>
    <p style="margin:0 0 16px;font-size:12px;color:#4a5363">
      Ovaj dokument predstavlja pisanu potvrdu ugovora o prodaji na daljinu zaključenog između prodavca i kupca, u skladu sa <strong>članom 109 Zakona o zaštiti potrošača Crne Gore</strong> (Sl. list CG br. 12/2026). Sadrži sve elemente propisane zakonom i dostavlja se kupcu na trajnom nosaču podataka (email).
    </p>
    <div class="kv"><div class="k">Prodavac</div><div class="v">Opština Kotor, Stari grad bb, 85330 Kotor, Crna Gora</div></div>
    <div class="kv"><div class="k">Kupac</div><div class="v">${esc(order.customer_name || "—")} · ${esc(order.customer_email || "—")}</div></div>
    <div class="kv"><div class="k">Predmet</div><div class="v">Ulaznice za Kotorske gradske zidine (${tickets.length} kom.)</div></div>
    <div class="kv"><div class="k">Ukupno plaćeno</div><div class="v"><strong>${fmtMoney(total, cur)}</strong></div></div>
    <div class="kv"><div class="k">Datum ugovora</div><div class="v">${esc(created)}</div></div>
    <div class="kv"><div class="k">Broj narudžbine</div><div class="v">#${orderRef}</div></div>
    <div class="notice" style="margin-top:14px">
      <strong>Pravo na raskid (čl. 119 st. 1 t. 12 ZZP CG 12/2026):</strong> Za karte vezane za određeni datum ulaska na turističku znamenitost <strong>ne važi</strong> 14-dnevno pravo jednostranog raskida ugovora. Karte se ne mogu vratiti ni zamijeniti na ličnu inicijativu, osim u slučaju zatvaranja lokacije ili više sile.
    </div>
    <p style="margin:14px 0 0;font-size:11px;color:#6b7684">
      Prigovor se podnosi na <a href="mailto:support@kotorwalls.com" style="color:#b23a3a">support@kotorwalls.com</a> u roku od 8 dana, a vansudsko rješavanje sporova vrši Odbor pri Privrednoj komori Crne Gore.
    </p>
  </div>

</div>

</body>
</html>`;
}
