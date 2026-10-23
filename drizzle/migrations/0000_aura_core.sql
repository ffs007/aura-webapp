create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.consents (user_id uuid primary key, terms_version text not null default 'v1', accepted_at timestamptz not null default now(), photo_processing boolean not null default false, personalization boolean not null default false, reminders boolean not null default false, updated_at timestamptz not null default now());
create table public.visual_profiles (user_id uuid primary key, data jsonb not null default '{}', mode text not null default 'quick', completed boolean not null default false, updated_at timestamptz not null default now());
create table public.photos (id uuid primary key default gen_random_uuid(), user_id uuid not null, path text not null, kind text not null default 'reference', created_at timestamptz not null default now());
create table public.packages (id uuid primary key default gen_random_uuid(), user_id uuid not null, batch_id uuid not null, entry_mode text not null, emotional_mode text, context jsonb not null default '{}', content jsonb not null, status text not null default 'new', note text, beautiful_not_practical boolean not null default false, created_at timestamptz not null default now());
create table public.collections (id uuid primary key default gen_random_uuid(), user_id uuid not null, name text not null, package_ids uuid[] not null default '{}', created_at timestamptz not null default now());
create table public.feedback (id uuid primary key default gen_random_uuid(), user_id uuid not null, package_id uuid, rating int, comfort int, reflection text, created_at timestamptz not null default now());
create table public.visual_dna (user_id uuid primary key, signals jsonb not null default '[]', updated_at timestamptz not null default now());
create table public.reminders (id uuid primary key default gen_random_uuid(), user_id uuid not null, title text not null, due_at timestamptz not null, done boolean not null default false, created_at timestamptz not null default now());
create table public.audit_events (id uuid primary key default gen_random_uuid(), user_id uuid not null, event text not null, meta jsonb not null default '{}', created_at timestamptz not null default now());
create table public.safety_config (id int primary key default 1, blocked_terms text[] not null default '{}', updated_at timestamptz not null default now());
insert into public.safety_config(id, blocked_terms) values (1, array['ugly','fix your flaws','unattractive','fat','too old']);

do $$ declare t text; begin
foreach t in array array['consents','visual_profiles','photos','packages','collections','feedback','visual_dna','reminders'] loop
  execute format('grant select, insert, update, delete on public.%I to authenticated; grant all on public.%I to service_role; alter table public.%I enable row level security;', t,t,t);
  execute format('create policy "owner all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
end loop; end $$;

grant select, insert on public.audit_events to authenticated; grant all on public.audit_events to service_role;
alter table public.audit_events enable row level security;
create policy "own insert" on public.audit_events for insert to authenticated with check (user_id = auth.uid());
create policy "own or admin read" on public.audit_events for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

grant select, update on public.safety_config to authenticated; grant all on public.safety_config to service_role;
alter table public.safety_config enable row level security;
create policy "read" on public.safety_config for select to authenticated using (true);
create policy "admin update" on public.safety_config for update to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "admin read consents" on public.consents for select to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "own photos read" on storage.objects for select to authenticated using (bucket_id='user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos insert" on storage.objects for insert to authenticated with check (bucket_id='user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos delete" on storage.objects for delete to authenticated using (bucket_id='user-photos' and (storage.foldername(name))[1] = auth.uid()::text);
