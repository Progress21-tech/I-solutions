-- A user receives one business workspace during the lightweight onboarding flow.
-- This makes the owner_id upsert in the application deterministic.
create unique index if not exists businesses_owner_id_key on public.businesses (owner_id);
