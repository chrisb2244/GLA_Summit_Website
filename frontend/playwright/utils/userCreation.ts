import type { Database } from '@/lib/sb_databaseModels';
import { ticketYear } from '@/app/configConstants';
import { createSupabaseAdmin } from './supabaseAdmin';
import { generateTestEmail } from './email';

// ── Script-created test users ──────────────────────────────────────────────
//
// These factories create real auth users on demand (with email_confirm so the
// OTP login flow works immediately) and perform the database insertions that
// give the user a given identity. Each returns a handle whose cleanup() undoes
// everything in dependency order. Use these instead of the static
// TEST_*_EMAIL environment-variable accounts so every test owns isolated data
// and can run in parallel without inbox or row collisions.
//
// A user always logs in through the browser via loginOnPage(handle.email).

type SummitYearEnum = Database['public']['Enums']['summit_year'];

export type TestRole =
  | 'attendee'
  | 'presenter'
  | 'copresenter'
  | 'organizer'
  | 'log_viewer';

export type SeededUser = {
  role: TestRole;
  email: string;
  userId: string;
  firstName: string;
  lastName: string;
  // Set for presenter (the user's own accepted submission) and copresenter
  // (the host submission they are attached to).
  presentationId?: string;
  presentationTitle?: string;
  // Tears down every row this handle created, in FK-dependency order, then the
  // auth user itself. Safe to call more than once.
  cleanup: () => Promise<void>;
};

type BaseUserOptions = {
  firstName?: string;
  lastName?: string;
  // Local-part prefix for the generated email; helps identify the mailbox in
  // Mailpit when debugging. A unique suffix is always appended.
  emailPrefix?: string;
};

// Delete every row that references this user without an ON DELETE CASCADE back
// to auth.users, then delete the user. Cascading rows (profiles, email_lookup,
// organizers, tickets, and presentation_presenters/accepted_presentations that
// hang off the user's own submissions) are removed automatically.
//
// Manual deletes are required for:
//  - log_viewers.user_id  → auth.users(id)   (no cascade)
//  - presentation_submissions.submitter_id → profiles(id) (no cascade; also
//    cascades presenters + accepted rows for the user's own submissions)
//  - presentation_presenters.presenter_id → profiles(id) (no cascade; covers
//    copresenter links to OTHER users' submissions)
const cleanupUser = async (userId: string) => {
  const admin = createSupabaseAdmin();
  await admin.from('log_viewers').delete().eq('user_id', userId);
  await admin
    .from('presentation_presenters')
    .delete()
    .eq('presenter_id', userId);
  await admin
    .from('presentation_submissions')
    .delete()
    .eq('submitter_id', userId);
  await admin.auth.admin.deleteUser(userId);
};

// Create an auth user with a confirmed email. The handle_new_user /
// store_email triggers seed public.profiles and public.email_lookup from the
// firstname/lastname metadata, so an attendee identity needs nothing further.
const createBaseUser = async (
  role: TestRole,
  options?: BaseUserOptions
): Promise<Omit<SeededUser, 'role'>> => {
  const admin = createSupabaseAdmin();
  const firstName = options?.firstName ?? 'Test';
  const lastName = options?.lastName ?? role;
  const email = generateTestEmail(options?.emailPrefix ?? `pw-${role}`);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { firstname: firstName, lastname: lastName }
  });
  if (error || !data?.user) {
    throw new Error(
      `Failed to create ${role} test user: ${error?.message ?? 'unknown error'}`
    );
  }
  const userId = data.user.id;

  return {
    email,
    userId,
    firstName,
    lastName,
    cleanup: () => cleanupUser(userId)
  };
};

// Insert a submission, link the given presenters, and (optionally) accept it.
// Returns the new presentation id. Caller owns cleanup via the submitter's
// handle (deleting the submission cascades presenters + accepted rows).
const insertSubmission = async (options: {
  submitterId: string;
  presenterIds: string[];
  title: string;
  year: SummitYearEnum;
  accepted: boolean;
  isSubmitted?: boolean;
}): Promise<string> => {
  const admin = createSupabaseAdmin();
  const { submitterId, presenterIds, title, year, accepted } = options;

  const { data: submission, error: submissionError } = await admin
    .from('presentation_submissions')
    .insert({
      title,
      abstract: 'Seeded abstract for an automated test presentation.',
      learning_points: 'Seeded learning points for an automated test.',
      submitter_id: submitterId,
      year,
      is_submitted: options.isSubmitted ?? true,
      presentation_type: 'full length'
    })
    .select('id')
    .single();
  if (submissionError || !submission) {
    throw new Error(
      `Failed to seed submission: ${submissionError?.message ?? 'unknown'}`
    );
  }
  const presentationId = submission.id;

  const { error: presenterError } = await admin
    .from('presentation_presenters')
    .insert(
      presenterIds.map((presenterId) => ({
        presentation_id: presentationId,
        presenter_id: presenterId
      }))
    );
  if (presenterError) {
    await admin
      .from('presentation_submissions')
      .delete()
      .eq('id', presentationId);
    throw new Error(`Failed to link presenters: ${presenterError.message}`);
  }

  if (accepted) {
    const { error: acceptError } = await admin
      .from('accepted_presentations')
      .insert({ id: presentationId, year });
    if (acceptError) {
      await admin
        .from('presentation_submissions')
        .delete()
        .eq('id', presentationId);
      throw new Error(`Failed to accept submission: ${acceptError.message}`);
    }
  }

  return presentationId;
};

export const createAttendee = async (
  options?: BaseUserOptions
): Promise<SeededUser> => {
  const base = await createBaseUser('attendee', options);
  return { role: 'attendee', ...base };
};

export const createOrganizer = async (
  options?: BaseUserOptions
): Promise<SeededUser> => {
  const base = await createBaseUser('organizer', options);
  const admin = createSupabaseAdmin();
  const { error } = await admin.from('organizers').insert({ id: base.userId });
  if (error) {
    await base.cleanup();
    throw new Error(`Failed to make organizer: ${error.message}`);
  }
  return { role: 'organizer', ...base };
};

export const createLogViewer = async (
  options?: BaseUserOptions
): Promise<SeededUser> => {
  const base = await createBaseUser('log_viewer', options);
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('log_viewers')
    .insert({ user_id: base.userId });
  if (error) {
    await base.cleanup();
    throw new Error(`Failed to make log viewer: ${error.message}`);
  }
  return { role: 'log_viewer', ...base };
};

// Create a user who is the sole presenter of one accepted presentation for the
// given year (defaults to the current ticketYear so /ticket renders the
// presenter view). To pin the rendered ticket number for screenshot
// determinism, call seedTicket(handle.userId, ...) from the test.
export const createPresenter = async (
  options?: BaseUserOptions & {
    year?: SummitYearEnum;
    title?: string;
    accepted?: boolean;
  }
): Promise<SeededUser> => {
  const base = await createBaseUser('presenter', options);
  const year = options?.year ?? ticketYear;
  const title = options?.title ?? 'Automated Presenter Talk';
  try {
    const presentationId = await insertSubmission({
      submitterId: base.userId,
      presenterIds: [base.userId],
      title,
      year,
      accepted: options?.accepted ?? true
    });
    return {
      role: 'presenter',
      ...base,
      presentationId,
      presentationTitle: title
    };
  } catch (error) {
    await base.cleanup();
    throw error;
  }
};

// Create a copresenter: a user attached as a (non-submitter) presenter on an
// accepted submission owned by a separate, auto-created host submitter. Both
// users are torn down by the returned handle's cleanup.
//
// Pass an existing submission via presentationId to attach the copresenter to a
// presentation another handle already owns; in that case the caller's other
// handle owns the submission cleanup.
export const createCopresenter = async (
  options?: BaseUserOptions & {
    year?: SummitYearEnum;
    title?: string;
    accepted?: boolean;
    presentationId?: string;
  }
): Promise<SeededUser> => {
  const base = await createBaseUser('copresenter', options);
  const year = options?.year ?? ticketYear;
  const title = options?.title ?? 'Automated Copresented Talk';

  try {
    if (options?.presentationId) {
      // Attach to a caller-owned submission; only the link is ours to clean,
      // and cleanupUser(base.userId) removes it via presenter_id.
      const admin = createSupabaseAdmin();
      const { error } = await admin.from('presentation_presenters').insert({
        presentation_id: options.presentationId,
        presenter_id: base.userId
      });
      if (error) {
        await base.cleanup();
        throw new Error(`Failed to attach copresenter: ${error.message}`);
      }
      return {
        role: 'copresenter',
        ...base,
        presentationId: options.presentationId,
        presentationTitle: title
      };
    }

    // No host supplied: create one so the copresenter has an accepted
    // presentation to belong to. The host is cleaned up alongside this handle.
    const host = await createBaseUser('attendee', {
      emailPrefix: 'pw-copresenter-host'
    });
    try {
      const presentationId = await insertSubmission({
        submitterId: host.userId,
        presenterIds: [host.userId, base.userId],
        title,
        year,
        accepted: options?.accepted ?? true
      });
      return {
        role: 'copresenter',
        ...base,
        presentationId,
        presentationTitle: title,
        cleanup: async () => {
          await base.cleanup();
          await host.cleanup();
        }
      };
    } catch (error) {
      await host.cleanup();
      throw error;
    }
  } catch (error) {
    await base.cleanup();
    throw error;
  }
};
