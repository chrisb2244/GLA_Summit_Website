import type { Database } from '@/lib/sb_databaseModels';
import { ticketYear } from '@/app/configConstants';
import { createSupabaseAdmin } from './supabaseAdmin';

type SummitYearEnum = Database['public']['Enums']['summit_year'];

// Give a user a ticket row with a fixed number, overwriting the sequence value
// assigned by the calculate_ticket_number trigger. A deterministic number keeps
// the rendered ticket image stable for screenshot regression tests:
// get_or_create_ticket returns this pre-existing row on /ticket instead of
// allocating a non-deterministic sequence value.
//
// Call this explicitly from the (few) tests that screenshot the ticket; most
// tests do not need a pinned number. The row is removed when the user is
// deleted (tickets.user_id cascades from the user), so no extra cleanup is
// required beyond the owning user's cleanup().
export const seedTicket = async (
  userId: string,
  ticketNumber: number,
  year: SummitYearEnum = ticketYear
) => {
  const admin = createSupabaseAdmin();
  const { error: insertError } = await admin
    .from('tickets')
    .insert({ user_id: userId, year, ticket_number: 0 });
  if (insertError) {
    throw new Error(`Failed to seed ticket row: ${insertError.message}`);
  }
  const { error: updateError } = await admin
    .from('tickets')
    .update({ ticket_number: ticketNumber })
    .eq('user_id', userId)
    .eq('year', year);
  if (updateError) {
    throw new Error(`Failed to fix ticket number: ${updateError.message}`);
  }
};
