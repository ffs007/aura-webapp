CREATE TABLE public.hair_profiles (
  user_id uuid PRIMARY KEY,
  texture text, current_length text, chemical_history text, heat_damage text, bleaching_history text,
  scalp_sensitivity text, maintenance_tolerance integer NOT NULL DEFAULT 2, skill integer NOT NULL DEFAULT 2,
  desired_image text, grooming_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hair_profiles TO authenticated;
GRANT ALL ON public.hair_profiles TO service_role;
ALTER TABLE public.hair_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all" ON public.hair_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.hair_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  every_days integer NOT NULL DEFAULT 14,
  next_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hair_alerts TO authenticated;
GRANT ALL ON public.hair_alerts TO service_role;
ALTER TABLE public.hair_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all" ON public.hair_alerts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.hair_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, name text NOT NULL, description text,
  price_min numeric NOT NULL DEFAULT 0, price_max numeric NOT NULL DEFAULT 0,
  maintenance text NOT NULL DEFAULT 'medium', chemical boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hair_catalog TO authenticated;
GRANT ALL ON public.hair_catalog TO service_role;
ALTER TABLE public.hair_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active" ON public.hair_catalog FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert" ON public.hair_catalog FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update" ON public.hair_catalog FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete" ON public.hair_catalog FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.hair_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition text NOT NULL, warning text NOT NULL,
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hair_rules TO authenticated;
GRANT ALL ON public.hair_rules TO service_role;
ALTER TABLE public.hair_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active" ON public.hair_rules FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert" ON public.hair_rules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update" ON public.hair_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete" ON public.hair_rules FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.hair_catalog (category, name, description, price_min, price_max, maintenance, chemical) VALUES
('corte','Aparar pontas','Manutenção do comprimento atual',40,150,'low',false),
('corte','Corte em camadas','Movimento e leveza',80,300,'medium',false),
('corte','Bob / chanel','Corte na altura do queixo',80,300,'medium',false),
('corte','Pixie','Curto com textura',70,250,'high',false),
('corte','Big chop','Corte da parte com química na transição',60,250,'low',false),
('corte','Degradê (fade)','Laterais curtas graduadas',35,120,'high',false),
('cor','Tonalização','Ajuste de tom sem clarear, semipermanente',80,300,'medium',true),
('cor','Coloração permanente','Mudança de tom com raiz visível no crescimento',120,400,'high',true),
('cor','Mechas / luzes','Clareamento em mechas',250,900,'high',true),
('cor','Morena iluminada / balayage','Clareamento degradê, crescimento suave',300,1200,'medium',true),
('cor','Descoloração global','Clareamento total — alto risco de dano',400,1500,'high',true),
('tratamento','Hidratação','Reposição de água',50,200,'low',false),
('tratamento','Nutrição','Reposição de lipídios',60,220,'low',false),
('tratamento','Reconstrução','Reposição de massa — com moderação',80,300,'low',false),
('finalizacao','Fitagem / dedoliss','Definição de cachos em casa',0,0,'medium',false),
('finalizacao','Escova','Alisamento térmico temporário',50,150,'medium',false);

INSERT INTO public.hair_rules (condition, warning) VALUES
('descoloração anterior + nova química','Risco alto de quebra: exige teste de mecha e validação profissional.'),
('couro cabeludo sensível + coloração','Faça teste de toque 48h antes e consulte dermatologista se houver reação.'),
('dano por calor alto','Priorize recuperação e cronograma antes de qualquer química.'),
('alisamento/progressiva + coloração','Intervalo mínimo e avaliação profissional entre procedimentos.'),
('transição capilar','Ofereça caminho gradual (cortes progressivos) antes do big chop.');