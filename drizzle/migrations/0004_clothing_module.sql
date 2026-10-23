CREATE TABLE public.style_profiles (
  user_id uuid PRIMARY KEY,
  desired_image text, profession text, routine text, budget text, climate text, city text, dress_code text,
  silhouettes text, avoided_pieces text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.style_profiles TO authenticated;
GRANT ALL ON public.style_profiles TO service_role;
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all" ON public.style_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL, name text NOT NULL, color text, fabric text, formality integer NOT NULL DEFAULT 3,
  season text, notes text, photo_path text, times_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wardrobe_items TO authenticated;
GRANT ALL ON public.wardrobe_items TO service_role;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all" ON public.wardrobe_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.style_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  content jsonb NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.style_analyses TO authenticated;
GRANT ALL ON public.style_analyses TO service_role;
ALTER TABLE public.style_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all" ON public.style_analyses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.dress_code_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion text NOT NULL, rule text NOT NULL,
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dress_code_rules TO authenticated;
GRANT ALL ON public.dress_code_rules TO service_role;
ALTER TABLE public.dress_code_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active" ON public.dress_code_rules FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert" ON public.dress_code_rules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update" ON public.dress_code_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete" ON public.dress_code_rules FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.dress_code_rules (occasion, rule) VALUES
('Trabalho','Esporte fino corporativo: peças estruturadas, cores sóbrias, calçado fechado; adapte ao código da empresa.'),
('Entrevista','Um degrau acima do dress code da empresa; conforto para não se distrair.'),
('Casamento','Evite branco/off-white salvo pedido dos noivos; respeite o traje do convite e o horário.'),
('Faculdade','Conforto e praticidade; camadas para salas com ar-condicionado.'),
('Encontro','Algo em que a pessoa se sinta ela mesma; conforto para se mover.'),
('Viagem','Peças multiuso que combinam entre si; calçado confortável já amaciado.'),
('Festa','Pode ousar mais em brilho, cor e textura; pense em dança e duração.'),
('Fim de semana','Casual e confortável; ótimo momento para testar ideias novas.'),
('Reunião importante','Peças que transmitem segurança e que você já testou antes.');