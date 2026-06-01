-- Create tables for tickets and ticket sequences
CREATE TABLE public.ticket_sequences (
    year public.summit_year PRIMARY KEY,
    name text
);
ALTER TABLE public.ticket_sequences ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tickets (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ticket_number numeric not null,
    year public.summit_year NOT NULL REFERENCES public.ticket_sequences(year),
    created_at timestamptz not null default now(),
    PRIMARY KEY (user_id, year)
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
-- Add an index for ticket numbers by year, to allow a unique constraint
CREATE UNIQUE INDEX tickets_year_ticket_number_key
  ON public.tickets
  USING btree (year, ticket_number);
ALTER TABLE public.tickets
  ADD CONSTRAINT "tickets_year_ticket_number_key"
  UNIQUE
  USING INDEX "tickets_year_ticket_number_key";

-- Add policies to control access to the ticketing tables
CREATE POLICY "Insert own ticket"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Select own ticket"
  ON "public"."tickets"
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Create a function to generate new sequences as required
-- Use a trigger to set this
CREATE OR REPLACE FUNCTION public.create_ticket_sequence()
 RETURNS trigger
 LANGUAGE plpgsql
  AS $$
  BEGIN
    IF NEW.name IS NULL THEN
      NEW.name := ('ticket_sequence_' || NEW.year);
    END IF;
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s', NEW.name);
    RETURN NEW;
  END
  $$;
-- Set a trigger
CREATE TRIGGER create_ticket_sequence_trigger
  BEFORE INSERT ON public.ticket_sequences
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_sequence();

-- Create a function to obtain the next ticket number
-- By using this in a trigger, multiple sequences can be used for the tickets table
-- without requiring client-side handling of numbers.
CREATE OR REPLACE FUNCTION public.calculate_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
  AS $$
  BEGIN
    NEW.ticket_number := nextval('ticket_sequence_' || NEW.year);
    RETURN NEW;
  END
  $$;
-- Set a trigger
CREATE TRIGGER calculate_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ticket_number();
