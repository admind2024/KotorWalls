// ═══════════════════════════════════════════════════════════════════════════
// create-checkout — PaymentIntent + custom forma (stil festivala)
// Tender: 3.3, 3.4, 4.2, 4.3  — kartica se ne obrađuje kod nas, Stripe preuzima
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STRIPE_KEY       = Deno.env.get("STRIPE_SECRET_KEY_KOTOR")!;
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SERVICE_FEE_PCT  = Number(Deno.env.get("SERVICE_FEE_PCT")  ?? "0");   // npr. 5
const SERVICE_FEE_FLAT = Number(Deno.env.get("SERVICE_FEE_FLAT") ?? "0");   // npr. 0.30

const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2025-03-31.basil" });

interface LineItem { category_code: string; quantity: number; }
interface Body {
  // KREIRANJE
  items?: LineItem[];
  customer_name?:    string;
  customer_email?:   string;
  customer_phone?:   string;
  customer_address?: string;
  customer_city?:    string;
  customer_zip?:     string;
  customer_country?: string;
  language?: string;
  channel?:  string;
  kiosk_id?: string | null;
  bin_discount?: { applied: boolean; percentage?: number; bin?: string; bank_name?: string };

  // UPDATE IZNOSA (za BIN popust)
  action?:            "update_amount";
  payment_intent_id?: string;
  new_amount?:        number;   // u centima
  discount_bin?:      string;
  discount_percentage?: number;
  discount_bank_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  try {
    const body: Body = await req.json();

    // ── UPDATE AMOUNT za BIN popust ────────────────────────────────────────
    if (body.action === "update_amount") {
      if (!body.payment_intent_id || !body.new_amount) {
        return json({ error: "missing payment_intent_id or new_amount" }, 400);
      }
      await stripe.paymentIntents.update(body.payment_intent_id, {
        amount: body.new_amount,
        metadata: {
          discount_applied:    "true",
          discount_percentage: String(body.discount_percentage ?? 0),
          discount_bin:        body.discount_bin ?? "",
          discount_bank_name:  body.discount_bank_name ?? "",
        },
      });
      return json({ success: true });
    }

    // ── KREIRANJE ──────────────────────────────────────────────────────────
    if (!body.items?.length) return json({ error: "No items" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) učitaj kategorije i validiraj cijene
    const codes = body.items.map(i => i.category_code);
    const { data: cats } = await supabase
      .from("kotorwalls_ticket_categories")
      .select("id, code, name_i18n, price, currency, active")
      .in("code", codes);

    if (!cats?.length) return json({ error: "No valid categories" }, 400);

    const byCode = new Map(cats.map(c => [c.code, c]));
    const currency = (cats[0].currency ?? "EUR").toLowerCase();

    // 2) raunanje
    const groups: Record<string, { name: string; price: number; quantity: number }> = {};
    const individual: { category_id: string; category_code: string; category_name: string; price: number }[] = [];
    let subtotal = 0;

    for (const it of body.items) {
      const cat = byCode.get(it.category_code);
      if (!cat || !cat.active) return json({ error: `Invalid category: ${it.category_code}` }, 400);
      const qty = Math.max(0, Math.min(50, it.quantity | 0));
      if (qty === 0) continue;

      const nameEn = cat.name_i18n?.en ?? cat.code;
      const name   = cat.name_i18n?.[body.language ?? "en"] ?? nameEn;
      groups[cat.code] = { name, price: Number(cat.price), quantity: qty };
      subtotal += Number(cat.price) * qty;

      for (let i = 0; i < qty; i++) {
        individual.push({
          category_id:   cat.id,
          category_code: cat.code,
          category_name: nameEn,
          price:         Number(cat.price),
        });
      }
    }

    if (!individual.length) return json({ error: "No items" }, 400);

    const serviceFee = round2(subtotal * (SERVICE_FEE_PCT / 100) + SERVICE_FEE_FLAT);
    const total      = round2(subtotal + serviceFee);
    const amountCents = Math.round(total * 100);

    // 3) snimi pending order
    const { data: order, error: orderErr } = await supabase
      .from("kotorwalls_orders")
      .insert({
        channel:          body.channel  ?? "web",
        kiosk_id:         body.kiosk_id ?? null,
        language:         body.language ?? "en",
        customer_email:   body.customer_email ?? null,
        customer_name:    body.customer_name  ?? null,
        customer_phone:   body.customer_phone ?? null,
        customer_country: body.customer_country ?? null,
        subtotal, service_fee: serviceFee, total,
        currency:         currency.toUpperCase(),
        payment_status:   "pending",
        metadata: {
          items:   body.items,
          address: body.customer_address ?? null,
          city:    body.customer_city ?? null,
          zip:     body.customer_zip ?? null,
        },
      })
      .select("id")
      .single();

    if (orderErr) throw orderErr;

    // 4) pre-kreiraj tikete (bez QR-a — QR se doda kad webhook potvrdi plaćanje)
    const ticketRows = individual.map(t => ({
      order_id:      order.id,
      category_id:   t.category_id,
      category_code: t.category_code,
      category_name: t.category_name,
      price:         t.price,
      language:      body.language ?? "en",
      status:        "pending",
      qr_code:       `PENDING-${crypto.randomUUID().replace(/-/g, "")}`, // privremeno, unique
    }));
    const { error: tErr } = await supabase.from("kotorwalls_tickets").insert(ticketRows);
    if (tErr) throw tErr;

    // 5) PaymentIntent (manual capture — capture u webhook-u poslije BIN provjere)
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      description: `Kotor Walls — ${individual.length} karte`,
      receipt_email: body.customer_email || undefined,
      metadata: {
        order_id:         order.id,
        event_id:         "KOTOR WALLS",
        language:         body.language ?? "en",
        channel:          body.channel  ?? "web",
        subtotal:         subtotal.toFixed(2),
        service_fee:      serviceFee.toFixed(2),
        total:            total.toFixed(2),
        currency:         currency.toUpperCase(),
        customer_name:    (body.customer_name  ?? "").substring(0, 200),
        customer_email:   (body.customer_email ?? "").substring(0, 200),
        customer_phone:   (body.customer_phone ?? "").substring(0, 50),
        customer_address: (body.customer_address ?? "").substring(0, 200),
        customer_city:    (body.customer_city    ?? "").substring(0, 100),
        customer_zip:     (body.customer_zip     ?? "").substring(0, 20),
        customer_country: (body.customer_country ?? "").substring(0, 5),
        discount_applied:    (body.bin_discount?.applied ?? false).toString(),
        discount_percentage: (body.bin_discount?.percentage ?? 0).toString(),
        discount_bin:        (body.bin_discount?.bin ?? "").substring(0, 10),
        discount_bank_name:  (body.bin_discount?.bank_name ?? "").substring(0, 100),
      },
    });

    // 6) update order sa PI id
    await supabase
      .from("kotorwalls_orders")
      .update({ stripe_payment_intent_id: pi.id })
      .eq("id", order.id);

    await supabase.from("kotorwalls_audit_log").insert({
      actor_type: "system",
      action: "order.create",
      entity: "order",
      entity_id: order.id,
      metadata: { pi_id: pi.id, subtotal, total, items: body.items },
    });

    return json({
      success: true,
      clientSecret:     pi.client_secret,
      paymentIntentId:  pi.id,
      orderId:          order.id,
      amount:           total,
      amountInCents:    amountCents,
      subtotal, serviceFee, currency: currency.toUpperCase(),
    });

  } catch (e) {
    console.error(e);
    return json({ success: false, error: String(e?.message ?? e) }, 500);
  }
});

function round2(v: number) { return Math.round(v * 100) / 100; }
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
