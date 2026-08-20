-- Consent gate: a verified clinician requests access, the patient decides, and
-- every successful record view is served and logged by a single RPC.
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references public.clinicians(id) on delete cascade, purpose text not null default 'record_access',
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'cancelled', 'expired')),
  created_at timestamptz not null default now(), responded_at timestamptz, expires_at timestamptz
);
create unique index if not exists one_pending_access_request_per_pair on public.access_requests (patient_id, clinician_id) where status = 'pending';
alter table public.access_requests enable row level security;
create policy "patients_read_own_access_requests" on public.access_requests for select using (patient_id in (select id from public.patients where user_id = auth.uid()));
create policy "clinicians_read_own_access_requests" on public.access_requests for select using (clinician_id in (select id from public.clinicians where user_id = auth.uid()));
create policy "patients_read_own_access_grants" on public.access_grants for select using (patient_id in (select id from public.patients where user_id = auth.uid()));
create policy "clinicians_read_own_access_grants" on public.access_grants for select using (clinician_id in (select id from public.clinicians where user_id = auth.uid()));
create policy "patients_read_connected_clinicians" on public.clinicians for select using (
  id in (select clinician_id from public.access_requests where patient_id in (select id from public.patients where user_id = auth.uid()))
  or id in (select clinician_id from public.access_grants where patient_id in (select id from public.patients where user_id = auth.uid()))
);
drop policy if exists "clinicians_read_granted_records" on public.records;

create or replace function public.request_record_access(p_health_id text, p_purpose text default 'record_access') returns table(request_id uuid, status text) language plpgsql security definer set search_path = public as $$
declare v_clinician public.clinicians; v_patient public.patients; v_request uuid;
begin
 select * into v_clinician from public.clinicians where user_id = auth.uid();
 if not found or v_clinician.verification_status <> 'verified' then raise exception 'Only verified clinicians can request record access'; end if;
 select * into v_patient from public.patients where health_id = upper(trim(p_health_id)); if not found then raise exception 'Patient not found'; end if;
 if exists (select 1 from public.access_grants where patient_id=v_patient.id and clinician_id=v_clinician.id and status='active' and expires_at>now()) then return query select null::uuid, 'granted'::text; return; end if;
 select id into v_request from public.access_requests where patient_id=v_patient.id and clinician_id=v_clinician.id and status='pending';
 if v_request is null then
  insert into public.access_requests (patient_id, clinician_id, purpose) values (v_patient.id, v_clinician.id, left(coalesce(nullif(trim(p_purpose), ''), 'record_access'), 120)) returning id into v_request;
  insert into public.access_logs (patient_id, clinician_id, action, metadata) values (v_patient.id, v_clinician.id, 'access_requested', jsonb_build_object('request_id', v_request));
 end if;
 return query select v_request, 'pending'::text;
end; $$;

create or replace function public.get_record_access_status(p_health_id text) returns table(status text, expires_at timestamptz) language plpgsql security definer set search_path = public as $$
declare v_clinician_id uuid; v_patient_id uuid; v_expiry timestamptz;
begin
 select id into v_clinician_id from public.clinicians where user_id=auth.uid() and verification_status='verified'; if v_clinician_id is null then raise exception 'Only verified clinicians can check record access'; end if;
 select id into v_patient_id from public.patients where health_id=upper(trim(p_health_id)); if v_patient_id is null then raise exception 'Patient not found'; end if;
 select expires_at into v_expiry from public.access_grants where patient_id=v_patient_id and clinician_id=v_clinician_id and status='active' and expires_at>now() order by expires_at desc limit 1;
 if v_expiry is not null then return query select 'granted'::text, v_expiry; return; end if;
 if exists (select 1 from public.access_requests where patient_id=v_patient_id and clinician_id=v_clinician_id and status='pending') then return query select 'pending'::text, null::timestamptz; return; end if;
 return query select 'none'::text, null::timestamptz;
end; $$;

create or replace function public.respond_to_record_access_request(p_request_id uuid, p_approve boolean, p_duration_hours integer default 24) returns uuid language plpgsql security definer set search_path = public as $$
declare v_request public.access_requests; v_consent uuid; v_grant uuid; v_expiry timestamptz;
begin
 if p_duration_hours < 1 or p_duration_hours > 168 then raise exception 'Access duration must be between 1 and 168 hours'; end if;
 select * into v_request from public.access_requests where id=p_request_id and status='pending' for update; if not found then raise exception 'This request is no longer awaiting a decision'; end if;
 if not exists (select 1 from public.patients where id=v_request.patient_id and user_id=auth.uid()) then raise exception 'Only the patient can respond to this request'; end if;
 update public.access_requests set status=case when p_approve then 'approved' else 'denied' end, responded_at=now() where id=p_request_id;
 if not p_approve then insert into public.access_logs (patient_id, clinician_id, action, metadata) values (v_request.patient_id, v_request.clinician_id, 'access_denied', jsonb_build_object('request_id', p_request_id)); return null; end if;
 v_expiry := now() + make_interval(hours => p_duration_hours);
 insert into public.consents (patient_id, clinician_id, purpose, status, expires_at) values (v_request.patient_id, v_request.clinician_id, v_request.purpose, 'active', v_expiry) returning id into v_consent;
 insert into public.access_grants (patient_id, clinician_id, consent_id, status, expires_at) values (v_request.patient_id, v_request.clinician_id, v_consent, 'active', v_expiry) returning id into v_grant;
 insert into public.access_logs (patient_id, clinician_id, action, access_grant_id, metadata) values (v_request.patient_id, v_request.clinician_id, 'access_granted', v_grant, jsonb_build_object('request_id', p_request_id, 'expires_at', v_expiry)); return v_grant;
end; $$;

create or replace function public.revoke_record_access(p_grant_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_grant public.access_grants;
begin
 select * into v_grant from public.access_grants where id=p_grant_id and status='active' for update; if not found then raise exception 'Active access grant not found'; end if;
 if not exists (select 1 from public.patients where id=v_grant.patient_id and user_id=auth.uid()) then raise exception 'Only the patient can revoke this access'; end if;
 update public.access_grants set status='revoked', revoked_at=now() where id=p_grant_id; update public.consents set status='revoked', revoked_at=now() where id=v_grant.consent_id and status='active';
 insert into public.access_logs (patient_id, clinician_id, action, access_grant_id) values (v_grant.patient_id, v_grant.clinician_id, 'access_revoked', p_grant_id);
end; $$;

create or replace function public.get_granted_patient_record(p_health_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_clinician_id uuid; v_patient public.patients; v_grant uuid; v_result jsonb;
begin
 select id into v_clinician_id from public.clinicians where user_id=auth.uid() and verification_status='verified'; if v_clinician_id is null then raise exception 'Only verified clinicians can view records'; end if;
 select * into v_patient from public.patients where health_id=upper(trim(p_health_id)); if not found then raise exception 'Patient not found'; end if;
 select id into v_grant from public.access_grants where patient_id=v_patient.id and clinician_id=v_clinician_id and status='active' and expires_at>now() order by expires_at desc limit 1; if v_grant is null then raise exception 'Patient consent is required before viewing records'; end if;
 select jsonb_build_object('patient', jsonb_build_object('id',v_patient.id,'health_id',v_patient.health_id,'full_name',v_patient.full_name,'date_of_birth',v_patient.date_of_birth,'blood_group',v_patient.blood_group,'genotype',v_patient.genotype,'allergies',v_patient.allergies,'chronic_conditions',v_patient.chronic_conditions), 'records',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.records r where r.patient_id=v_patient.id),'[]'::jsonb), 'expires_at',(select expires_at from public.access_grants where id=v_grant)) into v_result;
 insert into public.access_logs (patient_id, clinician_id, action, access_grant_id) values (v_patient.id, v_clinician_id, 'record_viewed', v_grant); return v_result;
end; $$;

revoke all on function public.request_record_access(text, text), public.get_record_access_status(text), public.respond_to_record_access_request(uuid, boolean, integer), public.revoke_record_access(uuid), public.get_granted_patient_record(text) from public;
grant execute on function public.request_record_access(text, text), public.get_record_access_status(text), public.respond_to_record_access_request(uuid, boolean, integer), public.revoke_record_access(uuid), public.get_granted_patient_record(text) to authenticated;
