// Barrel for the Playwright test utilities. Import from '../utils' (or './utils'
// from a sibling spec) to reach any helper; the implementation is split across
// the modules in this directory by concern.
export { createSupabaseAdmin } from './supabaseAdmin';
export {
  countEmailsInInbox,
  generateTestEmail,
  getEmailsWithSubject,
  getInbucketVerificationCode,
  getLatestMessageForEmail
} from './email';
export type { TestEmailMessage } from './email';
export { loginOnPage } from './login';
export { seedSharedPresentation } from './presentations';
export { seedTicket } from './tickets';
export {
  cleanupUser,
  cleanupUserByEmail,
  createAttendee,
  createCopresenter,
  createLogViewer,
  createOrganizer,
  createPresenter,
  createPresenterAdmin,
  getSeededConcluder
} from './userCreation';
export type { SeededUser, TestRole } from './userCreation';
export {
  assertSessionOutlastsRun,
  authStatePath,
  authStateDir,
  authUserManifestPath,
  getAccessToken,
  SHARED_AUTH_ROLES
} from './authState';
export type { SharedAuthRole, StorageState } from './authState';
