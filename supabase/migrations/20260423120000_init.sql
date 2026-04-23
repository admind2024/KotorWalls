-- ═══════════════════════════════════════════════════════════════════════════
-- Kotor Walls — odvojene tabele sa prefiksom 'kotorwalls_'
-- Postojeća etiketing.me šema ostaje netaknuta
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── 7.2 Kategorije karata ───────────────────────────────────────────────────
create table if not exists kotorwalls_ticket_categories (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name_i18n  jsonb not null,
  sublabel_i18n jsonb,
  price      numeric(10,2) not null,
  currency   text not null default 'EUR',
  quantity   int,
  active     boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 2.4 Porudžbine ──────────────────────────────────────────────────────────
create table if not exists kotorwalls_orders (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text unique,
  stripe_payment_intent_id text,
  customer_email     text,
  customer_name      text,
  customer_phone     text,
  customer_country   text,
  channel            text not null default 'web',
  kiosk_id           uuid,
  language           text,
  subtotal           numeric(10,2) not null,
  service_fee        numeric(10,2) not null default 0,
  total              numeric(10,2) not null,
  currency           text not null default 'EUR',
  payment_status     text not null default 'pending',
  fiscal_status      text not null default 'pending',
  fiscal_ikof        text,
  fiscal_jikr        text,
  metadata           jsonb,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz,
  refunded_at        timestamptz
);
create index if not exists kotorwalls_orders_created_at_idx on kotorwalls_orders (created_at desc);
create index if not exists kotorwalls_orders_channel_idx    on kotorwalls_orders (channel);
create index if not exists kotorwalls_orders_status_idx     on kotorwalls_orders (payment_status);
create index if not exists kotorwalls_orders_email_idx      on kotorwalls_orders (customer_email);

-- ─── 2.4 Pojedinačne ulaznice ────────────────────────────────────────────────
create table if not exists kotorwalls_tickets (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references kotorwalls_orders(id) on delete cascade,
  category_id   uuid references kotorwalls_ticket_categories(id),
  category_code text not null,
  category_name text not null,
  price         numeric(10,2) not null,
  qr_code       text unique not null,
  status        text not null default 'pending',
  language      text,
  issued_at     timestamptz not null default now(),
  used_at       timestamptz,
  gate_id       uuid,
  valid_from    date,
  valid_until   date
);
create index if not exists kotorwalls_tickets_order_idx  on kotorwalls_tickets (order_id);
create index if not exists kotorwalls_tickets_qr_idx     on kotorwalls_tickets (qr_code);
create index if not exists kotorwalls_tickets_status_idx on kotorwalls_tickets (status);

-- ─── 3, 6.2 Transakcije ──────────────────────────────────────────────────────
create table if not exists kotorwalls_transactions (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid references kotorwalls_orders(id) on delete cascade,
  stripe_pi_id      text unique,
  stripe_charge_id  text,
  amount            numeric(10,2) not null,
  currency          text not null default 'EUR',
  method            text,
  brand             text,
  bin               text,
  issuer            text,
  country           text,
  status            text not null,
  risk_score        numeric(5,2),
  risk_level        text,
  created_at        timestamptz not null default now()
);

-- ─── 6.1 Refundacije ─────────────────────────────────────────────────────────
create table if not exists kotorwalls_refunds (
  id                uuid primary key default gen_random_uuid(),
  transaction_id    uuid references kotorwalls_transactions(id) on delete cascade,
  order_id          uuid references kotorwalls_orders(id),
  stripe_refund_id  text unique,
  amount            numeric(10,2) not null,
  currency          text not null default 'EUR',
  reason            text,
  status            text not null,
  created_by        uuid,
  created_at        timestamptz not null default now()
);

-- ─── 6.2 Chargeback-ovi ──────────────────────────────────────────────────────
create table if not exists kotorwalls_chargebacks (
  id                uuid primary key default gen_random_uuid(),
  transaction_id    uuid references kotorwalls_transactions(id),
  stripe_dispute_id text unique,
  amount            numeric(10,2) not null,
  currency          text not null default 'EUR',
  reason            text,
  status            text not null,
  evidence_due_at   timestamptz,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

-- ─── 3.4 BIN pravila ─────────────────────────────────────────────────────────
create table if not exists kotorwalls_bin_rules (
  id          uuid primary key default gen_random_uuid(),
  bin         text not null,
  brand       text,
  issuer      text,
  discount_pct numeric(5,2) not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── 4.4 Fraud pravila ───────────────────────────────────────────────────────
create table if not exists kotorwalls_fraud_rules (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  active      boolean not null default true,
  config      jsonb,
  created_at  timestamptz not null default now()
);

-- ─── 9 Kiosci ────────────────────────────────────────────────────────────────
create table if not exists kotorwalls_kiosks (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  location         text not null,
  api_key_hash     text not null,
  status           text not null default 'offline',
  last_heartbeat_at timestamptz,
  last_sync_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- ─── 10 Prolazni mehanizmi (CM4 NANO) ────────────────────────────────────────
create table if not exists kotorwalls_gates (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  location         text not null,
  device_id        text,
  open_interval_ms int not null default 3000,
  status           text not null default 'unknown',
  last_signal_at   timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists kotorwalls_gate_events (
  id         uuid primary key default gen_random_uuid(),
  gate_id    uuid references kotorwalls_gates(id) on delete cascade,
  ticket_id  uuid references kotorwalls_tickets(id),
  qr_raw     text,
  result     text not null,
  reason     text,
  created_at timestamptz not null default now()
);
create index if not exists kotorwalls_gate_events_gate_idx on kotorwalls_gate_events (gate_id, created_at desc);

-- ─── 5.2 Webhook endpointi ───────────────────────────────────────────────────
create table if not exists kotorwalls_webhooks (
  id             uuid primary key default gen_random_uuid(),
  url            text not null,
  events         text[] not null,
  signing_secret text not null,
  status         text not null default 'healthy',
  last_delivery_at timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists kotorwalls_webhook_deliveries (
  id            uuid primary key default gen_random_uuid(),
  webhook_id    uuid references kotorwalls_webhooks(id) on delete cascade,
  event_type    text not null,
  payload       jsonb not null,
  response_code int,
  response_ms   int,
  success       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── 8.3 Fiskalizacija CG ────────────────────────────────────────────────────
create table if not exists kotorwalls_fiscal_invoices (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references kotorwalls_orders(id) on delete cascade,
  ikof       text,
  jikr       text,
  status     text not null default 'pending',
  pdf_url    text,
  error      text,
  issued_at  timestamptz,
  created_at timestamptz not null default now()
);

-- ─── 7.3 Audit log ───────────────────────────────────────────────────────────
create table if not exists kotorwalls_audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid,
  actor_type text not null default 'user',
  action     text not null,
  entity     text,
  entity_id  uuid,
  metadata   jsonb,
  ip         inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists kotorwalls_audit_log_created_idx on kotorwalls_audit_log (created_at desc);
create index if not exists kotorwalls_audit_log_actor_idx   on kotorwalls_audit_log (actor_id);
create index if not exists kotorwalls_audit_log_entity_idx  on kotorwalls_audit_log (entity, entity_id);

-- ─── 7.5 Uloge korisnika ─────────────────────────────────────────────────────
create table if not exists kotorwalls_user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'operator',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table kotorwalls_ticket_categories  enable row level security;
alter table kotorwalls_orders             enable row level security;
alter table kotorwalls_tickets            enable row level security;
alter table kotorwalls_transactions       enable row level security;
alter table kotorwalls_refunds            enable row level security;
alter table kotorwalls_chargebacks        enable row level security;
alter table kotorwalls_bin_rules          enable row level security;
alter table kotorwalls_fraud_rules        enable row level security;
alter table kotorwalls_kiosks             enable row level security;
alter table kotorwalls_gates              enable row level security;
alter table kotorwalls_gate_events        enable row level security;
alter table kotorwalls_webhooks           enable row level security;
alter table kotorwalls_webhook_deliveries enable row level security;
alter table kotorwalls_fiscal_invoices    enable row level security;
alter table kotorwalls_audit_log          enable row level security;
alter table kotorwalls_user_profiles      enable row level security;

create policy "kotorwalls public read active categories"
  on kotorwalls_ticket_categories for select
  using (active = true);

create policy "kotorwalls read own profile"
  on kotorwalls_user_profiles for select
  using (auth.uid() = id);
