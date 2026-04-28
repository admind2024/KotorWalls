// ═══════════════════════════════════════════════════════════════════════════
// admin-state — perzistentne admin preference (singleton, id=1)
// Trenutno: stripe_mode (live | test). Razlog: admin se loguje sa različitih
// PC-eva i preferenca treba da prati nalog, ne lokalni browser.
//
// POST /admin-state  { action: "get" }                       → { stripe_mode }
// POST /admin-state  { action: "set", stripe_mode: "test" }  → { stripe_mode }
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
  if (req.method !== "POST")    return json({ error: "method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "get";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "set") {
      const mode = body.stripe_mode === "test" ? "test" : "live";
      const { data, error } = await supabase
        .from("kotorwalls_admin_state")
        .upsert({ id: 1, stripe_mode: mode, updated_at: new Date().toISOString() }, { onConflict: "id" })
        .select("stripe_mode")
        .single();
      if (error) return json({ error: error.message }, 500);

      await supabase.from("kotorwalls_audit_log").insert({
        actor_type: "admin",
        action: "admin_state.stripe_mode_changed",
        entity: "admin_state", entity_id: null,
        metadata: { stripe_mode: mode },
      });

      return json({ stripe_mode: data?.stripe_mode ?? mode });
    }

    // GET (default)
    const { data, error } = await supabase
      .from("kotorwalls_admin_state")
      .select("stripe_mode")
      .eq("id", 1)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);

    return json({ stripe_mode: data?.stripe_mode ?? "live" });
  } catch (e) {
    console.error("admin-state:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
