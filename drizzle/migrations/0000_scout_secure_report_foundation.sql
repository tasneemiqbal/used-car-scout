CREATE TABLE public.scout_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 car jsonb NOT NULL,
 report jsonb NOT NULL,
 schema_version integer NOT NULL DEFAULT 1
);
GRANT ALL ON public.scout_reports TO service_role;
REVOKE ALL ON public.scout_reports FROM anon, authenticated;
ALTER TABLE public.scout_reports ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.scout_reports IS 'Sanitized capability-addressed reports. No browser grants or policies; exact lookup only through validated server operations.';
CREATE TABLE public.scout_vehicle_cache (
 cache_key text PRIMARY KEY,
 source text NOT NULL,
 fetched_at timestamptz NOT NULL DEFAULT now(),
 evidence jsonb NOT NULL
);
GRANT ALL ON public.scout_vehicle_cache TO service_role;
REVOKE ALL ON public.scout_vehicle_cache FROM anon, authenticated;
ALTER TABLE public.scout_vehicle_cache ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.scout_vehicle_cache IS 'Server-only government vehicle evidence. No raw listings, seller data, screenshots, chat history, or email addresses.';