import fs from 'node:fs';
import { test as teardown } from '@playwright/test';
import { cleanupUser } from './utils';
import {
  SHARED_AUTH_ROLES,
  authStatePath,
  authUserManifestPath
} from './utils/authState';

// Counterpart of auth.setup.ts: delete the per-run shared users and their
// storageState files. State files never outlive the run — the sessions'
// cookies would go stale (and the users they belong to are gone anyway).

teardown('remove shared auth users and states', async () => {
  for (const role of SHARED_AUTH_ROLES) {
    const manifest = authUserManifestPath(role);
    if (fs.existsSync(manifest)) {
      const { userId } = JSON.parse(fs.readFileSync(manifest, 'utf-8'));
      if (userId) {
        await cleanupUser(userId);
      }
      fs.rmSync(manifest, { force: true });
    }
    fs.rmSync(authStatePath(role), { force: true });
  }
});
