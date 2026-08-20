-- Attachments are private and are uploaded only by the server after it checks
-- the clinician, active consent grant, file type, and file size.
insert into storage.buckets (id, name, public) values ('medical-records', 'medical-records', false) on conflict (id) do update set public = false;
