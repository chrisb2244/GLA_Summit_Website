'use server';
import { createAdminClient } from '@/lib/supabaseClient';
import { fullUrlToIconUrl } from '@/lib/utils';
import sharp from 'sharp';

/**
 * Generates a 128x128 webp icon from the full-size avatar at `remoteFilePath`
 * and uploads it to storage. Uses the admin client so it can be called for any
 * user's avatar without requiring the caller to be authenticated as that user.
 *
 * Returns the storage path of the icon on success, or null on failure.
 */
export async function generateAvatarIcon(
  remoteFilePath: string
): Promise<string | null> {
  const adminClient = createAdminClient();

  const { data: fullSizeImage, error: downloadError } = await adminClient.storage
    .from('avatars')
    .download(remoteFilePath);
  if (downloadError || !fullSizeImage) {
    return null;
  }

  const fullSizeBuffer = await fullSizeImage.arrayBuffer();
  const iconSizeImage = await sharp(fullSizeBuffer)
    .resize(128, 128)
    .webp()
    .toBuffer();
  const iconPath = fullUrlToIconUrl(remoteFilePath);

  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(iconPath, iconSizeImage, {
      contentType: 'image/webp',
      upsert: true
    });
  if (uploadError) {
    return null;
  }
  return uploadData.path;
}
