-- ═══════════════════════════════════════════════════════════════════════════
-- Fiskalizacija CG (EFI / CIS) — config singleton, counter, dodatne kolone
-- Eksterna funkcija: psqxprqpazfpkqyuijcd.supabase.co/functions/v1/fiscalize
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Konfiguracija (singleton) ───────────────────────────────────────────────
create table if not exists kotorwalls_fiscal_config (
  id                     int primary key default 1,
  enabled                boolean not null default true,
  is_production          boolean not null default false,
  is_issuer_in_vat       boolean not null default true,
  default_vat_rate       numeric(5,2) not null default 15,

  seller_tin             text not null,
  seller_name            text not null,
  business_unit_code     text not null,
  business_unit_address  text not null,
  business_unit_town     text not null,
  tcr_code               text not null,
  software_code          text not null,
  operator_code          text not null,

  -- multi-tenant cert: ako je pfx_base64 NULL, edge funkcija ga povlači sa
  -- external_tenants_url + external_tenant_id (i kešira u memoriji instance).
  pfx_base64             text,
  pfx_password           text not null,
  external_tenant_id     text,
  external_tenants_url   text default 'https://psqxprqpazfpkqyuijcd.supabase.co/rest/v1',

  fiscal_api_url         text not null default 'https://psqxprqpazfpkqyuijcd.supabase.co/functions/v1/fiscalize',
  fiscal_api_key         text,

  updated_at             timestamptz not null default now(),
  updated_by             uuid,

  constraint kotorwalls_fiscal_config_singleton check (id = 1)
);

-- TECONIA MONTENEGRO DOO — TEST tenant (efitest.tax.gov.me)
insert into kotorwalls_fiscal_config (
  id, is_production, is_issuer_in_vat, default_vat_rate,
  seller_tin, seller_name, business_unit_code, business_unit_address, business_unit_town,
  tcr_code, software_code, operator_code,
  pfx_password, external_tenant_id,
  fiscal_api_key
) values (
  1, false, true, 15,
  '03627357', 'TECONIA MONTENEGRO DOO', 'zq333zc597', 'Podgorica', 'Podgorica',
  'rc621rr268', 'lm441kt072', 'ah031cl261',
  'ktzrfdmudx', '3f4cce7b-3d14-4489-a322-26cd471c5bad',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcXhwcnFwYXpmcGtxeXVpamNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE0OTIsImV4cCI6MjA4NTAxNzQ5Mn0.5SB2KqOQzlk1V6wIzjMd1kwE3MngrTAVU19mKvVcbVc'
)
on conflict (id) do nothing;

alter table kotorwalls_fiscal_config enable row level security;

-- ─── Counter za invoiceOrdNum (po TCR + godini) ──────────────────────────────
create table if not exists kotorwalls_fiscal_counters (
  tcr_code     text not null,
  year         int  not null,
  next_ord_num int  not null default 1,
  updated_at   timestamptz not null default now(),
  primary key (tcr_code, year)
);

alter table kotorwalls_fiscal_counters enable row level security;

-- Atomic UPSERT-and-increment. Vraća TRENUTNI ord_num i postavlja next na +1.
-- Prvi poziv za (TCR, godinu) vraća 1; svaki sljedeći inkrementira.
create or replace function kotorwalls_fiscal_next_ord_num(p_tcr_code text, p_year int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num int;
begin
  insert into kotorwalls_fiscal_counters (tcr_code, year, next_ord_num)
  values (p_tcr_code, p_year, 2)
  on conflict (tcr_code, year) do update
    set next_ord_num = kotorwalls_fiscal_counters.next_ord_num + 1,
        updated_at   = now()
  returning next_ord_num - 1 into v_num;
  return v_num;
end;
$$;

-- ─── Dodatne kolone na kotorwalls_fiscal_invoices ────────────────────────────
-- ikof = IIC, jikr = FIC (CG terminologija). Mapiranje: API.iic→ikof, API.fic→jikr
alter table kotorwalls_fiscal_invoices
  add column if not exists iic_signature   text,
  add column if not exists qr_url          text,
  add column if not exists invoice_ord_num int,
  add column if not exists issue_dt        text,
  add column if not exists tcr_code        text,
  add column if not exists xml             text,
  add column if not exists request_payload jsonb,
  add column if not exists response_raw    jsonb,
  add column if not exists attempt_count   int  not null default 1;

create index if not exists kotorwalls_fiscal_invoices_order_idx
  on kotorwalls_fiscal_invoices (order_id);
create index if not exists kotorwalls_fiscal_invoices_status_idx
  on kotorwalls_fiscal_invoices (status, created_at desc);

-- ─── Retention: fiscal.* audit eventi su kritični (zakonska obaveza) ─────────
create or replace function kotorwalls_is_critical_audit(action text, actor_type text)
returns boolean
language sql
immutable
as $$
  select
    actor_type = 'admin'
    or action like 'payment.%'
    or action like 'refund.%'
    or action like 'charge.dispute.%'
    or action like 'fiscal.%'
    or action in ('email.ticket_failed');
$$;
