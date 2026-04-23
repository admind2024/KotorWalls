// ═══════════════════════════════════════════════════════════════════════════
// admin-reports — agregirani KPI i serije iz kotorwalls_* tabela
// POST /admin-reports  { range?: "7d"|"30d"|"12m"|"ytd"|"all", from?, to? }
// Vraća: summary, revenue_by_day, sales_by_category, sales_by_channel,
//        sales_by_language, sales_by_country, refunds_by_day, hourly_today
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
    const { from, to } = resolveRange(body);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const [ordersRes, ticketsRes, txRes, refundsRes] = await Promise.all([
      supabase.from("kotorwalls_orders")
        .select("id, total, currency, channel, language, customer_country, payment_status, created_at, paid_at, refunded_at")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: true }),
      supabase.from("kotorwalls_tickets")
        .select("id, order_id, category_code, category_name, price, status, issued_at")
        .gte("issued_at", from)
        .lte("issued_at", to),
      supabase.from("kotorwalls_transactions")
        .select("id, order_id, amount, currency, status, created_at")
        .gte("created_at", from)
        .lte("created_at", to),
      supabase.from("kotorwalls_refunds")
        .select("id, amount, currency, status, created_at")
        .gte("created_at", from)
        .lte("created_at", to),
    ]);

    const orders  = ordersRes.data ?? [];
    const tickets = ticketsRes.data ?? [];
    const txs     = txRes.data ?? [];
    const refunds = refundsRes.data ?? [];

    const paid = orders.filter(o => o.payment_status === "paid" || o.payment_status === "partially_refunded");
    const refunded = orders.filter(o => o.payment_status === "refunded" || o.payment_status === "partially_refunded");

    const revenueGross  = paid.reduce((s, o) => s + num(o.total), 0);
    const refundsTotal  = refunds.filter(r => r.status !== "failed" && r.status !== "canceled")
                                  .reduce((s, r) => s + num(r.amount), 0);
    const revenueNet    = revenueGross - refundsTotal;

    const ordersCount   = paid.length;
    const ticketsCount  = tickets.filter(t => t.status !== "refunded" && t.status !== "pending").length;
    const avgOrderValue = ordersCount > 0 ? revenueGross / ordersCount : 0;

    // serije
    const revenueByDay     = groupByDay(paid, o => o.paid_at ?? o.created_at, o => num(o.total));
    const refundsByDay     = groupByDay(refunds.filter(r => r.status !== "failed" && r.status !== "canceled"),
                                         r => r.created_at, r => num(r.amount));
    const salesByCategory  = groupBy(tickets.filter(t => t.status !== "refunded"),
                                      t => t.category_name ?? t.category_code ?? "unknown",
                                      t => num(t.price));
    const salesByChannel   = groupBy(paid, o => o.channel ?? "web",             o => num(o.total));
    const salesByLanguage  = groupBy(paid, o => (o.language ?? "—").toLowerCase(), o => num(o.total));
    const salesByCountry   = groupBy(paid, o => (o.customer_country ?? "—").toUpperCase(), o => num(o.total));

    // satni raspored današnjeg dana
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const todayOrders = paid.filter(o => new Date(o.paid_at ?? o.created_at) >= dayStart);
    const hourlyToday = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      orders: todayOrders.filter(o => new Date(o.paid_at ?? o.created_at).getHours() === h).length,
      revenue: todayOrders
        .filter(o => new Date(o.paid_at ?? o.created_at).getHours() === h)
        .reduce((s, o) => s + num(o.total), 0),
    }));

    // transakcije: success rate
    const txSucceeded = txs.filter(t => t.status === "succeeded").length;
    const txFailed    = txs.filter(t => t.status === "failed").length;
    const txTotal     = txs.length;

    return json({
      range: { from, to },
      summary: {
        orders_count:      ordersCount,
        tickets_count:     ticketsCount,
        revenue_gross:     round2(revenueGross),
        revenue_net:       round2(revenueNet),
        refunds_total:     round2(refundsTotal),
        refunds_count:     refunds.length,
        avg_order_value:   round2(avgOrderValue),
        currency:          orders[0]?.currency ?? "EUR",
        tx_success_rate:   txTotal > 0 ? Math.round((txSucceeded / txTotal) * 100) : 0,
        tx_failed:         txFailed,
        refund_rate_pct:   ordersCount > 0 ? round2((refunded.length / ordersCount) * 100) : 0,
      },
      revenue_by_day:   revenueByDay,
      refunds_by_day:   refundsByDay,
      sales_by_category: salesByCategory,
      sales_by_channel:  salesByChannel,
      sales_by_language: salesByLanguage,
      sales_by_country:  salesByCountry,
      hourly_today:      hourlyToday,
    });
  } catch (e) {
    console.error("admin-reports:", e);
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

function groupByDay<T>(arr: T[], dateOf: (x: T) => string, valueOf: (x: T) => number) {
  const map = new Map<string, { count: number; sum: number }>();
  for (const x of arr) {
    const d = new Date(dateOf(x));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const v = map.get(key) ?? { count: 0, sum: 0 };
    v.count += 1; v.sum += valueOf(x); map.set(key, v);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a < b ? -1 : 1)
    .map(([date, v]) => ({ date, count: v.count, sum: round2(v.sum) }));
}

function groupBy<T>(arr: T[], keyOf: (x: T) => string, valueOf: (x: T) => number) {
  const map = new Map<string, { count: number; sum: number }>();
  for (const x of arr) {
    const key = keyOf(x);
    const v = map.get(key) ?? { count: 0, sum: 0 };
    v.count += 1; v.sum += valueOf(x); map.set(key, v);
  }
  return [...map.entries()]
    .sort(([, a], [, b]) => b.sum - a.sum)
    .map(([key, v]) => ({ key, count: v.count, sum: round2(v.sum) }));
}

function num(x: unknown): number { return Number(x ?? 0) || 0; }
function round2(x: number): number { return Math.round(x * 100) / 100; }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
