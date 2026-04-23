// ═══════════════════════════════════════════════════════════════════════════
// admin-transactions — lista transakcija, refunda i dispute-ova za admin panel
// POST /admin-transactions  { limit?, offset?, status? }
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body   = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit  = Math.min(Number(body.limit ?? 100), 500);
    const offset = Number(body.offset ?? 0);
    const status = typeof body.status === "string" ? body.status : null;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let txq = supabase
      .from("kotorwalls_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) txq = txq.eq("status", status);
    const { data: txs, error: txErr } = await txq;
    if (txErr) throw txErr;

    const orderIds = Array.from(new Set((txs ?? []).map(t => t.order_id).filter(Boolean)));
    const txIds    = (txs ?? []).map(t => t.id);

    const [ordersRes, refundsRes, disputesRes] = await Promise.all([
      orderIds.length
        ? supabase.from("kotorwalls_orders")
            .select("id, customer_email, customer_name, customer_country, total, currency, payment_status, channel, refunded_at, created_at")
            .in("id", orderIds)
        : Promise.resolve({ data: [] }),
      txIds.length
        ? supabase.from("kotorwalls_refunds")
            .select("*")
            .in("transaction_id", txIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      txIds.length
        ? supabase.from("kotorwalls_chargebacks")
            .select("*")
            .in("transaction_id", txIds)
        : Promise.resolve({ data: [] }),
    ]);

    const ordersById  = new Map((ordersRes.data ?? []).map(o => [o.id, o]));
    const refundsByTx = new Map<string, any[]>();
    for (const r of refundsRes.data ?? []) {
      const arr = refundsByTx.get(r.transaction_id) ?? [];
      arr.push(r);
      refundsByTx.set(r.transaction_id, arr);
    }
    const disputesByTx = new Map<string, any[]>();
    for (const d of disputesRes.data ?? []) {
      const arr = disputesByTx.get(d.transaction_id) ?? [];
      arr.push(d);
      disputesByTx.set(d.transaction_id, arr);
    }

    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [succ24Res, refSumRes, failRes, cbOpenRes] = await Promise.all([
      supabase.from("kotorwalls_transactions").select("id", { count: "exact", head: true })
        .eq("status", "succeeded").gte("created_at", since24h),
      supabase.from("kotorwalls_refunds").select("amount"),
      supabase.from("kotorwalls_transactions").select("id", { count: "exact", head: true })
        .eq("status", "failed"),
      supabase.from("kotorwalls_chargebacks").select("id", { count: "exact", head: true })
        .in("status", ["warning_needs_response", "needs_response", "under_review"]),
    ]);

    const refundedTotal = (refSumRes.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);

    const enriched = (txs ?? []).map(t => ({
      ...t,
      order:     ordersById.get(t.order_id) ?? null,
      refunds:   refundsByTx.get(t.id) ?? [],
      disputes:  disputesByTx.get(t.id) ?? [],
    }));

    return json({
      transactions: enriched,
      refunds: refundsRes.data ?? [],
      stats: {
        succeeded_24h:  succ24Res.count ?? 0,
        refunded_total: Number(refundedTotal.toFixed(2)),
        refunded_count: (refundsRes.data ?? []).length,
        failed:         failRes.count ?? 0,
        chargebacks:    cbOpenRes.count ?? 0,
      },
    });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
