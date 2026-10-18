CREATE TABLE public.scout_usage_windows (
 visitor_id uuid NOT NULL,
 operation text NOT NULL CHECK (operation IN ('check', 'message')),
 window_started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 used integer NOT NULL DEFAULT 0 CHECK (used >= 0),
 PRIMARY KEY (visitor_id, operation)
);
GRANT ALL ON public.scout_usage_windows TO service_role;
REVOKE ALL ON public.scout_usage_windows FROM anon, authenticated;
ALTER TABLE public.scout_usage_windows ENABLE ROW LEVEL SECURITY;
CREATE INDEX scout_usage_windows_expiry ON public.scout_usage_windows (window_started_at);
COMMENT ON TABLE public.scout_usage_windows IS 'Anonymous signed-cookie usage counters only; no IP addresses, listings, chat content or user identity. Old counters pruned during requests, without scheduled polling.';
CREATE FUNCTION public.scout_consume_usage(p_visitor_id uuid, p_operation text)
RETURNS TABLE (allowed boolean, remaining integer, resets_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
 v_limit integer;
 v_now timestamptz := clock_timestamp();
 v_used integer;
 v_started timestamptz;
BEGIN
 IF p_visitor_id IS NULL THEN RAISE EXCEPTION 'Visitor identity required'; END IF;
 CASE p_operation
  WHEN 'check' THEN v_limit := 10;
  WHEN 'message' THEN v_limit := 40;
  ELSE RAISE EXCEPTION 'Unsupported Scout operation';
 END CASE;
 DELETE FROM public.scout_usage_windows
 WHERE (visitor_id, operation) IN (
  SELECT w.visitor_id, w.operation FROM public.scout_usage_windows w
  WHERE w.window_started_at < v_now - interval '48 hours'
  ORDER BY w.window_started_at LIMIT 100
 );
 INSERT INTO public.scout_usage_windows AS w (visitor_id, operation, window_started_at, used)
 VALUES (p_visitor_id, p_operation, v_now, 1)
 ON CONFLICT (visitor_id, operation) DO UPDATE SET
  used = CASE WHEN w.window_started_at <= v_now - interval '1 hour' THEN 1 ELSE w.used + 1 END,
  window_started_at = CASE WHEN w.window_started_at <= v_now - interval '1 hour' THEN v_now ELSE w.window_started_at END
 WHERE w.window_started_at <= v_now - interval '1 hour' OR w.used < v_limit
 RETURNING w.used, w.window_started_at INTO v_used, v_started;
 IF FOUND THEN
  RETURN QUERY SELECT true, v_limit - v_used, v_started + interval '1 hour';
 ELSE
  SELECT w.used, w.window_started_at INTO v_used, v_started FROM public.scout_usage_windows w
  WHERE w.visitor_id = p_visitor_id AND w.operation = p_operation;
  RETURN QUERY SELECT false, GREATEST(0, v_limit - v_used), v_started + interval '1 hour';
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.scout_consume_usage(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scout_consume_usage(uuid, text) TO service_role;