ALTER TABLE public.log
  ADD COLUMN source text,
  ADD COLUMN context jsonb;

CREATE INDEX log_severity_created_idx ON public.log (severity, created_at DESC);
CREATE INDEX log_source_idx ON public.log (source);
CREATE INDEX log_user_id_idx ON public.log (user_id);
