import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import {
  createAttendee,
  createPresenter,
  createSupabaseAdmin,
  loginOnPage
} from './utils';
import type { SeededUser } from './utils';

// Regression cover for profile photo updates.
//
// Uploading a photo used to write profiles.avatar_url straight from the browser
// Supabase client, which no Next.js cache invalidation can observe: the cached
// presenter page kept serving the previous photo until an unrelated profile edit
// happened to expire the profile:<id> tag. The reported symptom was that the new
// photo only reached the presenter page after also editing a text field and
// clicking Save Changes.
//
// A first-ever upload had a second problem: the profile page's own image hook
// returned null when there was no avatar yet, dropping the SWR mutate() with it,
// so nothing refreshed until a full page reload.

const AVATARS_BUCKET = 'avatars';

const makeImage = (background: { r: number; g: number; b: number }) =>
  sharp({
    create: { width: 64, height: 64, channels: 3, background }
  })
    .png()
    .toBuffer();

// Mirrors fullUrlToIconUrl(): the derived icon sits alongside the full-size file.
const iconPathFor = (fullSizePath: string) =>
  `${fullSizePath.split('.').slice(0, -1).join('.')}-icon.webp`;

const readAvatarPath = async (userId: string) => {
  const { data } = await createSupabaseAdmin()
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();
  return data?.avatar_url ?? null;
};

// The file input is server-rendered, so it is present (and settable) before
// React has attached its change handler -- files set that early are silently
// dropped. The profile image hook fetches the stored avatar when it mounts, so
// that query is a reliable signal that the uploader is hydrated and listening.
const openProfilePageReadyToUpload = async (page: Page) => {
  const avatarQuery = page.waitForResponse(
    (response) =>
      response.url().includes('/rest/v1/profiles') &&
      response.url().includes('avatar_url'),
    { timeout: 20000 }
  );
  await page.goto('/my-profile');
  await avatarQuery;
};

const uploadProfilePhoto = async (
  page: Page,
  file: { name: string; buffer: Buffer }
) => {
  await page.locator('#image-input').setInputFiles({
    name: file.name,
    mimeType: 'image/png',
    buffer: file.buffer
  });
};

test.describe('profile photo updates', { tag: '@regression' }, () => {
  let user: SeededUser | undefined;
  // Storage objects to remove after the test; the auth-user cleanup does not
  // reach into the avatars bucket.
  const storedAvatarPaths = new Set<string>();

  test.afterEach(async () => {
    if (user) {
      const finalPath = await readAvatarPath(user.userId);
      if (finalPath != null) {
        storedAvatarPaths.add(finalPath);
      }
    }
    const paths = [...storedAvatarPaths].flatMap((path) => [
      path,
      iconPathFor(path)
    ]);
    if (paths.length > 0) {
      await createSupabaseAdmin().storage.from(AVATARS_BUCKET).remove(paths);
    }
    storedAvatarPaths.clear();
    await user?.cleanup();
    user = undefined;
  });

  test('a first photo appears on the profile page without a reload', async ({
    page
  }) => {
    user = await createAttendee({ emailPrefix: 'pw-avatar-first' });

    await page.goto('/');
    await loginOnPage(page, user.email);

    await openProfilePageReadyToUpload(page);
    // Nothing but the placeholder icon while the user has no avatar.
    const profileImage = page.getByAltText('Profile image');
    await expect(profileImage).toHaveCount(0);

    await uploadProfilePhoto(page, {
      name: 'first-photo.png',
      buffer: await makeImage({ r: 20, g: 140, b: 90 })
    });

    // No navigation, no reload: the uploader has to refresh its own view.
    await expect(profileImage).toBeVisible({ timeout: 20000 });

    expect(await readAvatarPath(user.userId)).not.toBeNull();
  });

  test('a replacement photo reaches the presenter page with no other profile edit', async ({
    page
  }) => {
    user = await createPresenter({ emailPrefix: 'pw-avatar-cache' });
    const admin = createSupabaseAdmin();

    // Give the presenter a photo to replace, so the assertion below is about a
    // stale cached URL rather than the presence of an image.
    const seededPath = `${user.userId}_seed.png`;
    storedAvatarPaths.add(seededPath);
    const { error: seedUploadError } = await admin.storage
      .from(AVATARS_BUCKET)
      .upload(seededPath, await makeImage({ r: 10, g: 120, b: 200 }), {
        contentType: 'image/png',
        upsert: true
      });
    expect(seedUploadError).toBeNull();
    const { error: seedProfileError } = await admin
      .from('profiles')
      .update({ avatar_url: seededPath })
      .eq('id', user.userId);
    expect(seedProfileError).toBeNull();

    // Prime the cached presenter page with the old photo. This is the entry
    // that used to keep serving it.
    const presenterUrl = `/presenters/${user.userId}`;
    const presenterImage = page.getByAltText(
      `Image of ${user.firstName} ${user.lastName}`
    );
    await page.goto(presenterUrl);
    expect(await presenterImage.getAttribute('src')).toContain(seededPath);

    await page.goto('/');
    await loginOnPage(page, user.email);
    await openProfilePageReadyToUpload(page);
    await uploadProfilePhoto(page, {
      name: 'replacement-photo.png',
      buffer: await makeImage({ r: 220, g: 40, b: 40 })
    });

    // Wait for the upload to be committed, but change nothing else -- in
    // particular, the profile form is never touched or submitted.
    await expect
      .poll(async () => readAvatarPath(user!.userId), { timeout: 20000 })
      .not.toBe(seededPath);
    const newPath = await readAvatarPath(user.userId);
    expect(newPath).not.toBeNull();
    storedAvatarPaths.add(newPath!);

    await page.goto(presenterUrl);
    const presenterImageSrc = await presenterImage.getAttribute('src');
    expect(presenterImageSrc).toContain(newPath!);
    expect(presenterImageSrc).not.toContain(seededPath);
  });
});
