// ═══════════════════════════════════════════════════════════════════════════
// distance-contract — vraća JSON podatke za rendering Distance Sales Contract
// stranice u frontend-u (kotorwalls.com/ugovor-na-daljinu).
//
// Pravni osnov: MNE Consumer Protection Act 12/2026 čl. 109
// GET /distance-contract?order_id=<uuid>     → JSON
// GET /distance-contract?session_id=<stripe> → JSON, fallback preko stripe sess id
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
      return json({ error: "Missing order_id or session_id" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let q = supabase
      .from("kotorwalls_orders")
      .select("id, customer_name, customer_email, customer_phone, customer_country, subtotal, service_fee, total, currency, language, created_at, paid_at, stripe_session_id, payment_status, fiscal_status, fiscal_ikof");

    if (orderId)   q = q.eq("id", orderId);
    else           q = q.eq("stripe_session_id", sessionId);

    const { data: order, error: orderErr } = await q.maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) return json({ error: "Order not found" }, 404);

    const { data: tickets } = await supabase
      .from("kotorwalls_tickets")
      .select("id, qr_code, category_name, price")
      .eq("order_id", order.id)
      .order("issued_at", { ascending: true });

    return json({
      order,
      tickets: tickets ?? [],
      seller: {
        name:    "Opština Kotor (Municipality of Kotor)",
        address: "Stari grad bb, 85330 Kotor, Montenegro",
        email:   "support@kotorwalls.com",
        website: "kotorwalls.com",
      },
      legal: {
        act:        "Consumer Protection Act of Montenegro",
        gazette:    "Official Gazette of Montenegro No. 12/2026",
        article109: "Article 109",
        article119: "Article 119, paragraph 1, item 12",
      },
    });
  } catch (e) {
    console.error("distance-contract:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
