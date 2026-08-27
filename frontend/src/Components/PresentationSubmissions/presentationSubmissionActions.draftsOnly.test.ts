import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PresentationSubmissionFormState } from './PresentationSubmissionFormSchema';
import { SUBMISSIONS_CLOSED_CLIENT_ERROR } from '@/actions/presentationActionTypes';

vi.mock('server-only', () => ({}));

// Submissions closed, drafts still open — the configuration the two flags exist
// to express. Closing submissions must not also block draft saving.
vi.mock('@/app/configConstants', () => ({
  submissionsForYear: '2026',
  CAN_SUBMIT_PRESENTATION: false,
  CAN_SUBMIT_DRAFT: true,
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

const mockedSavePresentation = vi.mocked(savePresentation);

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
    submitIntent: 'saveDraft',
    otherPresenters: [],
    presentationId: 'pres-id-1'
  },
  errors: undefined
};

const validFormData = (overrides: Record<string, string> = {}): FormData => {
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
  formData.set('presentationId', 'pres-id-1');
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
};

describe('submitPresentationAction with drafts open but submissions closed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('still saves a draft', async () => {
    mockedSavePresentation.mockResolvedValueOnce({
      success: true,
      presentationId: 'pres-id-1',
      existingPresenters: [],
      newPresenters: [],
      prunedPresenters: [],
      copresenterTargets: {
        newlyInvited: [],
        reinvited: [],
        spamBlocked: []
      }
    });

    const result = await submitPresentationAction(
      previousState,
      validFormData({ submitIntent: 'saveDraft' })
    );

    expect(mockedSavePresentation).toHaveBeenCalledTimes(1);
    expect(result.status).toEqual({
      type: 'success',
      message: 'Draft saved successfully.'
    });
  });

  it('still refuses to promote that draft to a submission', async () => {
    const result = await submitPresentationAction(
      previousState,
      validFormData({ submitIntent: 'submit' })
    );

    expect(mockedSavePresentation).not.toHaveBeenCalled();
    expect(result.status?.message).toBe(SUBMISSIONS_CLOSED_CLIENT_ERROR);
  });
});
