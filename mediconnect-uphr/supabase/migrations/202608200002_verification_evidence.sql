-- Evidence remains private. Uploads are validated by the server route before
-- the service role stores them in this bucket.
insert into storage.buckets (id, name, public) values ('verification-evidence', 'verification-evidence', false) on conflict (id) do update set public = false;

create or replace function public.review_clinician_verification(p_request_id uuid, p_decision text, p_reviewer_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_clinician_id uuid;
begin
  if p_decision not in ('verified', 'rejected') then raise exception 'Invalid verification decision'; end if;
  if p_decision = 'rejected' and nullif(trim(coalesce(p_reviewer_note, '')), '') is null then raise exception 'A reviewer note is required for rejection'; end if;
  select clinician_id into v_clinician_id from public.verification_requests where id = p_request_id and status = 'pending' for update;
  if v_clinician_id is null then raise exception 'Pending verification request not found'; end if;
  update public.verification_requests set status = p_decision, reviewer_note = nullif(trim(p_reviewer_note), ''), reviewed_at = now() where id = p_request_id;
  update public.clinicians set verification_status = p_decision where id = v_clinician_id;
end;
$$;
revoke all on function public.review_clinician_verification(uuid, text, text) from public;
grant execute on function public.review_clinician_verification(uuid, text, text) to service_role;
