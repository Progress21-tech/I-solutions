-- UDPR production foundation. Apply with the Supabase CLI before deploying.
-- Every patient-facing record is private by default; access is granted only by
-- an active patient consent or a time-boxed access grant.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'clinician')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'yo', 'ig', 'ha', 'pcm')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  health_id text not null unique default ('UDPR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  full_name text not null,
  date_of_birth date,
  blood_group text,
  genotype text,
  allergies text,
  chronic_conditions text[] not null default '{}',
  emergency_contact_name text,
  emergency_contact_phone text,
  location_label text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinicians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  hospital_name text not null,
  specialty text not null,
  license_number text not null unique,
  years_experience integer check (years_experience >= 0),
  practice_location text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid unique references public.clinicians(id) on delete cascade,
  business_id uuid,
  submitted_license_number text,
  evidence_path text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  registration_number text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  address text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.verification_requests
  add constraint verification_requests_business_id_fkey foreign key (business_id) references public.businesses(id) on delete cascade;

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id),
  record_type text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  purpose text not null default 'record_access',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id) on delete cascade,
  consent_id uuid references public.consents(id),
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid references public.clinicians(id),
  action text not null,
  access_grant_id uuid references public.access_grants(id),
  accessed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  clinician_id uuid references public.clinicians(id) on delete cascade,
  provider_type text not null check (provider_type in ('doctor', 'hospital', 'lab', 'pharmacy')),
  display_name text not null,
  specialty text,
  address text not null,
  latitude numeric not null,
  longitude numeric not null,
  is_listed boolean not null default false,
  created_at timestamptz not null default now(),
  check ((business_id is not null) <> (clinician_id is not null))
);

create table if not exists public.teleconsultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'completed', 'cancelled')),
  scheduled_for timestamptz,
  payment_reference text unique,
  amount_kobo integer check (amount_kobo >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.imaging_analyses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id),
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'complete', 'failed', 'reviewed')),
  ai_output jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sku text,
  quantity integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  unit_price_kobo integer not null default 0 check (unit_price_kobo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_contact text,
  amount_kobo integer not null check (amount_kobo >= 0),
  currency text not null default 'NGN',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  due_at timestamptz,
  payment_reference text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  virtual_account_reference text unique,
  currency text not null default 'NGN',
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  direction text not null check (direction in ('credit', 'debit')),
  amount_kobo integer not null check (amount_kobo > 0),
  status text not null check (status in ('pending', 'completed', 'failed', 'reversed')),
  provider_reference text unique,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('earn', 'redeem', 'adjustment')),
  points integer not null check (points > 0),
  wallet_transaction_id uuid references public.wallet_transactions(id),
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

-- RLS is default-deny. Service-role operations (webhooks, administrator review)
-- are intentionally performed only from server-side routes.
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.clinicians enable row level security;
alter table public.verification_requests enable row level security;
alter table public.businesses enable row level security;
alter table public.records enable row level security;
alter table public.consents enable row level security;
alter table public.access_grants enable row level security;
alter table public.access_logs enable row level security;
alter table public.providers enable row level security;
alter table public.teleconsultations enable row level security;
alter table public.imaging_analyses enable row level security;
alter table public.inventory_items enable row level security;
alter table public.invoices enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.points_ledger enable row level security;

create policy "profiles_manage_own" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "patients_manage_own" on public.patients for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "clinicians_manage_own" on public.clinicians for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "verification_read_own_clinician" on public.verification_requests for select using (clinician_id in (select id from public.clinicians where user_id = auth.uid()));
create policy "verification_read_own_business" on public.verification_requests for select using (business_id in (select id from public.businesses where owner_id = auth.uid()));
create policy "businesses_manage_own" on public.businesses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "patients_manage_consents" on public.consents for all using (patient_id in (select id from public.patients where user_id = auth.uid())) with check (patient_id in (select id from public.patients where user_id = auth.uid()));
create policy "patients_read_own_records" on public.records for select using (patient_id in (select id from public.patients where user_id = auth.uid()));
create policy "clinicians_read_granted_records" on public.records for select using (exists (select 1 from public.access_grants g join public.clinicians c on c.id = g.clinician_id where g.patient_id = records.patient_id and g.status = 'active' and g.expires_at > now() and c.user_id = auth.uid()));
create policy "verified_clinicians_add_granted_records" on public.records for insert with check (clinician_id in (select c.id from public.clinicians c where c.user_id = auth.uid() and c.verification_status = 'verified') and exists (select 1 from public.access_grants g where g.patient_id = records.patient_id and g.clinician_id = records.clinician_id and g.status = 'active' and g.expires_at > now()));
create policy "patients_read_own_access_logs" on public.access_logs for select using (patient_id in (select id from public.patients where user_id = auth.uid()));
create policy "clinicians_read_own_access_logs" on public.access_logs for select using (clinician_id in (select id from public.clinicians where user_id = auth.uid()));
create policy "listed_providers_are_public" on public.providers for select using (is_listed = true);
create policy "business_inventory_manage_own" on public.inventory_items for all using (business_id in (select id from public.businesses where owner_id = auth.uid())) with check (business_id in (select id from public.businesses where owner_id = auth.uid()));
create policy "business_invoices_manage_own" on public.invoices for all using (business_id in (select id from public.businesses where owner_id = auth.uid())) with check (business_id in (select id from public.businesses where owner_id = auth.uid()));
create policy "users_read_own_wallet" on public.wallets for select using (owner_id = auth.uid());
create policy "users_read_own_wallet_transactions" on public.wallet_transactions for select using (wallet_id in (select id from public.wallets where owner_id = auth.uid()));
create policy "users_read_own_points" on public.points_ledger for select using (owner_id = auth.uid());
create policy "teleconsultation_participants_read" on public.teleconsultations for select using (patient_id in (select id from public.patients where user_id = auth.uid()) or clinician_id in (select id from public.clinicians where user_id = auth.uid()));
create policy "patients_request_teleconsultation" on public.teleconsultations for insert with check (patient_id in (select id from public.patients where user_id = auth.uid()));
create policy "imaging_participants_read" on public.imaging_analyses for select using (patient_id in (select id from public.patients where user_id = auth.uid()) or clinician_id in (select id from public.clinicians where user_id = auth.uid()));
