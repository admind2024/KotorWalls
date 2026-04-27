// ═══════════════════════════════════════════════════════════════════════════
// admin-webhooks — pregled webhook endpointa + delivery log-a za admin panel
// POST /admin-webhooks  { limit? }
// Vraća { endpoints: [...], deliveries: [...] }
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
    const body  = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit = Math.min(Number(body.limit ?? 50), 200);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const [{ data: endpoints, error: eErr }, { data: deliveries, error: dErr }] = await Promise.all([
      supabase
        .from("kotorwalls_webhooks")
        .select("id, url, events, status, last_delivery_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("kotorwalls_webhook_deliveries")
        .select("id, webhook_id, event_type, response_code, response_ms, success, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    if (eErr) throw eErr;
    if (dErr) throw dErr;

    return json({
      endpoints:  endpoints  ?? [],
      deliveries: deliveries ?? [],
    });
  } catch (e) {
    console.error("admin-webhooks:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
