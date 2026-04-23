-- ═══════════════════════════════════════════════════════════════════════════
-- Retention policy: čuvanje audit loga i webhook delivery istorije
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists kotorwalls_retention_settings (
  id                       text primary key,
  audit_noncritical_days   int  not null default 30,
  webhook_deliveries_days  int  not null default 14,
  updated_at               timestamptz not null default now(),
  updated_by               uuid
);

insert into kotorwalls_retention_settings (id)
values ('default')
on conflict (id) do nothing;

alter table kotorwalls_retention_settings enable row level security;

-- kritične akcije koje se NIKAD ne brišu automatski
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
    or action in ('email.ticket_failed');
$$;

-- funkcija čišćenja — briše non-kritične audit zapise i webhook deliveries
create or replace function kotorwalls_cleanup_logs()
returns table(audit_deleted int, webhook_deleted int)
language plpgsql
security definer
as $$
declare
  s kotorwalls_retention_settings%rowtype;
  a int; w int;
begin
  select * into s from kotorwalls_retention_settings where id = 'default';
  if not found then
    insert into kotorwalls_retention_settings (id) values ('default') returning * into s;
  end if;

  delete from kotorwalls_audit_log
   where created_at < now() - make_interval(days => s.audit_noncritical_days)
     and not kotorwalls_is_critical_audit(action, actor_type);
  get diagnostics a = row_count;

  delete from kotorwalls_webhook_deliveries
   where created_at < now() - make_interval(days => s.webhook_deliveries_days);
  get diagnostics w = row_count;

  audit_deleted := a;
  webhook_deleted := w;
  return next;
end;
$$;
