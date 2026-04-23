// ═══════════════════════════════════════════════════════════════════════════
// admin-retention — upravljanje retention politikom + pokretanje čišćenja
// Akcije:
//   get                      → trenutne vrijednosti + preview koliko će se obrisati
//   save   { audit_noncritical_days, webhook_deliveries_days }
//   run                      → izvrši čišćenje odmah (vraća broj obrisanih)
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
    const action = (body.action ?? "get") as string;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "get") {
      const { data: s } = await supabase
        .from("kotorwalls_retention_settings")
        .select("*")
        .eq("id", "default")
        .single();

      const auditDays   = s?.audit_noncritical_days ?? 30;
      const webhookDays = s?.webhook_deliveries_days ?? 14;
      const sinceAudit   = new Date(Date.now() - auditDays   * 86400_000).toISOString();
      const sinceWebhook = new Date(Date.now() - webhookDays * 86400_000).toISOString();

      // preview: koliko bi se sada obrisalo
      const [{ count: auditAll }, { count: webhookOld }] = await Promise.all([
        supabase.from("kotorwalls_audit_log")
          .select("id", { count: "exact", head: true })
          .lt("created_at", sinceAudit),
        supabase.from("kotorwalls_webhook_deliveries")
          .select("id", { count: "exact", head: true })
          .lt("created_at", sinceWebhook),
      ]);
      // oduzmi kritične iz audit preview-a
      const { count: criticalOld } = await supabase
        .from("kotorwalls_audit_log")
        .select("id", { count: "exact", head: true })
        .lt("created_at", sinceAudit)
        .or("action.like.payment.%,action.like.refund.%,action.like.charge.dispute.%,actor_type.eq.admin,action.eq.email.ticket_failed");

      return json({
        settings: s,
        preview: {
          audit_would_delete:   Math.max(0, (auditAll ?? 0) - (criticalOld ?? 0)),
          audit_preserved_critical: criticalOld ?? 0,
          webhook_would_delete: webhookOld ?? 0,
        },
      });
    }

    if (action === "save") {
      const a = Math.max(7,  Math.min(365 * 10, Number(body.audit_noncritical_days   ?? 30)));
      const w = Math.max(3,  Math.min(180,      Number(body.webhook_deliveries_days ?? 14)));
      const { data, error } = await supabase
        .from("kotorwalls_retention_settings")
        .update({
          audit_noncritical_days:  a,
          webhook_deliveries_days: w,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "default")
        .select()
        .single();
      if (error) throw error;

      await supabase.from("kotorwalls_audit_log").insert({
        actor_type: "admin", action: "retention.updated",
        entity: "retention", entity_id: null,
        metadata: { audit_noncritical_days: a, webhook_deliveries_days: w },
      });

      return json({ ok: true, settings: data });
    }

    if (action === "run") {
      const { data, error } = await supabase.rpc("kotorwalls_cleanup_logs");
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;

      await supabase.from("kotorwalls_audit_log").insert({
        actor_type: "admin", action: "retention.cleanup_run",
        entity: "retention", entity_id: null,
        metadata: result ?? {},
      });

      return json({ ok: true, deleted: result });
    }

    return json({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("admin-retention:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
