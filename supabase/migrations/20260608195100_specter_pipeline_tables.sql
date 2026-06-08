CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  event_date timestamptz,
  platform text,
  event_type text,
  title text NOT NULL,
  summary text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_events_investigation_id_idx
  ON public.timeline_events(investigation_id);

GRANT SELECT ON public.timeline_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline events are publicly readable"
  ON public.timeline_events FOR SELECT USING (true);

CREATE POLICY "Creator can write timeline events"
  ON public.timeline_events FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.investigations i
    WHERE i.id = investigation_id AND i.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.investigations i
    WHERE i.id = investigation_id AND i.created_by = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.image_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  review_summary text,
  confidence numeric,
  review_type text,
  caution_tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS image_reviews_investigation_id_idx
  ON public.image_reviews(investigation_id);

GRANT SELECT ON public.image_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_reviews TO authenticated;
GRANT ALL ON public.image_reviews TO service_role;

ALTER TABLE public.image_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Image reviews are publicly readable"
  ON public.image_reviews FOR SELECT USING (true);

CREATE POLICY "Creator can write image reviews"
  ON public.image_reviews FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.investigations i
    WHERE i.id = investigation_id AND i.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.investigations i
    WHERE i.id = investigation_id AND i.created_by = auth.uid()
  ));

