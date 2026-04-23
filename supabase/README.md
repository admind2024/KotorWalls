# Kotor Walls — Supabase (etiketing-me)

## Struktura
```
supabase/
├── schema.sql                          # tabele + RLS
└── functions/
    ├── create-checkout/index.ts        # Stripe Checkout sesija  (← Wix _createStripeSession)
    ├── stripe-webhook/index.ts         # plaćanje + refund + dispute (← Wix _handleStripeWebhook)
    └── validate-ticket/index.ts        # CM4 NANO edge + kiosci (tender 2.4 / 10.1)
```

## Environment (Supabase → Settings → Functions → Secrets)

```
STRIPE_SECRET_KEY        sk_live_...
STRIPE_WEBHOOK_SECRET    whsec_...
CHECKOUT_SUCCESS_URL     https://kotorwalls.me/success?session_id={CHECKOUT_SESSION_ID}
CHECKOUT_CANCEL_URL      https://kotorwalls.me/cancel
SERVICE_FEE_PCT          0        # procenat naknade (npr. 5)
SERVICE_FEE_FLAT         0        # fiksna naknada u EUR (npr. 0.30)
```

`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` se automatski injektuju.

## Deploy (kroz Supabase CLI)

```bash
supabase link --project-ref <etiketing-me-ref>
supabase db push                             # primijeni schema.sql
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy validate-ticket   --no-verify-jwt
```

`stripe-webhook` mora ići bez JWT provjere — Stripe ne šalje token, potpis provjerava sam kod.

## Stripe webhook endpoint

U Stripe Dashboard dodaj webhook:
```
URL:     https://<project>.functions.supabase.co/stripe-webhook
Events:  checkout.session.completed
         charge.refunded
         charge.dispute.created
         charge.dispute.updated
         charge.dispute.closed
```

## Frontend poziv (widget)

```ts
const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
  body: JSON.stringify({
    items:    [{ category_code: "adult", quantity: 2 }],
    language: "en",
    channel:  "web",
  }),
});
const { url } = await res.json();
window.location.href = url;
```

## Šta je promijenjeno u odnosu na Wix

| Wix / Velo                    | Supabase                               |
|-------------------------------|----------------------------------------|
| `wix-secrets-backend`         | `Deno.env.get("STRIPE_SECRET_KEY")`    |
| `wixData.insert("SimpleEventOrders")` | `supabase.from("orders").insert(...)` |
| `wixData.insert("SimpleEventTickets")`| `supabase.from("tickets").insert(...)`|
| metadata chunks (≤500 char)   | native `jsonb` → nema chunk-ovanja     |
| Wix page `onReady`            | edge function `Deno.serve(...)`        |
| Navigation element            | SPA (React/Vite)                       |

QR kod se generiše **u trenutku kreiranja sesije** (UUID u `tickets.qr_code`) i zaključava se kao `valid` tek nakon `checkout.session.completed`. Ovo eliminiše duple upise iz Wix varijante.

## Mapiranje na tender

| Tačka | Pokrivenost |
|-------|-------------|
| 2.4   | `tickets.qr_code`, `validate-ticket` → `gate_events` |
| 3.3   | `transactions.brand` / `bin` / `issuer` / `country` iz `payment_method_details.card` |
| 3.4   | `bin_rules` tabela (primjenjuje se na frontend-u prije checkout-a) |
| 4.1   | Neosjetljivi podaci u Supabase; PAN/CVV nikad ne dolazi do backend-a |
| 4.2   | Stripe Checkout = PCI DSS Level 1, TLS 1.2+, tokenizacija |
| 4.3   | 3DS / SCA na Stripe strani — prima se samo status |
| 4.4   | `transactions.risk_score` / `risk_level` iz `charge.outcome` |
| 5.2   | `webhooks` + `webhook_deliveries` (za outbound webhook-ove partnerima) |
| 6.1   | `refunds` + `charge.refunded` handler |
| 6.2   | `chargebacks` + `charge.dispute.*` handler |
| 7.3   | `audit_log` — svaka izmjena + sistemski događaj |
| 9.12  | `validate-ticket` traži `x-api-key` header (po kiosku/edge uređaju) |
| 10.1  | `gates` + `gate_events` tabele |
