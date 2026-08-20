create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('interswitch', 'opay')), purpose text not null,
  amount_kobo integer not null check (amount_kobo > 0), currency text not null default 'NGN',
  merchant_reference text not null unique, provider_reference text unique,
  status text not null default 'pending' check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  points_eligible boolean not null default false, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), settled_at timestamptz
);
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(), provider text not null, provider_event_id text not null,
  payload jsonb not null, received_at timestamptz not null default now(), processed_at timestamptz,
  unique(provider, provider_event_id)
);
create table if not exists public.clinician_subscriptions (
  id uuid primary key default gen_random_uuid(), clinician_id uuid not null unique references public.clinicians(id) on delete cascade,
  plan text not null check (plan in ('basic', 'pro')), status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  payment_intent_id uuid not null unique references public.payment_intents(id), starts_at timestamptz not null default now(), expires_at timestamptz not null
);
create table if not exists public.platform_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
insert into public.platform_settings (key, value) values ('points_conversion_rate_ngn', '100'::jsonb) on conflict (key) do nothing;
alter table public.payment_intents enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.platform_settings enable row level security;
alter table public.clinician_subscriptions enable row level security;
create policy "users_read_own_payment_intents" on public.payment_intents for select using (owner_id = auth.uid());
create policy "clinicians_read_own_subscription" on public.clinician_subscriptions for select using (clinician_id in (select id from public.clinicians where user_id = auth.uid()));

create or replace function public.settle_payment_intent(p_reference text, p_provider_reference text, p_provider text, p_amount_kobo integer, p_event_id text, p_payload jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_intent public.payment_intents; v_wallet uuid; v_divisor integer; v_points integer; v_clinician uuid; v_plan text;
begin
  insert into public.payment_webhook_events (provider, provider_event_id, payload) values (p_provider, p_event_id, p_payload) on conflict (provider, provider_event_id) do nothing;
  if not found then return false; end if;
  select * into v_intent from public.payment_intents where merchant_reference = p_reference and provider = p_provider for update;
  if not found then raise exception 'Unknown payment reference'; end if;
  if v_intent.amount_kobo <> p_amount_kobo then raise exception 'Payment amount mismatch'; end if;
  if v_intent.status = 'succeeded' then return false; end if;
  insert into public.wallets (owner_id) values (v_intent.owner_id) on conflict (owner_id) do nothing;
  select id into v_wallet from public.wallets where owner_id = v_intent.owner_id;
  update public.payment_intents set status = 'succeeded', provider_reference = p_provider_reference, settled_at = now() where id = v_intent.id;
  insert into public.wallet_transactions (wallet_id, direction, amount_kobo, status, provider_reference, idempotency_key, metadata) values (v_wallet, 'debit', v_intent.amount_kobo, 'completed', p_provider_reference, 'payment:' || v_intent.id, jsonb_build_object('purpose', v_intent.purpose));
  if v_intent.purpose like 'clinician_subscription_%' then
    v_clinician := (v_intent.metadata ->> 'clinician_id')::uuid; v_plan := v_intent.metadata ->> 'plan';
    insert into public.clinician_subscriptions (clinician_id, plan, payment_intent_id, expires_at) values (v_clinician, v_plan, v_intent.id, now() + interval '30 days')
    on conflict (clinician_id) do update set plan = excluded.plan, status = 'active', payment_intent_id = excluded.payment_intent_id, starts_at = now(), expires_at = excluded.expires_at;
  end if;
  if v_intent.points_eligible then
    select (value #>> '{}')::integer into v_divisor from public.platform_settings where key = 'points_conversion_rate_ngn';
    v_points := floor(v_intent.amount_kobo::numeric / (greatest(v_divisor, 1) * 100));
    if v_points > 0 then insert into public.points_ledger (owner_id, direction, points, idempotency_key) values (v_intent.owner_id, 'earn', v_points, 'points:' || v_intent.id); end if;
  end if;
  update public.payment_webhook_events set processed_at = now() where provider = p_provider and provider_event_id = p_event_id;
  return true;
end; $$;
revoke all on function public.settle_payment_intent(text, text, text, integer, text, jsonb) from public;
grant execute on function public.settle_payment_intent(text, text, text, integer, text, jsonb) to service_role;
