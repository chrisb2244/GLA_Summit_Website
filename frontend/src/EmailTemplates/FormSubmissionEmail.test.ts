import { describe, expect, it, vi, beforeEach } from 'vitest';

// NewCopresenterEmailFn is sent to brand-new-account co-presenters in BOTH
// workflow states, but its copy must match the state: with the accept/decline
// workflow on it invites a response, with it off the recipient is implicitly
// accepted and there is no invite page to respond on. The flag is read at module
// load, so each case re-imports the module under a fresh mock.
const loadNewCopresenterEmailFn = async (workflow: boolean) => {
  vi.resetModules();
  vi.doMock('@/app/configConstants', () => ({
    COPRESENTER_INVITE_WORKFLOW: workflow,
    submissionsForYear: '2026'
  }));
  const mod = await import('./FormSubmissionEmail');
  return mod.NewCopresenterEmailFn;
};

const formData = {
  title: 'My Talk',
  abstract: 'An abstract.',
  learningPoints: 'Some learning points.',
  presentationType: 'full length',
  otherPresenters: [],
  submitter: { firstName: 'Sub', lastName: 'Mitter', email: 'submitter@example.com' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const VALIDATE_URL = '/auth/validateLogin?email=new%40example.com';

describe('NewCopresenterEmailFn copy', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('invites an accept/decline response when the workflow is ON', async () => {
    const fn = await loadNewCopresenterEmailFn(true);
    const { body, bodyPlain } = fn(formData, 'Alice', 'otp-123', VALIDATE_URL);

    expect(body).toContain('invited as a co-presenter');
    expect(body).toContain('accept or decline this invitation');
    expect(body).toContain('Verify account &amp; respond to invitation');
    expect(bodyPlain).toMatch(/respond to the invitation/i);
  });

  it('only asks to verify the account when the workflow is OFF (no accept/decline)', async () => {
    const fn = await loadNewCopresenterEmailFn(false);
    const { body, bodyPlain } = fn(formData, 'Alice', 'otp-123', VALIDATE_URL);

    // Must NOT promise an accept/decline step that does not exist while off.
    expect(body).not.toMatch(/accept or decline/i);
    expect(bodyPlain).not.toMatch(/accept or decline/i);
    expect(bodyPlain).not.toMatch(/respond to the invitation/i);

    expect(body).toContain('added as a co-presenter');
    expect(body).toContain('Verify your account');
    expect(bodyPlain).toMatch(/To verify your account, visit/i);
  });
});
