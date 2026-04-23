// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: view-tickets
// Vraća karte i podatke narudžbine za prikaz na kotorwalls.com/karte
// GET /view-tickets?session_id=cs_...   (iz Stripe success URL-a)
// GET /view-tickets?ticket_id=TKT-...   (fallback po ticketId)
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const directOrder = url.searchParams.get("order_id");
    const sessionId   = url.searchParams.get("session_id");
    const piId        = url.searchParams.get("payment_intent_id");
    const ticketId    = url.searchParams.get("ticket_id");

    if (!directOrder && !sessionId && !piId && !ticketId) {
      return json({ error: "missing order_id / session_id / payment_intent_id / ticket_id" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let orderId: string | null = directOrder;
    if (!orderId && sessionId) {
      const { data: o } = await supabase.from("kotorwalls_orders").select("id").eq("stripe_session_id", sessionId).maybeSingle();
      orderId = o?.id ?? null;
    }
    if (!orderId && piId) {
      const { data: o } = await supabase.from("kotorwalls_orders").select("id").eq("stripe_payment_intent_id", piId).maybeSingle();
      orderId = o?.id ?? null;
    }
    if (!orderId && ticketId) {
      const { data: t } = await supabase.from("kotorwalls_tickets").select("order_id").eq("qr_code", ticketId).maybeSingle();
      orderId = t?.order_id ?? null;
    }

    if (!orderId) return json({ error: "order not found" }, 404);

    const { data: order } = await supabase
      .from("kotorwalls_orders")
      .select("id, customer_email, customer_name, total, currency, language, paid_at, payment_status, created_at")
      .eq("id", orderId)
      .single();

    const { data: tickets } = await supabase
      .from("kotorwalls_tickets")
      .select("id, qr_code, qr_payload, qr_image_url, category_name, category_code, price, status, issued_at, used_at, language")
      .eq("order_id", orderId)
      .order("issued_at", { ascending: true });

    return json({
      order,
      tickets: tickets ?? [],
      venue:   "Kotor City Walls — UNESCO World Heritage",
      event:   "KOTOR WALLS",
    });
  } catch (e) {
    console.error(e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
