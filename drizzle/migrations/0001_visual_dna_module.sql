alter table public.consents add column dna_paused boolean not null default false;
alter table public.consents add column module_permissions jsonb not null default '{"makeup":true,"hair":true,"clothing":true,"tattoo":true,"professional":true}';
alter table public.visual_dna add column summary jsonb;
alter table public.visual_dna add column signals_since_review int not null default 0;
alter table public.feedback add column module text;

create table public.dna_versions (id uuid primary key default gen_random_uuid(), user_id uuid not null, summary jsonb not null, source text not null default 'synthesis', created_at timestamptz not null default now());
create table public.dna_corrections (id uuid primary key default gen_random_uuid(), user_id uuid not null, field text not null, original text, correction text, created_at timestamptz not null default now());
create table public.preferences (user_id uuid primary key, colors_liked text[] not null default '{}', colors_rejected text[] not null default '{}', styles_liked text[] not null default '{}', styles_rejected text[] not null default '{}', body_highlight text, body_preserve text, permanent_tolerance int not null default 2, works_in_life text, theory_only text, professional_goals text, social_goals text, updated_at timestamptz not null default now());

do $$ declare t text; begin
foreach t in array array['dna_versions','dna_corrections','preferences'] loop
  execute format('grant select, insert, update, delete on public.%I to authenticated; grant all on public.%I to service_role; alter table public.%I enable row level security;', t,t,t);
  execute format('create policy "owner all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
end loop; end $$;
