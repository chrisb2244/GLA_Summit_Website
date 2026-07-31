import fs from 'node:fs';
import { test as setup } from '@playwright/test';
import {
  cleanupUser,
  createAttendee,
  createLogViewer,
  createOrganizer,
  createPresenter,
  getSeededConcluder,
  loginOnPage,
  type SeededUser
} from './utils';
import {
  assertSessionOutlastsRun,
  authStateDir,
  authStatePath,
  authUserManifestPath,
  type SharedAuthRole
} from './utils/authState';

// Mint one logged-in storageState per shared role (see utils/authState.ts for
// the sharing rules). Runs as the `setup` project, a dependency of the browser
// projects; auth.teardown.ts deletes the users afterwards. One setup test per
// role so fullyParallel keeps the wall-time close to a single login.

const factories: Record<
  Exclude<SharedAuthRole, 'concluder'>,
  () => Promise<SeededUser>
> = {
  attendee: () => createAttendee({ emailPrefix: 'pw-shared-attendee' }),
  presenter: () => createPresenter({ emailPrefix: 'pw-shared-presenter' }),
  organizer: () => createOrganizer({ emailPrefix: 'pw-shared-organizer' }),
  log_viewer: () => createLogViewer({ emailPrefix: 'pw-shared-log-viewer' })
};

for (const [role, factory] of Object.entries(factories) as [
  Exclude<SharedAuthRole, 'concluder'>,
  () => Promise<SeededUser>
][]) {
  setup(`authenticate shared ${role}`, async ({ page }) => {
    fs.mkdirSync(authStateDir, { recursive: true });

    // If the previous run died before its teardown (crash, ^C), its user is
    // still in the DB and its manifest still on disk — remove both first.
    const manifest = authUserManifestPath(role);
    if (fs.existsSync(manifest)) {
      const stale = JSON.parse(fs.readFileSync(manifest, 'utf-8'));
      if (stale?.userId) {
        await cleanupUser(stale.userId).catch(() => {});
      }
      fs.rmSync(manifest, { force: true });
    }

    const user = await factory();
    // Record the user BEFORE logging in: if the login fails, the teardown (or
    // the pre-clean above on the next run) can still delete them.
    fs.writeFileSync(
      manifest,
      JSON.stringify({ role, userId: user.userId, email: user.email }, null, 2)
    );
    await page.goto('/');
    await loginOnPage(page, user.email);
    const state = await page
      .context()
      .storageState({ path: authStatePath(role) });
    assertSessionOutlastsRun(state, role);
  });
}

setup('authenticate seeded concluder', async ({ page }) => {
  // The concluder allow-list is admin-only (see getSeededConcluder), so this
  // state belongs to the long-lived seeded account — no manifest, nothing for
  // teardown to delete. Skip (rather than fail the whole dependency chain)
  // when the env vars aren't configured; the specs that consume this state
  // skip on the same condition.
  setup.skip(
    !process.env.TEST_CONCLUDER_EMAIL || !process.env.TEST_CONCLUDER_USER_ID,
    'TEST_CONCLUDER_* env vars are not set'
  );
  fs.mkdirSync(authStateDir, { recursive: true });
  const concluder = getSeededConcluder();
  await page.goto('/');
  await loginOnPage(page, concluder.email);
  const state = await page
    .context()
    .storageState({ path: authStatePath('concluder') });
  assertSessionOutlastsRun(state, 'concluder');
});
