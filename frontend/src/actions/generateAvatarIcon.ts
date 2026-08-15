import 'server-only';
import { createAdminClient } from '@/lib/supabaseClient';
import { fullUrlToIconUrl } from '@/lib/utils';
import sharp from 'sharp';

export type AvatarIconResult =
  | { ok: true; iconPath: string }
  | {
      ok: false;
      /**
       * `decode` means the uploaded file itself is unusable, so the user has to
       * pick a different one; `storage` means the file is fine and the failure
       * was on our side, so retrying the same file is the right advice.
       */
      reason: 'decode' | 'storage';
      message: string;
    };

/**
 * Generates a 128x128 webp icon from the full-size avatar at `remoteFilePath`
 * and uploads it to storage. Uses the admin client so it can be called for any
 * user's avatar without requiring the caller to be authenticated as that user.
 *
 * Server-only, deliberately *not* a Server Action: the admin client bypasses
 * RLS, so this must always run behind a caller that has already authorised the
 * user (see `commitAvatarUpdate`). Exporting it from a `'use server'` module
 * would publish it as an unauthenticated endpoint accepting an arbitrary
 * storage path.
 *
 * Never throws: every failure comes back as `{ ok: false }` carrying the reason,
 * so the caller can both choose accurate wording and clean up the upload.
 */
export async function generateAvatarIcon(
  remoteFilePath: string
): Promise<AvatarIconResult> {
  const adminClient = createAdminClient();

  const { data: fullSizeImage, error: downloadError } =
    await adminClient.storage.from('avatars').download(remoteFilePath);
  if (downloadError || !fullSizeImage) {
    return {
      ok: false,
      reason: 'storage',
      message:
        downloadError?.message ?? 'Uploaded avatar could not be read back'
    };
  }

  let iconSizeImage: Buffer;
  try {
    const fullSizeBuffer = await fullSizeImage.arrayBuffer();
    iconSizeImage = await sharp(fullSizeBuffer)
      .resize(128, 128)
      .webp()
      .toBuffer();
  } catch (e) {
    // sharp throws rather than returning for anything it cannot decode: corrupt
    // or truncated files, formats libvips was not built with (BMP and ICO are
    // both reachable through the uploader's accept="image/*"), and images over
    // its input pixel limit.
    return {
      ok: false,
      reason: 'decode',
      message: e instanceof Error ? e.message : String(e)
    };
  }

  const iconPath = fullUrlToIconUrl(remoteFilePath);

  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(iconPath, iconSizeImage, {
      contentType: 'image/webp',
      upsert: true
    });
  if (uploadError) {
    return { ok: false, reason: 'storage', message: uploadError.message };
  }

  return { ok: true, iconPath: uploadData.path };
}
