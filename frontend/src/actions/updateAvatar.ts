'use server';

import { cacheTagForPerson } from '@/lib/supabase/cacheTags';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { fullUrlToIconUrl, logToDb } from '@/lib/utils';
import { updateTag } from 'next/cache';
import { after } from 'next/server';
import { generateAvatarIcon } from './generateAvatarIcon';

export type CommitAvatarResult =
  | { success: true; iconPath: string }
  | { success: false; error: string };

/** Shown whenever the upload failed for reasons the user cannot act on. */
const GENERIC_FAILURE =
  'Something went wrong saving your photo. Please try again.';

/**
 * Commits a freshly-uploaded avatar file to the signed-in user's profile.
 *
 * The image itself is uploaded straight from the browser to Supabase storage
 * (the owner-scoped storage policies cover that write, and it keeps image
 * bodies out of the size-limited Server Action request). This action does
 * everything that has to happen server-side afterwards:
 *
 *  - generates the 128px icon the user menu renders,
 *  - points `profiles.avatar_url` at the new file,
 *  - deletes the files the new avatar replaces,
 *  - expires the `profile:<id>` cache tag.
 *
 * That last step is why this is a Server Action rather than the client-side
 * write it replaces. `profiles.avatar_url` used to be updated directly by the
 * browser Supabase client, which no Next.js cache invalidation can observe, so
 * every cached entry holding the old avatar URL (presenter pages, the presenter
 * list, presentation pages, the user menu) kept serving it until an unrelated
 * profile edit happened to expire the tag.
 *
 * `updateTag` rather than `revalidateTag`: the user is looking at the result of
 * their own change, so the next read should wait for fresh data instead of
 * serving the stale entry once more.
 *
 * Always resolves, never rejects: the caller deletes the just-uploaded file on
 * a failed result, and a rejected action would skip that cleanup and surface
 * Next's opaque production error digest instead of a usable message.
 */
export const commitAvatarUpdate = async (
  remoteFilePath: string
): Promise<CommitAvatarResult> => {
  try {
    return await commitAvatarUpdateOrThrow(remoteFilePath);
  } catch (e) {
    // Last-resort net for anything unforeseen; the specific failures below all
    // return a result rather than throwing. The user id is the prefix of
    // remoteFilePath, so it stays recoverable from the log context.
    after(() =>
      logToDb(
        'error',
        'Avatar update failed unexpectedly',
        'actions/updateAvatar',
        {
          context: {
            remoteFilePath,
            message: e instanceof Error ? e.message : String(e)
          }
        }
      )
    );
    return { success: false, error: GENERIC_FAILURE };
  }
};

const commitAvatarUpdateOrThrow = async (
  remoteFilePath: string
): Promise<CommitAvatarResult> => {
  const supabase = await createServerActionClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || userData.user == null) {
    return {
      success: false,
      error: 'You must be logged in to change your profile image.'
    };
  }
  const userId = userData.user.id;

  // Uploads are named `<userId>_<random>.<ext>` by the browser; anything else
  // is not a file this user just uploaded and must not become their avatar.
  if (!remoteFilePath.startsWith(`${userId}_`)) {
    return { success: false, error: 'Invalid image path.' };
  }

  // Read the replaced path from the database
  const { data: profile, error: profileReadError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();
  if (profileReadError) {
    after(() =>
      logToDb(
        'error',
        'Could not read the profile being updated',
        'actions/updateAvatar',
        {
          userId,
          context: {
            remoteFilePath,
            message: profileReadError.message,
            code: profileReadError.code
          }
        }
      )
    );
    return { success: false, error: 'Unable to read your profile information' };
  }
  const previousFilePath = profile.avatar_url;

  // Generate the icon *before* committing avatar_url: the user menu derives its
  // src from avatar_url with no fallback, so a profile pointing at a file whose
  // icon failed to generate would render a broken image.
  const iconResult = await generateAvatarIcon(remoteFilePath);
  if (!iconResult.ok) {
    after(() =>
      logToDb(
        'error',
        'Avatar icon generation failed',
        'actions/updateAvatar',
        {
          userId,
          context: {
            remoteFilePath,
            reason: iconResult.reason,
            message: iconResult.message
          }
        }
      )
    );
    return {
      success: false,
      // Decode errors might be fixable by choosing a different image
      // Storage errors are likely retryable, but the user can't do much about them
      error:
        iconResult.reason === 'decode'
          ? "That image couldn't be read. Please try a JPEG, PNG or WebP file."
          : GENERIC_FAILURE
    };
  }
  const iconPath = iconResult.iconPath;

  const adminClient = createAdminClient();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: remoteFilePath })
    .eq('id', userId);
  if (updateError) {
    // The profile still points at the previous avatar and nothing has been
    // deleted, so only the icon just generated is orphaned.
    await adminClient.storage.from('avatars').remove([iconPath]);
    after(() =>
      logToDb(
        'error',
        'Could not point the profile at the new avatar',
        'actions/updateAvatar',
        {
          userId,
          context: {
            remoteFilePath,
            message: updateError.message,
            code: updateError.code
          }
        }
      )
    );
    return {
      success: false,
      error:
        'Failed to update your profile with the new image. If this happens repeatedly, please contact web@glasummit.org'
    };
  }

  // Expire every cached entry that embeds this person's avatar URL.
  updateTag(cacheTagForPerson(userId));

  // Clean up what the new avatar replaced. Both deletions go through the admin
  // client: icons are written by the admin client and owned by no user, so no
  // owner-scoped storage policy will ever remove them. A legacy avatar may
  // predate icon generation and have no icon to delete, which is a no-op.
  if (previousFilePath != null && previousFilePath !== remoteFilePath) {
    const { error: removeError } = await adminClient.storage
      .from('avatars')
      .remove([previousFilePath, fullUrlToIconUrl(previousFilePath)]);
    if (removeError) {
      // Orphaned storage objects are not worth failing a completed update over.
      after(() =>
        logToDb(
          'info',
          'Failed to remove replaced avatar files',
          'actions/updateAvatar',
          {
            userId,
            context: { previousFilePath, message: removeError.message }
          }
        )
      );
    }
  }

  return { success: true, iconPath };
};
