-- Status enum
CREATE TYPE public.investigation_status AS ENUM ('pending','running','complete','failed');

-- INVESTIGATIONS
CREATE TABLE public.investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_name text NOT NULL,
  github_username text,
  x_handle text,
  linkedin_url text,
  website_url text,
  other_profile_url text,
  context text,
  notes text,
  status public.investigation_status NOT NULL DEFAULT 'pending',
  consistency_score integer,
  confidence_band text,
  classification text,
  dossier_summary text,
  dossier_full jsonb,
  progress jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX investigations_created_by_idx ON public.investigations(created_by);
CREATE INDEX investigations_created_at_idx ON public.investigations(created_at DESC);

GRANT SELECT ON public.investigations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigations TO authenticated;
GRANT ALL ON public.investigations TO service_role;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investigations are publicly readable"
  ON public.investigations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create investigations"
  ON public.investigations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update their investigations"
  ON public.investigations FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete their investigations"
  ON public.investigations FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- IDENTITIES
CREATE TABLE public.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  confidence numeric,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX identities_investigation_id_idx ON public.identities(investigation_id);
GRANT SELECT ON public.identities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identities TO authenticated;
GRANT ALL ON public.identities TO service_role;
ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Identities are publicly readable" ON public.identities FOR SELECT USING (true);
CREATE POLICY "Creator can write identities" ON public.identities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()));

-- SOURCE DOCUMENTS
CREATE TABLE public.source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  platform text,
  source_type text,
  url text NOT NULL,
  title text,
  published_at timestamptz,
  raw_text text,
  structured_json jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX source_documents_investigation_id_idx ON public.source_documents(investigation_id);
CREATE INDEX source_documents_published_at_idx ON public.source_documents(published_at);
GRANT SELECT ON public.source_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_documents TO authenticated;
GRANT ALL ON public.source_documents TO service_role;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sources are publicly readable" ON public.source_documents FOR SELECT USING (true);
CREATE POLICY "Creator can write sources" ON public.source_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()));

-- SIGNALS
CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  signal_key text NOT NULL,
  title text NOT NULL,
  summary text,
  url text,
  weight numeric,
  score numeric,
  polarity text,
  evidence_refs jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signals_investigation_id_idx ON public.signals(investigation_id);
GRANT SELECT ON public.signals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signals TO authenticated;
GRANT ALL ON public.signals TO service_role;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signals are publicly readable" ON public.signals FOR SELECT USING (true);
CREATE POLICY "Creator can write signals" ON public.signals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()));

-- CLAIMS
CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  claim_type text,
  claim_text text NOT NULL,
  source_url text,
  support_level text,
  supporting_evidence_refs jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX claims_investigation_id_idx ON public.claims(investigation_id);
GRANT SELECT ON public.claims TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims are publicly readable" ON public.claims FOR SELECT USING (true);
CREATE POLICY "Creator can write claims" ON public.claims FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()));

-- EMBEDDINGS (writing fingerprint)
CREATE TABLE public.embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE CASCADE,
  embedding_model text,
  vector_ref text,
  platform text,
  coord_x numeric,
  coord_y numeric,
  cluster_label integer,
  is_outlier boolean DEFAULT false,
  observed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX embeddings_investigation_id_idx ON public.embeddings(investigation_id);
GRANT SELECT ON public.embeddings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embeddings TO authenticated;
GRANT ALL ON public.embeddings TO service_role;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Embeddings are publicly readable" ON public.embeddings FOR SELECT USING (true);
CREATE POLICY "Creator can write embeddings" ON public.embeddings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.created_by = auth.uid()));

-- updated_at trigger for investigations
CREATE OR REPLACE FUNCTION public.specter_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER investigations_set_updated_at
  BEFORE UPDATE ON public.investigations
  FOR EACH ROW EXECUTE FUNCTION public.specter_touch_updated_at();