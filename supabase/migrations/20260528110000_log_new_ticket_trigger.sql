-- Log to the application log table whenever a new ticket row is inserted.
--
-- This replaces the application-layer logToDb('info', 'Ticket issued', ...)
-- call that previously fired on every visit to /ticket (including repeat visits
-- where get_or_create_ticket returns an existing row).  Moving the log write
-- here means it fires exactly once per INSERT, atomically within the same
-- transaction as the ticket creation, with no TOCTOU race condition.
--
-- Execution context:
--   calculate_ticket_number_trigger is BEFORE INSERT, so by the time this
--   AFTER INSERT trigger fires, NEW.ticket_number holds the real sequence value
--   (not the placeholder 0 passed by the application).
--
-- SECURITY DEFINER is required because the log table has RLS enabled with no
-- INSERT policy for regular users; application writes normally go through the
-- service-role admin client.  The function owner (postgres) bypasses RLS.

CREATE OR REPLACE FUNCTION public.log_new_ticket()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.log (severity, message, source, user_id, context, expires_at)
  VALUES (
    'info',
    'New ticket created',
    'ticket/issue',
    NEW.user_id,
    jsonb_build_object('ticketNumber', NEW.ticket_number),
    NOW() + INTERVAL '180 days'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_ticket_created
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_new_ticket();

-- Trigger functions cannot be invoked directly (RETURNS trigger enforces this),
-- but revoke PUBLIC execute anyway to match the security posture of other
-- SECURITY DEFINER functions in this schema and prevent attachment to new
-- triggers by any role that somehow gains TRIGGER privilege on a table.
REVOKE ALL ON FUNCTION public.log_new_ticket() FROM PUBLIC;
