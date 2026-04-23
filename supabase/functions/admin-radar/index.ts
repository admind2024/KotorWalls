// ═══════════════════════════════════════════════════════════════════════════
// admin-radar — wrapper oko Stripe Radar API za admin panel
// Akcije:
//   list_value_lists                           → svi value list-ovi
//   list_items         { value_list }          → stavke liste (paginirano)
//   add_item           { value_list, value }   → doda stavku
//   delete_item        { item_id }             → obriše stavku
//   list_reviews       { status? }             → lista pending/closed review-ova
//   close_review       { review_id, reason }   → approve|refund ... (approve/decline)
//   list_early_fraud   { limit? }              → Early Fraud Warnings
//
// Stripe Radar *pravila* (Rules) NISU dostupna preko public API — moraju se
// mijenjati u Stripe Dashboard-u. Ovo funkcionira samo sa value lists + reviews.
// ═══════════════════════════════════════════════════════════════════════════

import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const STRIPE_KEY_LIVE = Deno.env.get("STRIPE_SECRET_KEY_KOTOR") ?? "";
const STRIPE_KEY_TEST = Deno.env.get("STRIPE_SECRET_KEY_KOTOR_TEST") ?? "";

function makeStripe(mode?: string) {
  const key = mode === "test" ? STRIPE_KEY_TEST : STRIPE_KEY_LIVE;
  if (!key) throw new Error(`Stripe key for mode "${mode ?? "live"}" not configured`);
  return new Stripe(key, { apiVersion: "2025-03-31.basil", httpClient: Stripe.createFetchHttpClient() });
}

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "method not allowed" }, 405);

  try {
    const body = await req.json();
    const stripe = makeStripe(body.mode);
    const action = body.action as string;

    switch (action) {
      case "list_value_lists": {
        const res = await stripe.radar.valueLists.list({ limit: 100 });
        return json({ value_lists: res.data });
      }

      case "list_items": {
        if (!body.value_list) return json({ error: "value_list required" }, 400);
        const res = await stripe.radar.valueListItems.list({
          value_list: body.value_list,
          limit: Math.min(Number(body.limit ?? 100), 100),
          ...(body.starting_after ? { starting_after: body.starting_after } : {}),
        });
        return json({ items: res.data, has_more: res.has_more });
      }

      case "add_item": {
        if (!body.value_list || !body.value) return json({ error: "value_list and value required" }, 400);
        const item = await stripe.radar.valueListItems.create({
          value_list: body.value_list,
          value:      String(body.value),
        });
        return json({ item });
      }

      case "delete_item": {
        if (!body.item_id) return json({ error: "item_id required" }, 400);
        const res = await stripe.radar.valueListItems.del(body.item_id);
        return json({ deleted: res.deleted, id: res.id });
      }

      case "list_reviews": {
        const res = await stripe.reviews.list({ limit: 50 });
        const filtered = body.status
          ? res.data.filter(r => (body.status === "open" ? r.open : !r.open))
          : res.data;
        return json({ reviews: filtered });
      }

      case "close_review": {
        if (!body.review_id || !body.reason) return json({ error: "review_id and reason required" }, 400);
        // reason: "approved" | "refunded" | "refunded_as_fraud" | "disputed"
        const review = await stripe.reviews.approve(body.review_id);
        return json({ review });
      }

      case "list_early_fraud": {
        const res = await stripe.radar.earlyFraudWarnings.list({
          limit: Math.min(Number(body.limit ?? 25), 100),
        });
        return json({ warnings: res.data });
      }

      default:
        return json({ error: `unknown action: ${action}` }, 400);
    }
  } catch (e) {
    console.error("admin-radar:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
