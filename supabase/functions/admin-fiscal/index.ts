// ═══════════════════════════════════════════════════════════════════════════
// admin-fiscal — pregled fiskalizacije po kanalu prodaje + retry
// POST /admin-fiscal { action?: "get"|"retry", range?, order_id? }
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
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action: string = body.action ?? "get";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "retry") {
      if (!body.order_id) return json({ error: "missing order_id" }, 400);
      const r = await fetch(`${SUPABASE_URL}/functions/v1/fiscalize-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${SERVICE_ROLE}`,
          apikey:         SERVICE_ROLE,
        },
        body: JSON.stringify({ order_id: body.order_id }),
      });
      const out = await r.json();
      return json(out, r.status);
    }

    // ─── GET: summary, by_channel, recent, config ────────────────────────────
    const { from, to } = resolveRange(body);

    const [cfgRes, invRes, ordersRes] = await Promise.all([
      supabase.from("kotorwalls_fiscal_config")
        .select("enabled, is_production, default_vat_rate, seller_tin, seller_name, tcr_code, business_unit_code, software_code, operator_code")
        .eq("id", 1).maybeSingle(),
      supabase.from("kotorwalls_fiscal_invoices")
        .select("id, order_id, ikof, jikr, qr_url, invoice_ord_num, status, error, issued_at, created_at, tcr_code")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false }),
      supabase.from("kotorwalls_orders")
        .select("id, channel, total, currency, payment_status, fiscal_status, created_at")
        .gte("created_at", from)
        .lte("created_at", to),
    ]);

    const cfg     = cfgRes.data ?? null;
    const invs    = invRes.data ?? [];
    const orders  = ordersRes.data ?? [];

    // mapa orderId → order (za channel + total)
    const orderMap = new Map<string, any>();
    for (const o of orders) orderMap.set(o.id, o);

    // Summary
    const succeeded = invs.filter(i => i.status === "succeeded");
    const failed    = invs.filter(i => i.status === "failed");
    const totalAmount = succeeded.reduce((s, i) => s + num(orderMap.get(i.order_id)?.total), 0);
    const lastIIC = succeeded[0]?.ikof ?? null;

    // by_channel — uključi i paid orders bez fiscal zapisa (pending)
    const channels = new Map<string, { channel: string; succeeded: number; failed: number; pending: number; amount: number }>();
    const ensure = (ch: string) => {
      if (!channels.has(ch)) channels.set(ch, { channel: ch, succeeded: 0, failed: 0, pending: 0, amount: 0 });
      return channels.get(ch)!;
    };

    for (const i of invs) {
      const ord = orderMap.get(i.order_id);
      const ch = ord?.channel ?? "unknown";
      const row = ensure(ch);
      if (i.status === "succeeded") {
        row.succeeded += 1;
        row.amount += num(ord?.total);
      } else if (i.status === "failed") {
        row.failed += 1;
      }
    }

    // pending = paid orders sa fiscal_status='pending' i bez fiscal record-a
    for (const o of orders) {
      if (o.payment_status !== "paid") continue;
      if (o.fiscal_status === "fiscalized" || o.fiscal_status === "failed") continue;
      const row = ensure(o.channel ?? "unknown");
      row.pending += 1;
    }

    const by_channel = Array.from(channels.values())
      .sort((a, b) => (b.succeeded + b.failed + b.pending) - (a.succeeded + a.failed + a.pending))
      .map(r => ({ ...r, amount: round2(r.amount) }));

    // recent (zadnjih 50, sa channel iz orders)
    const recent = invs.slice(0, 50).map(i => {
      const ord = orderMap.get(i.order_id);
      return {
        id: i.id,
        order_id: i.order_id,
        channel: ord?.channel ?? null,
        total: num(ord?.total),
        currency: ord?.currency ?? "EUR",
        status: i.status,
        error: i.error,
        ikof: i.ikof,
        jikr: i.jikr,
        qr_url: i.qr_url,
        invoice_ord_num: i.invoice_ord_num,
        tcr_code: i.tcr_code,
        issued_at: i.issued_at,
        created_at: i.created_at,
      };
    });

    return json({
      summary: {
        config_enabled: !!cfg?.enabled,
        is_production:  !!cfg?.is_production,
        succeeded_count: succeeded.length,
        failed_count:    failed.length,
        pending_count:   by_channel.reduce((s, c) => s + c.pending, 0),
        total_amount:    round2(totalAmount),
        last_iic:        lastIIC,
      },
      config: cfg,
      by_channel,
      recent,
      range: { from, to },
    });

  } catch (e) {
    console.error("admin-fiscal:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function resolveRange(b: { range?: string; from?: string; to?: string }) {
  if (b.from && b.to) return { from: b.from, to: b.to };
  const to   = new Date();
  const from = new Date(to);
  switch (b.range) {
    case "7d":  from.setDate(to.getDate() - 7); break;
    case "30d": from.setDate(to.getDate() - 30); break;
    case "12m": from.setMonth(to.getMonth() - 12); break;
    case "ytd": from.setMonth(0); from.setDate(1); from.setHours(0,0,0,0); break;
    case "all": from.setFullYear(2020, 0, 1); break;
    default:    from.setDate(to.getDate() - 30);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function num(x: unknown): number { return Number(x ?? 0) || 0; }
function round2(x: number): number { return Math.round(x * 100) / 100; }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
