alter table public.packages add column kind text not null default 'look';
alter table public.packages add column module text;

create table public.makeup_profiles (user_id uuid primary key, skin_type text, allergies text, avoid_ingredients text[] not null default '{}', products_used text[] not null default '{}', finish text, skill int not null default 2, time_minutes int not null default 10, budget text, references_text text, skin_conditions text, updated_at timestamptz not null default now());
create table public.makeup_signatures (id uuid primary key default gen_random_uuid(), user_id uuid not null, summary jsonb not null, created_at timestamptz not null default now());
create table public.confidence_kits (id uuid primary key default gen_random_uuid(), user_id uuid not null, name text not null, content jsonb not null, created_at timestamptz not null default now());

do $$ declare t text; begin
foreach t in array array['makeup_profiles','makeup_signatures','confidence_kits'] loop
  execute format('grant select, insert, update, delete on public.%I to authenticated; grant all on public.%I to service_role; alter table public.%I enable row level security;', t,t,t);
  execute format('create policy "owner all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
end loop; end $$;

create table public.product_catalog (id uuid primary key default gen_random_uuid(), category text not null, name text not null, price_min numeric not null default 0, price_max numeric not null default 0, finish text, tags text[] not null default '{}', sensitive_safe boolean not null default false, active boolean not null default true, created_at timestamptz not null default now());
grant select, insert, update, delete on public.product_catalog to authenticated; grant all on public.product_catalog to service_role;
alter table public.product_catalog enable row level security;
create policy "read active" on public.product_catalog for select to authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin insert" on public.product_catalog for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.product_catalog for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.product_catalog for delete to authenticated using (public.has_role(auth.uid(),'admin'));

insert into public.product_catalog (category, name, price_min, price_max, finish, tags, sensitive_safe) values
('Preparação','Hidratante leve / gel',25,120,'natural','{pele oleosa,calor}',true),
('Preparação','Protetor solar com cor',40,180,'natural','{rápido,dia}',true),
('Preparação','Primer matificante',35,200,'matte','{calor,foto}',false),
('Pele','Base líquida de cobertura leve',30,250,'natural','{iniciante}',false),
('Pele','Base de média cobertura',45,320,'acetinado','{evento,foto}',false),
('Pele','BB/CC cream',30,160,'natural','{5 minutos,viagem}',true),
('Pele','Corretivo cremoso',25,180,'natural','{olheiras}',false),
('Pele','Pó translúcido',25,200,'matte','{calor,câmera}',true),
('Bochechas','Blush em bastão / creme',25,160,'luminoso','{multiuso,viagem,iniciante}',false),
('Bochechas','Blush em pó',20,180,'matte','{evento}',false),
('Bochechas','Iluminador',25,200,'luminoso','{noite,foto}',false),
('Bochechas','Bronzer / contorno suave',30,200,'matte','{evento}',false),
('Sobrancelhas','Gel fixador',20,120,'natural','{5 minutos,iniciante}',true),
('Sobrancelhas','Lápis de sobrancelha',15,140,'natural','{definição}',false),
('Olhos','Máscara de cílios',20,180,'natural','{essencial}',false),
('Olhos','Máscara para olhos sensíveis',30,160,'natural','{pele sensível}',true),
('Olhos','Sombra em bastão',25,150,'acetinado','{iniciante,viagem}',false),
('Olhos','Paleta neutra',40,350,'matte','{30 minutos,evento}',false),
('Olhos','Delineador em caneta',20,150,'intenso','{noite}',false),
('Lábios','Lip balm com cor',15,90,'luminoso','{5 minutos,pele sensível}',true),
('Lábios','Batom cremoso',20,200,'acetinado','{entrevista,foto}',false),
('Lábios','Batom líquido matte',25,180,'matte','{calor,longa duração}',false),
('Lábios','Gloss',18,150,'luminoso','{noite}',false),
('Finalização','Spray fixador',30,220,'natural','{calor,evento}',false),
('Ferramentas','Esponja de maquiagem',10,80,null,'{iniciante}',true),
('Ferramentas','Pincel kabuki / pó',20,150,null,'{essencial}',true),
('Remoção','Água micelar / demaquilante suave',20,120,null,'{pele sensível,essencial}',true);
