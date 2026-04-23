// ═══════════════════════════════════════════════════════════════════════════
// admin-audit — pregled audit log-a za admin panel (service role, filtri)
// POST /admin-audit  { limit?, offset?, action?, entity?, actor_type?, since? }
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
    const limit  = Math.min(Number(body.limit ?? 100), 500);
    const offset = Number(body.offset ?? 0);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    let q = supabase
      .from("kotorwalls_audit_log")
      .select("id, actor_id, actor_type, action, entity, entity_id, metadata, ip, user_agent, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (body.action)     q = q.eq("action",     body.action);
    if (body.entity)     q = q.eq("entity",     body.entity);
    if (body.actor_type) q = q.eq("actor_type", body.actor_type);
    if (body.since)      q = q.gte("created_at", body.since);
    if (body.search) {
      // zadnji resort — filter po action ili entity_id contains (best-effort)
      q = q.or(`action.ilike.%${body.search}%,entity.ilike.%${body.search}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;

    // distinct action-i i entity-ji za filter opcije
    const { data: distinctActions } = await supabase
      .from("kotorwalls_audit_log").select("action").limit(500);
    const actions = Array.from(new Set((distinctActions ?? []).map(r => r.action))).sort();

    return json({ rows: data ?? [], total: count ?? 0, actions });
  } catch (e) {
    console.error("admin-audit:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
