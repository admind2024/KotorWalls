-- ═══════════════════════════════════════════════════════════════════════════
-- Admin state — perzistentne admin preference (singleton, id=1)
-- Trenutno: stripe_mode (live | test)
-- Razlog: admin može da se loguje sa različitih PC-eva i očekuje da
-- preferencija prati nalog, ne browser/localStorage.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists kotorwalls_admin_state (
  id          int primary key default 1,
  stripe_mode text not null default 'live' check (stripe_mode in ('live', 'test')),
  updated_at  timestamptz not null default now(),

  constraint kotorwalls_admin_state_singleton check (id = 1)
);

insert into kotorwalls_admin_state (id) values (1) on conflict (id) do nothing;

alter table kotorwalls_admin_state enable row level security;
