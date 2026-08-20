-- Evidence remains private. Uploads are validated by the server route before
-- the service role stores them in this bucket.
insert into storage.buckets (id, name, public) values ('verification-evidence', 'verification-evidence', false) on conflict (id) do update set public = false;
