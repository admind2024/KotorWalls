// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: validate-ticket
// Tender 2.4 + 10.1 — poziv iz CM4 NANO edge servisa
// POST { qr_code: string, gate_code?: string, kiosk_id?: string }
//   qr_code = kompletan QR sadržaj ("KOTOR WALLS|TKT-XXXX|SIG")
// Vraća: { result: 'opened' | 'denied_invalid' | 'denied_used' | 'denied_forgery', ticket?: {...} }
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET  = Deno.env.get("HMAC_SECRET_KEY") ?? "ETK-9f38d1a2-cc49-4e3b-b182-7f94c2d9f6aa-2025";
const EVENT_ID     = "KOTOR WALLS";

async function hmacSig(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(HMAC_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 12);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return json({ error: "missing api key" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { qr_code, gate_code } = await req.json();
  if (!qr_code) return json({ error: "missing qr_code" }, 400);

  const { data: gate } = gate_code
    ? await supabase.from("kotorwalls_gates").select("id").eq("code", gate_code).maybeSingle()
    : { data: null };

  // Format: "KOTOR WALLS|TKT-XXXX|SIG"
  const parts = String(qr_code).split("|");
  let result: "opened" | "denied_invalid" | "denied_used" | "denied_forgery" = "denied_invalid";
  let reason = "";
  let ticketRow: any = null;

  if (parts.length !== 3) {
    reason = "invalid_format";
  } else {
    const [evt, ticketId, providedSig] = parts;
    if (evt !== EVENT_ID) {
      reason = "wrong_event";
    } else {
      const expected = await hmacSig(`${evt}|${ticketId}`);
      if (providedSig !== expected) {
        result = "denied_forgery";
        reason = "bad_signature";
      } else {
        const { data: t } = await supabase
          .from("kotorwalls_tickets")
          .select("id, status, category_name, valid_from, valid_until")
          .eq("qr_code", ticketId)
          .maybeSingle();
        ticketRow = t;
        if (!t) { reason = "not_found"; }
        else if (t.status === "used")  { result = "denied_used"; reason = "already_used"; }
        else if (t.status !== "valid") { reason = `status=${t.status}`; }
        else {
          result = "opened";
          await supabase
            .from("kotorwalls_tickets")
            .update({ status: "used", used_at: new Date().toISOString(), gate_id: gate?.id ?? null })
            .eq("id", t.id);
        }
      }
    }
  }

  await supabase.from("kotorwalls_gate_events").insert({
    gate_id:   gate?.id ?? null,
    ticket_id: ticketRow?.id ?? null,
    qr_raw:    qr_code,
    result,
    reason,
  });

  if (gate?.id) {
    await supabase.from("kotorwalls_gates").update({ last_signal_at: new Date().toISOString() }).eq("id", gate.id);
  }

  return json({
    result,
    reason,
    ticket: ticketRow ? { category: ticketRow.category_name } : null,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
