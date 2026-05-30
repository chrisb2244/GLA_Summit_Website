'use server';

import { createServerClient } from '@/lib/supabaseServer';
import { joinNames, logToDb } from '@/lib/utils';
import type { OrganizerVote } from '@/lib/databaseModels';
import { revalidatePath } from 'next/cache';
import JSZip from 'jszip';

export type CastVoteResult = { success: boolean; error?: string };

/**
 * Record (or clear) the current organizer's vote on a submission.
 *
 * `vote === null` clears the vote (back to "not voted"); any other value is an
 * upsert, which is also how an organizer changes their existing vote. Voting is
 * only permitted while the submission is still under review — once it has been
 * accepted or declined the outcome is locked (also enforced by RLS). Acceptance
 * and decline themselves are handled by the `submission_votes` database trigger;
 * this action only writes the vote.
 */
export const castVote = async (
  presentationId: string,
  vote: OrganizerVote | null
): Promise<CastVoteResult> => {
  const supabase = await createServerClient();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) {
    return { success: false, error: 'You must be signed in to vote.' };
  }

  const isOrganizer =
    ((
      await supabase
        .from('organizers')
        .select('id', { head: true, count: 'exact' })
        .eq('id', user.id)
    ).count ?? 0) !== 0;
  if (!isOrganizer) {
    await logToDb('error', 'Unauthorized vote attempt', 'review-submissions/vote', {
      userId: user.id,
      context: { presentationId }
    });
    return { success: false, error: 'Only organizers can vote.' };
  }

  // Voting is locked once an outcome exists. RLS enforces this too, but fail
  // fast with a clear message rather than surfacing an RLS rejection.
  const [{ count: acceptedCount }, { count: rejectedCount }] = await Promise.all([
    supabase
      .from('accepted_presentations')
      .select('id', { head: true, count: 'exact' })
      .eq('id', presentationId),
    supabase
      .from('rejected_presentations')
      .select('id', { head: true, count: 'exact' })
      .eq('id', presentationId)
  ]);
  if ((acceptedCount ?? 0) !== 0 || (rejectedCount ?? 0) !== 0) {
    return {
      success: false,
      error: 'This submission is no longer under review.'
    };
  }

  const { error } =
    vote === null
      ? await supabase
          .from('submission_votes')
          .delete()
          .eq('presentation_id', presentationId)
          .eq('organizer_id', user.id)
      : await supabase
          .from('submission_votes')
          .upsert({
            presentation_id: presentationId,
            organizer_id: user.id,
            vote,
            updated_at: new Date().toISOString()
          });

  if (error) {
    await logToDb('error', 'Failed to record vote', 'review-submissions/vote', {
      userId: user.id,
      context: { presentationId, vote, message: error.message, code: error.code }
    });
    return { success: false, error: 'Could not record your vote.' };
  }

  revalidatePath('/review-submissions');
  return { success: true };
};

export const downloadSharableSubmissionContent = async (
  presentationId: string
) => {
  const supabase = await createServerClient();
  const { user } = (await supabase.auth.getUser()).data;
  const isOrganizer = user
    ? ((await supabase
        .from('organizers')
        .select('id', { head: true, count: 'exact' })
        .eq('id', user.id)
      ).count ?? 0) !== 0
    : false;
  if (!isOrganizer) {
    await logToDb('error', 'Unauthorized download attempt', 'review-submissions/download', {
      userId: user?.id
    });
    return;
  }

  const { data: presentation, error } = await supabase
    .from('presentation_submissions')
    .select('title, abstract, presentation_type, submitter_id')
    .eq('id', presentationId)
    .single();
  if (error) {
    await logToDb('error', 'Failed to fetch presentation content for download', 'review-submissions/download', {
      userId: user?.id,
      context: { presentationId, message: error.message, code: error.code }
    });
    return;
  }

  const { data: presenterData, error: presentersError } = await supabase
    .from('presentation_presenters')
    .select('presenter_id')
    .eq('presentation_id', presentationId);
  if (presentersError) {
    await logToDb('error', 'Failed to fetch presenters for download', 'review-submissions/download', {
      userId: user?.id,
      context: { presentationId, message: presentersError.message, code: presentersError.code }
    });
    return;
  }

  const presenterIds = presenterData.map((p) => p.presenter_id);
  const { data: presenters, error: presentersError2 } = await supabase
    .from('profiles')
    .select('id, firstname, lastname, avatar_url, bio')
    .in('id', presenterIds)
    .then((res) => {
      // If error, return the original response
      if (!res.data) {
        return res;
      }
      // Find the submitter and place them at the top of the list
      const submitterIdx = res.data.findIndex(
        (presenter) => presenter.id === presentation.submitter_id
      );
      return {
        ...res,
        data: [
          res.data[submitterIdx],
          ...res.data.slice(0, submitterIdx),
          ...res.data.slice(submitterIdx + 1)
        ]
      };
    });
  if (presentersError2) {
    await logToDb('error', 'Failed to fetch presenter profiles for download', 'review-submissions/download', {
      userId: user?.id,
      context: { presentationId, message: presentersError2.message, code: presentersError2.code }
    });
    return;
  }

  const { data: presenterEmails, error: emailsError } = await supabase
    .from('email_lookup')
    .select('*')
    .in('id', presenterIds);

  if (emailsError) {
    await logToDb('error', 'Failed to fetch presenter emails for download', 'review-submissions/download', {
      userId: user?.id,
      context: { presentationId, message: emailsError.message, code: emailsError.code }
    });
    return;
  }

  const orderedEmails = presenters.map(({ id }) => {
    const email = presenterEmails.find((email) => email.id === id);
    return email ? email.email : '';
  });

  const content =
    'Name:\n' +
    presenters.map((p) => joinNames(p)).join('\n') +
    '\n\n' +
    'Email:\n' +
    orderedEmails.join('\n') +
    '\n\n' +
    'Title:\n' +
    presentation.title +
    '\n\n' +
    'Abstract:\n' +
    presentation.abstract;

  const zip = new JSZip();
  const firstPresenterName = joinNames(presenters[0]);
  const rawFileName = `${firstPresenterName}_${presentation.title}`;
  const safeFileName = rawFileName
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
  zip.file(`${safeFileName}.txt`, content);
  const filePromises = Promise.all(
    presenters.map(async (p) => {
      if (!p.avatar_url) return;
      const imgBlob = await supabase.storage
        .from('avatars')
        .download(p.avatar_url)
        .then(({ data, error }) => {
          if (error) {
            // Can't get the image for some reason
            return null;
          }
          return data;
        });
      if (!imgBlob) return;
      try {
        const [expectedImageString, extn] = imgBlob.type.split('/');
        if (expectedImageString !== 'image') {
          console.error('Image is not of type image/*');
          return;
        }
        zip.file(
          `${p.firstname.trim()}_${p.lastname.trim()}.${extn}`,
          imgBlob.arrayBuffer(), // Promise is accepted here, no need to await
          {
            base64: true
          }
        );
      } catch (e) {
        console.error('Error adding image to zip:', e);
      }
    })
  );
  // Wait for all images to be added to the zip
  await filePromises;
  // Generate the zip file
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  await supabase.from('review_download_information').upsert({
    presentation_id: presentationId,
    viewer_id: user?.id,
    last_downloaded: new Date().toISOString()
  });

  return zipBase64;
};
