// ═══════════════════════════════════════════════════════════════════════════
// admin-refund — inicira refund na Stripe-u, upisuje u kotorwalls_refunds i
// ažurira status order-a. Webhook (charge.refunded) će posle potvrditi stanje.
// POST /admin-refund  { transaction_id, amount?, reason?, note? }
//   amount: u glavnoj valuti (EUR), prazno = pun iznos
//   reason: "duplicate" | "fraudulent" | "requested_by_customer" | custom text
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const STRIPE_KEY   = Deno.env.get("STRIPE_SECRET_KEY_KOTOR")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe   = new Stripe(STRIPE_KEY, { apiVersion: "2025-03-31.basil", httpClient: Stripe.createFetchHttpClient() });
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STRIPE_REASONS = new Set(["duplicate", "fraudulent", "requested_by_customer"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "method not allowed" }, 405);

  try {
    const { transaction_id, amount, reason, note } = await req.json();
    if (!transaction_id) return json({ error: "transaction_id required" }, 400);

    const { data: tx, error: txErr } = await supabase
      .from("kotorwalls_transactions")
      .select("id, order_id, stripe_pi_id, stripe_charge_id, amount, currency, status")
      .eq("id", transaction_id)
      .single();
    if (txErr || !tx) return json({ error: "transaction not found" }, 404);
    if (!tx.stripe_pi_id) return json({ error: "transaction has no stripe payment intent" }, 400);

    const txAmount = Number(tx.amount);
    const alreadyRefunded = await sumRefunds(tx.id);
    const available = Math.max(0, Number((txAmount - alreadyRefunded).toFixed(2)));
    const reqAmount = amount == null || amount === "" ? available : Number(amount);
    if (!(reqAmount > 0)) return json({ error: "invalid amount" }, 400);
    if (reqAmount > available + 0.001) {
      return json({ error: `max refundable: ${available.toFixed(2)} ${tx.currency}` }, 400);
    }

    const stripeReason = STRIPE_REASONS.has(reason) ? reason : undefined;
    const customReason = stripeReason ? (note ?? null) : (reason ?? note ?? null);

    const refund = await stripe.refunds.create({
      payment_intent: tx.stripe_pi_id,
      amount:         Math.round(reqAmount * 100),
      ...(stripeReason ? { reason: stripeReason } : {}),
      metadata: {
        order_id:       tx.order_id ?? "",
        transaction_id: tx.id,
        custom_reason:  customReason ?? "",
        source:         "admin_panel",
      },
    });

    // upis odmah (webhook je idempotentan preko unique stripe_refund_id)
    const { error: insErr } = await supabase.from("kotorwalls_refunds").upsert({
      transaction_id:   tx.id,
      order_id:         tx.order_id,
      stripe_refund_id: refund.id,
      amount:           (refund.amount ?? 0) / 100,
      currency:         (refund.currency ?? "eur").toUpperCase(),
      reason:           stripeReason ?? customReason ?? null,
      status:           refund.status ?? "pending",
    }, { onConflict: "stripe_refund_id" });
    if (insErr) console.error("refund insert:", insErr);

    // update order status
    const newRefundedTotal = alreadyRefunded + reqAmount;
    const fullRefund = newRefundedTotal >= txAmount - 0.01;
    if (tx.order_id) {
      await supabase
        .from("kotorwalls_orders")
        .update({
          payment_status: fullRefund ? "refunded" : "partially_refunded",
          refunded_at:    new Date().toISOString(),
        })
        .eq("id", tx.order_id);

      if (fullRefund) {
        await supabase.from("kotorwalls_tickets")
          .update({ status: "refunded" })
          .eq("order_id", tx.order_id);
      }
    }

    await supabase.from("kotorwalls_audit_log").insert({
      actor_type: "admin", action: "refund.created",
      entity: "transaction", entity_id: tx.id,
      metadata: {
        refund_id: refund.id,
        amount:    (refund.amount ?? 0) / 100,
        reason:    stripeReason ?? null,
        note:      customReason,
        full:      fullRefund,
      },
    });

    return json({
      ok: true,
      refund: {
        id:       refund.id,
        amount:   (refund.amount ?? 0) / 100,
        currency: (refund.currency ?? "eur").toUpperCase(),
        status:   refund.status,
        reason:   stripeReason ?? customReason ?? null,
      },
      full: fullRefund,
    });
  } catch (e) {
    console.error("admin-refund:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

async function sumRefunds(transactionId: string): Promise<number> {
  const { data } = await supabase
    .from("kotorwalls_refunds")
    .select("amount, status")
    .eq("transaction_id", transactionId);
  return (data ?? [])
    .filter(r => r.status !== "failed" && r.status !== "canceled")
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
