// ═══════════════════════════════════════════════════════════════════════════
// fiscalize-order — fiskalizacija porudžbine prema CG EFI/CIS sistemu
//
// Poziva eksterni `fiscalize` Supabase Edge Function (TECONIA multi-tenant
// servis) i snima rezultat u kotorwalls_fiscal_invoices + ažurira
// kotorwalls_orders.fiscal_status / fiscal_ikof / fiscal_jikr.
//
// POST /fiscalize-order  { order_id, invoice_type? }
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// PFX cache po instanci (TTL 1h) — izbjegava ponovno dohvatanje certifikata.
let pfxCache: { base64: string; tenantId: string; fetchedAt: number } | null = null;
const PFX_TTL_MS = 60 * 60 * 1000;

interface FiscalConfig {
  enabled: boolean;
  is_production: boolean;
  is_issuer_in_vat: boolean;
  default_vat_rate: number;
  seller_tin: string;
  seller_name: string;
  business_unit_code: string;
  business_unit_address: string;
  business_unit_town: string;
  tcr_code: string;
  software_code: string;
  operator_code: string;
  pfx_base64: string | null;
  pfx_password: string;
  external_tenant_id: string | null;
  external_tenants_url: string | null;
  fiscal_api_url: string;
  fiscal_api_key: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const orderId: string | undefined = body.order_id;
    if (!orderId) return json({ error: "missing order_id" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // ─── 1. Config ──────────────────────────────────────────────────────────
    const { data: cfgRow, error: cfgErr } = await supabase
      .from("kotorwalls_fiscal_config")
      .select("*")
      .eq("id", 1)
      .single();
    if (cfgErr || !cfgRow) return json({ error: `fiscal config missing: ${cfgErr?.message}` }, 500);
    const cfg = cfgRow as FiscalConfig;
    if (!cfg.enabled) return json({ skipped: true, reason: "fiscalization disabled" });

    // ─── 2. Order + tickets ─────────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from("kotorwalls_orders")
      .select("id, total, currency, payment_status, fiscal_status, channel, customer_name, customer_country")
      .eq("id", orderId)
      .single();
    if (orderErr || !order) return json({ error: "order not found" }, 404);
    if (order.payment_status !== "paid") return json({ error: "order not paid" }, 400);
    if (order.fiscal_status === "fiscalized") {
      return json({ skipped: true, reason: "already fiscalized", order_id: orderId });
    }

    const { data: tickets } = await supabase
      .from("kotorwalls_tickets")
      .select("id, category_code, category_name, price")
      .eq("order_id", orderId);
    if (!tickets?.length) return json({ error: "no tickets on order" }, 400);

    // ─── 3. Agregiraj tickets po kategoriji+cijeni → CIS items ──────────────
    const itemsMap = new Map<string, { name: string; price: number; qty: number; code: string }>();
    for (const t of tickets) {
      const price = Number(t.price);
      const key = `${t.category_code}::${price}`;
      const cur = itemsMap.get(key);
      if (cur) cur.qty += 1;
      else itemsMap.set(key, {
        name: t.category_name,
        price,
        qty: 1,
        code: t.category_code,
      });
    }
    const items = Array.from(itemsMap.values()).map(i => ({
      name: i.name.slice(0, 50),
      code: i.code.slice(0, 20),
      unit: "kom",
      quantity: i.qty,
      unitPriceWithVAT: i.price,
      vatRate: Number(cfg.default_vat_rate),
    }));

    // ─── 4. Next ord_num (atomic) ───────────────────────────────────────────
    const year = new Date().getFullYear();
    const { data: ordNum, error: ordErr } = await supabase
      .rpc("kotorwalls_fiscal_next_ord_num", { p_tcr_code: cfg.tcr_code, p_year: year });
    if (ordErr || typeof ordNum !== "number") {
      return json({ error: `failed to acquire ord_num: ${ordErr?.message ?? "unknown"}` }, 500);
    }

    // ─── 5. PFX certifikat ──────────────────────────────────────────────────
    const pfxBase64 = cfg.pfx_base64 ?? await loadPfxFromTenants(cfg);
    if (!pfxBase64) {
      await markFailed(supabase, orderId, ordNum, cfg.tcr_code, null, "PFX not available");
      return json({ error: "PFX certificate not available" }, 500);
    }

    // ─── 6. Plaćanje → CIS metoda ───────────────────────────────────────────
    // Web/POS = CARD, kiosk gotovinski = BANKNOTE; default CARD jer ovaj endpoint
    // poziva stripe-webhook nakon uspješnog plaćanja karticom.
    const paymentMethod = order.channel === "kiosk-cash" ? "BANKNOTE" : "CARD";

    // ─── 7. Payload za eksterni fiscalize ───────────────────────────────────
    const payload = {
      sellerTIN: cfg.seller_tin,
      sellerName: cfg.seller_name,
      businessUnitCode: cfg.business_unit_code,
      businessUnitAddress: cfg.business_unit_address,
      businessUnitTown: cfg.business_unit_town,
      tcrCode: cfg.tcr_code,
      softwareCode: cfg.software_code,
      operatorCode: cfg.operator_code,
      invoiceOrdNum: ordNum,
      invoiceType: body.invoice_type ?? "CASH",
      items,
      payments: [{ method: paymentMethod, amount: Number(order.total) }],
      isProduction: cfg.is_production,
      isIssuerInVAT: cfg.is_issuer_in_vat,
      pfxBase64,
      pfxPassword: cfg.pfx_password,
    };

    // ─── 8. Poziv eksternog fiscalize ───────────────────────────────────────
    let fiscalJson: any;
    try {
      const r = await fetch(cfg.fiscal_api_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cfg.fiscal_api_key ? { Authorization: `Bearer ${cfg.fiscal_api_key}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      fiscalJson = await r.json();
    } catch (e) {
      await markFailed(supabase, orderId, ordNum, cfg.tcr_code, payload, `network: ${e}`);
      return json({ error: `fiscalize call failed: ${e}` }, 502);
    }

    // ─── 9. Snimi rezultat ──────────────────────────────────────────────────
    const safePayload = { ...payload, pfxBase64: "<redacted>", pfxPassword: "<redacted>" };
    const ok = !!fiscalJson?.success;

    await supabase.from("kotorwalls_fiscal_invoices").insert({
      order_id: orderId,
      ikof:  fiscalJson?.iic ?? null,
      jikr:  fiscalJson?.fic ?? null,
      iic_signature:   fiscalJson?.iicSignature ?? null,
      qr_url:          fiscalJson?.qrCodeUrl ?? null,
      invoice_ord_num: ordNum,
      issue_dt:        fiscalJson?.dt ?? null,
      tcr_code:        cfg.tcr_code,
      xml:             fiscalJson?.xml ?? null,
      request_payload: safePayload,
      response_raw:    fiscalJson ?? null,
      status:          ok ? "succeeded" : "failed",
      error:           ok ? null : (fiscalJson?.error?.message ?? "unknown"),
      issued_at:       ok ? new Date().toISOString() : null,
    });

    await supabase
      .from("kotorwalls_orders")
      .update({
        fiscal_status: ok ? "fiscalized" : "failed",
        fiscal_ikof:   fiscalJson?.iic ?? null,
        fiscal_jikr:   fiscalJson?.fic ?? null,
      })
      .eq("id", orderId);

    await supabase.from("kotorwalls_audit_log").insert({
      actor_type: "system",
      action: ok ? "fiscal.succeeded" : "fiscal.failed",
      entity: "order",
      entity_id: orderId,
      metadata: {
        invoice_ord_num: ordNum,
        tcr_code: cfg.tcr_code,
        iic: fiscalJson?.iic ?? null,
        fic: fiscalJson?.fic ?? null,
        error: ok ? null : (fiscalJson?.error?.message ?? null),
      },
    });

    return json({
      success: ok,
      order_id: orderId,
      invoice_ord_num: ordNum,
      iic: fiscalJson?.iic ?? null,
      fic: fiscalJson?.fic ?? null,
      iic_signature: fiscalJson?.iicSignature ?? null,
      qr_url: fiscalJson?.qrCodeUrl ?? null,
      error: ok ? null : (fiscalJson?.error?.message ?? null),
    }, ok ? 200 : 502);

  } catch (e) {
    console.error("fiscalize-order error:", e);
    return json({ error: String(e) }, 500);
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loadPfxFromTenants(cfg: FiscalConfig): Promise<string | null> {
  if (!cfg.external_tenant_id || !cfg.external_tenants_url || !cfg.fiscal_api_key) return null;

  const now = Date.now();
  if (pfxCache &&
      pfxCache.tenantId === cfg.external_tenant_id &&
      now - pfxCache.fetchedAt < PFX_TTL_MS) {
    return pfxCache.base64;
  }

  const url = `${cfg.external_tenants_url}/tenants?select=pfx_base64&id=eq.${cfg.external_tenant_id}`;
  const r = await fetch(url, {
    headers: {
      apikey: cfg.fiscal_api_key,
      Authorization: `Bearer ${cfg.fiscal_api_key}`,
    },
  });
  if (!r.ok) {
    console.error("pfx fetch failed:", r.status, await r.text().catch(() => ""));
    return null;
  }
  const arr = await r.json().catch(() => []);
  const b64 = Array.isArray(arr) ? arr?.[0]?.pfx_base64 : null;
  if (b64) pfxCache = { base64: b64, tenantId: cfg.external_tenant_id, fetchedAt: now };
  return b64 ?? null;
}

async function markFailed(
  supabase: any,
  orderId: string,
  ordNum: number,
  tcrCode: string,
  payload: any,
  reason: string,
) {
  const safePayload = payload ? { ...payload, pfxBase64: "<redacted>", pfxPassword: "<redacted>" } : null;
  await supabase.from("kotorwalls_fiscal_invoices").insert({
    order_id: orderId,
    invoice_ord_num: ordNum,
    tcr_code: tcrCode,
    request_payload: safePayload,
    status: "failed",
    error: reason,
  });
  await supabase
    .from("kotorwalls_orders")
    .update({ fiscal_status: "failed" })
    .eq("id", orderId);
  await supabase.from("kotorwalls_audit_log").insert({
    actor_type: "system",
    action: "fiscal.failed",
    entity: "order",
    entity_id: orderId,
    metadata: { invoice_ord_num: ordNum, tcr_code: tcrCode, error: reason },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
