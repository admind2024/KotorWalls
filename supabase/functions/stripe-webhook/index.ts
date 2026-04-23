// ═══════════════════════════════════════════════════════════════════════════
// stripe-webhook — PaymentIntent flow (custom forma, manual capture)
// Događaji: payment_intent.amount_capturable_updated, payment_intent.succeeded,
//           charge.refunded, charge.dispute.*
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const STRIPE_KEY_LIVE  = Deno.env.get("STRIPE_SECRET_KEY_KOTOR") ?? "";
const STRIPE_KEY_TEST  = Deno.env.get("STRIPE_SECRET_KEY_KOTOR_TEST") ?? "";
const WEBHOOK_LIVE     = Deno.env.get("KotorWalls_WEBHOOK") ?? "";
const WEBHOOK_TEST     = Deno.env.get("KotorWalls_WEBHOOK_TEST") ?? "";
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET      = Deno.env.get("HMAC_SECRET_KEY") ?? "ETK-9f38d1a2-cc49-4e3b-b182-7f94c2d9f6aa-2025";
const EVENT_ID         = "KOTOR WALLS";

const stripeLive = STRIPE_KEY_LIVE ? new Stripe(STRIPE_KEY_LIVE, { apiVersion: "2025-03-31.basil", httpClient: Stripe.createFetchHttpClient() }) : null;
const stripeTest = STRIPE_KEY_TEST ? new Stripe(STRIPE_KEY_TEST, { apiVersion: "2025-03-31.basil", httpClient: Stripe.createFetchHttpClient() }) : null;
const supabase   = createClient(SUPABASE_URL, SERVICE_ROLE);

// Stripe instance za API pozive (capture) — bira se po event.livemode
function stripeFor(event: Stripe.Event): Stripe {
  const s = event.livemode ? stripeLive : stripeTest;
  if (!s) throw new Error(`No Stripe key configured for ${event.livemode ? "live" : "test"} mode`);
  return s;
}

async function hmacSig(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(HMAC_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 12);
}

function makeTicketId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rnd = "";
  for (let i = 0; i < 6; i++) rnd += chars[Math.floor(Math.random() * chars.length)];
  return `TKT-${ymd}-${rnd}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event | null = null;
  const errors: string[] = [];
  // pokušaj live secret, pa test secret (isti URL za oba moda)
  for (const [label, secret, s] of [
    ["live", WEBHOOK_LIVE, stripeLive] as const,
    ["test", WEBHOOK_TEST, stripeTest] as const,
  ]) {
    if (!secret || !s) continue;
    try {
      event = await s.webhooks.constructEventAsync(body, sig, secret);
      break;
    } catch (e) {
      errors.push(`${label}: ${e}`);
    }
  }
  if (!event) {
    console.error("bad signature:", errors.join(" | "));
    return new Response(`bad signature`, { status: 400 });
  }

  const stripe = stripeFor(event);

  try {
    switch (event.type) {
      case "payment_intent.amount_capturable_updated":
        await onAuthorized(stripe, event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.succeeded":
        await onSucceeded(stripe, event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await onChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
      case "charge.dispute.updated":
      case "charge.dispute.closed":
        await onDispute(event.data.object as Stripe.Dispute, event.type);
        break;
      default:
        console.log("unhandled:", event.type);
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(`error: ${e}`, { status: 500 });
  }
});

// ─── Autorizovano (manual capture) → capture ────────────────────────────────
async function onAuthorized(stripe: Stripe, pi: Stripe.PaymentIntent) {
  if (pi.status !== "requires_capture") return;

  console.log("auto-capture PI:", pi.id, "amount:", pi.amount, "livemode:", pi.livemode);
  try {
    await stripe.paymentIntents.capture(pi.id);
  } catch (e) {
    console.error("capture failed:", e);
    await supabase.from("kotorwalls_audit_log").insert({
      actor_type: "system", action: "payment.capture_failed",
      entity: "order", entity_id: pi.metadata?.order_id ?? null,
      metadata: { pi_id: pi.id, error: String(e) },
    });
  }
}

// ─── Plaćanje uspjelo → finalizacija, QR, tikete, transakcija ──────────────
async function onSucceeded(stripe: Stripe, pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.order_id;
  if (!orderId) { console.warn("missing order_id in metadata", pi.id); return; }

  // povuci charge i payment method details
  const full = await stripe.paymentIntents.retrieve(pi.id, { expand: ["latest_charge.payment_method_details"] });
  const charge = full.latest_charge as Stripe.Charge | undefined;
  const pmd    = charge?.payment_method_details;
  const card   = pmd?.card as any;
  const billing = charge?.billing_details;

  // update order
  await supabase
    .from("kotorwalls_orders")
    .update({
      payment_status: "paid",
      customer_email:   pi.receipt_email ?? billing?.email ?? pi.metadata?.customer_email ?? null,
      customer_name:    billing?.name    ?? pi.metadata?.customer_name  ?? null,
      customer_phone:   billing?.phone   ?? pi.metadata?.customer_phone ?? null,
      customer_country: billing?.address?.country ?? pi.metadata?.customer_country ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // transakcija sa PUNIM bank detaljima
  await supabase.from("kotorwalls_transactions").insert({
    order_id:         orderId,
    stripe_pi_id:     pi.id,
    stripe_charge_id: charge?.id,
    amount:           pi.amount / 100,
    currency:         pi.currency.toUpperCase(),
    method:           pmd?.type ?? "card",
    brand:            card?.brand ?? null,
    bin:              card?.iin ?? null,
    last4:            card?.last4 ?? null,
    issuer:           card?.issuer ?? null,
    country:          card?.country ?? null,
    funding:          card?.funding ?? null,
    network:          card?.network ?? null,
    fingerprint:      card?.fingerprint ?? null,
    three_d_secure:   card?.three_d_secure?.result ?? null,
    exp_month:        card?.exp_month ?? null,
    exp_year:         card?.exp_year ?? null,
    card_wallet:      card?.wallet?.type ?? null,
    raw_details:      pmd ?? null,
    status:           "succeeded",
    risk_score:       charge?.outcome?.risk_score ?? null,
    risk_level:       charge?.outcome?.risk_level ?? null,
  });

  // generiši HMAC QR za svaku pending kartu
  const { data: tickets } = await supabase
    .from("kotorwalls_tickets")
    .select("id")
    .eq("order_id", orderId)
    .eq("status", "pending");

  for (const t of tickets ?? []) {
    const ticketId = makeTicketId();
    const payload  = `${EVENT_ID}|${ticketId}`;
    const sig      = await hmacSig(payload);
    const qrRaw    = `${payload}|${sig}`;
    const qrUrl    = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrRaw)}`;

    await supabase
      .from("kotorwalls_tickets")
      .update({ status: "valid", qr_code: ticketId, qr_payload: qrRaw, qr_image_url: qrUrl })
      .eq("id", t.id);
  }

  await supabase.from("kotorwalls_audit_log").insert({
    actor_type: "system", action: "payment.succeeded",
    entity: "order", entity_id: orderId,
    metadata: {
      pi_id: pi.id,
      amount: pi.amount / 100,
      bin: card?.iin ?? null,
      brand: card?.brand ?? null,
      issuer: card?.issuer ?? null,
      country: card?.country ?? null,
    },
  });

  // Pošalji email sa QR kartama — ne blokira webhook ako padne
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/send-ticket-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${SERVICE_ROLE}`,
        apikey:         SERVICE_ROLE,
      },
      body: JSON.stringify({ order_id: orderId, reason: "purchase" }),
    });
    if (!r.ok) console.error("email send failed:", r.status, await r.text());
  } catch (e) {
    console.error("email send exception:", e);
    await supabase.from("kotorwalls_audit_log").insert({
      actor_type: "system", action: "email.ticket_failed",
      entity: "order", entity_id: orderId,
      metadata: { error: String(e) },
    });
  }

  // TODO: fiskalni račun (CG ENU)
}

async function onChargeRefunded(charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;

  const { data: order } = await supabase
    .from("kotorwalls_orders")
    .select("id, total")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();
  if (!order) return;

  const amount = (charge.amount_refunded ?? 0) / 100;
  const full = amount >= Number(order.total) - 0.01;

  await supabase.from("kotorwalls_refunds").insert({
    order_id: order.id,
    stripe_refund_id: charge.refunds?.data?.[0]?.id,
    amount,
    currency: (charge.currency ?? "eur").toUpperCase(),
    status: "succeeded",
    reason: charge.refunds?.data?.[0]?.reason ?? null,
  });

  await supabase
    .from("kotorwalls_orders")
    .update({
      payment_status: full ? "refunded" : "paid",
      refunded_at:    new Date().toISOString(),
    })
    .eq("id", order.id);

  if (full) {
    await supabase.from("kotorwalls_tickets").update({ status: "refunded" }).eq("order_id", order.id);
  }

  await supabase.from("kotorwalls_audit_log").insert({
    actor_type: "system", action: "refund.received",
    entity: "order", entity_id: order.id,
    metadata: { amount, full },
  });
}

async function onDispute(dispute: Stripe.Dispute, type: string) {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  const { data: tx } = await supabase
    .from("kotorwalls_transactions")
    .select("id, order_id")
    .eq("stripe_charge_id", chargeId)
    .maybeSingle();

  await supabase.from("kotorwalls_chargebacks").upsert({
    transaction_id:    tx?.id,
    stripe_dispute_id: dispute.id,
    amount:            (dispute.amount ?? 0) / 100,
    currency:          (dispute.currency ?? "eur").toUpperCase(),
    reason:            dispute.reason,
    status:            dispute.status,
    evidence_due_at:   dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
      : null,
    resolved_at:       (dispute.status === "won" || dispute.status === "lost")
      ? new Date().toISOString() : null,
  }, { onConflict: "stripe_dispute_id" });

  await supabase.from("kotorwalls_audit_log").insert({
    actor_type: "system", action: type,
    entity: "order", entity_id: tx?.order_id ?? null,
    metadata: { dispute_id: dispute.id, reason: dispute.reason, status: dispute.status },
  });
}
