CREATE EXTENSION IF NOT EXISTS pg_cron;

ALTER TABLE public.log ADD COLUMN expires_at timestamptz DEFAULT NULL;

-- Partial index: only index rows that actually expire
CREATE INDEX log_expires_at_idx ON public.log (expires_at)
  WHERE expires_at IS NOT NULL;

-- Daily cleanup at 3am UTC; cron.schedule upserts by job name on conflict
SELECT cron.schedule(
  'delete-expired-logs',
  '0 3 * * *',
  $$DELETE FROM public.log WHERE expires_at IS NOT NULL AND expires_at < NOW()$$
);
