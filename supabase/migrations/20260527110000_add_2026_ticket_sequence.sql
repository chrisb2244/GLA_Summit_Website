-- Add the ticket sequence row for 2026.
-- The create_ticket_sequence trigger fires on INSERT and creates the underlying
-- PostgreSQL sequence (public.ticket_sequence_2026) with the schema-qualified
-- name format introduced in 20260527100000_fix_ticket_sequences.sql.
INSERT INTO public.ticket_sequences (year)
VALUES ('2026');
