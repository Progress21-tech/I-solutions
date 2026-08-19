-- Clinicians may submit or resubmit applications, but only trusted server-side
-- review tooling can mark an application or clinician as verified.

create or replace function public.restrict_clinician_verification_status()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.verification_status := 'pending';
    elsif new.verification_status = 'verified' then
      raise exception 'Clinicians cannot verify their own account';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists restrict_clinician_verification_status on public.clinicians;
create trigger restrict_clinician_verification_status
before insert or update on public.clinicians
for each row execute function public.restrict_clinician_verification_status();

create or replace function public.restrict_request_verification_status()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    if new.status = 'verified' then
      raise exception 'Clinicians cannot verify their own application';
    end if;
    new.status := 'pending';
    new.reviewer_note := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists restrict_request_verification_status on public.verification_requests;
create trigger restrict_request_verification_status
before insert or update on public.verification_requests
for each row execute function public.restrict_request_verification_status();

drop policy if exists "verification_read_own_clinician" on public.verification_requests;
drop policy if exists "verification_read_own_business" on public.verification_requests;

create policy "clinicians_manage_own_verification_request"
on public.verification_requests
for all
using (clinician_id in (select id from public.clinicians where user_id = auth.uid()))
with check (clinician_id in (select id from public.clinicians where user_id = auth.uid()));
