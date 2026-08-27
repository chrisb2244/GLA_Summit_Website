import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PresentationSubmissionFormState } from './PresentationSubmissionFormSchema';
import {
  DRAFTS_CLOSED_CLIENT_ERROR,
  SUBMISSIONS_CLOSED_CLIENT_ERROR
} from '@/actions/presentationActionTypes';

vi.mock('server-only', () => ({}));

// Both routes closed. The form hides its buttons in this configuration, but the
// action is a POST endpoint in its own right, so it has to refuse on its own.
vi.mock('@/app/configConstants', () => ({
  submissionsForYear: '2026',
  CAN_SUBMIT_PRESENTATION: false,
  CAN_SUBMIT_DRAFT: false,
  COPRESENTER_INVITE_WORKFLOW: false
}));

vi.mock('@/lib/supabaseClient', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ createServerActionClient: vi.fn() }));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn()
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/sendMail', () => ({ sendMailApi: vi.fn() }));

vi.mock('@/EmailTemplates/FormSubmissionEmail', () => ({
  FormSubmissionEmailFn: vi.fn(() => ({ html: '', text: '' })),
  NewCopresenterEmailFn: vi.fn(() => ({ html: '', text: '' })),
  CopresenterInviteEmailFn: vi.fn(() => ({ html: '', text: '' })),
  CopresenterResponseNotificationEmailFn: vi.fn(() => ({ html: '', text: '' })),
  RemovedCopresenterEmailFn: vi.fn(() => ({ html: '', text: '' }))
}));

vi.mock('@/lib/utils', () => ({ logToDb: vi.fn() }));

vi.mock('./savePresentation', () => ({
  getAuthenticatedSubmitterId: vi.fn().mockResolvedValue({
    success: true,
    submitterId: 'user-1'
  }),
  savePresentation: vi.fn()
}));

import { submitPresentationAction } from './presentationSubmissionActions';
import { savePresentation } from './savePresentation';
import { sendMailApi } from '@/lib/sendMail';

const mockedSavePresentation = vi.mocked(savePresentation);
const mockedSendMail = vi.mocked(sendMailApi);

const previousState: PresentationSubmissionFormState = {
  data: {
    submitter: {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com'
    },
    title: 'Existing Draft Title',
    abstract: 'A'.repeat(150),
    learningPoints: 'Key things to learn from this session. '.repeat(3),
    presentationType: 'full length',
    speakerAgreement: true,
    skipDuplicateCheck: false,
    submitIntent: 'submit',
    otherPresenters: [],
    presentationId: 'pres-id-1'
  },
  errors: undefined
};

// A fully valid payload — the request is rejected on the closure flags alone,
// not because anything about it fails validation.
const validFormData = (
  overrides: Record<string, string> = {}
): FormData => {
  const formData = new FormData();
  formData.set('submitter.firstName', 'Alice');
  formData.set('submitter.lastName', 'Smith');
  formData.set('submitter.email', 'alice@example.com');
  formData.set('title', 'Existing Draft Title');
  formData.set('abstract', 'A'.repeat(150));
  formData.set(
    'learningPoints',
    'Key things to learn from this session. '.repeat(5)
  );
  formData.set('presentationType', 'full length');
  formData.set('speakerAgreement', 'on');
  formData.set('skipDuplicateCheck', 'true');
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
};

describe('submitPresentationAction with submissions closed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses a new submission and never touches the database', async () => {
    const result = await submitPresentationAction(
      previousState,
      validFormData({ submitIntent: 'submit' })
    );

    expect(mockedSavePresentation).not.toHaveBeenCalled();
    expect(mockedSendMail).not.toHaveBeenCalled();
    expect(result.status).toEqual({
      type: 'error',
      message: SUBMISSIONS_CLOSED_CLIENT_ERROR
    });
    expect(result.errors?.errors).toContain(SUBMISSIONS_CLOSED_CLIENT_ERROR);
  });

  it('refuses promotion of an existing draft to a submission', async () => {
    const result = await submitPresentationAction(
      previousState,
      validFormData({ submitIntent: 'submit', presentationId: 'pres-id-1' })
    );

    expect(mockedSavePresentation).not.toHaveBeenCalled();
    expect(result.status?.message).toBe(SUBMISSIONS_CLOSED_CLIENT_ERROR);
  });

  it('treats a request with no submitIntent as a submission and refuses it', async () => {
    // The parser defaults a missing submitIntent to 'submit', so an
    // intent-less replayed request must fail closed rather than save a draft.
    const result = await submitPresentationAction(
      previousState,
      validFormData()
    );

    expect(mockedSavePresentation).not.toHaveBeenCalled();
    expect(result.status?.message).toBe(SUBMISSIONS_CLOSED_CLIENT_ERROR);
  });

  it('refuses a draft save with its own message', async () => {
    const result = await submitPresentationAction(
      previousState,
      validFormData({ submitIntent: 'saveDraft' })
    );

    expect(mockedSavePresentation).not.toHaveBeenCalled();
    expect(result.status?.message).toBe(DRAFTS_CLOSED_CLIENT_ERROR);
  });
});
