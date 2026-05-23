import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PresentationSubmissionFormState } from './PresentationSubmissionFormSchema';

vi.mock('server-only', () => ({}));

vi.mock('@/app/configConstants', () => ({
  submissionsForYear: '2026'
}));

vi.mock('@/lib/supabaseClient', () => ({
  createAdminClient: vi.fn()
}));

vi.mock('@/lib/supabaseServer', () => ({
  createServerActionClient: vi.fn()
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

vi.mock('@/lib/sendMail', () => ({
  sendMailApi: vi.fn()
}));

vi.mock('@/EmailTemplates/FormSubmissionEmail', () => ({
  FormSubmissionEmailFn: vi.fn(() => ({ html: '', text: '' })),
  NewCopresenterEmailFn: vi.fn(() => ({ html: '', text: '' })),
  RemovedCopresenterEmailFn: vi.fn(() => ({ html: '', text: '' }))
}));

vi.mock('@/lib/utils', () => ({
  logErrorToDb: vi.fn()
}));

vi.mock('./savePresentation', () => ({
  getAuthenticatedSubmitterId: vi.fn().mockResolvedValue({
    success: true,
    submitterId: 'user-1'
  }),
  savePresentation: vi.fn()
}));

import { PRESENTATION_SAVE_CLIENT_ERROR } from '@/actions/presentationActionTypes';
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
    speakerAgreement: false,
    skipDuplicateCheck: false,
    submitIntent: 'submit',
    otherPresenters: [],
    presentationId: 'pres-id-1'
  },
  errors: undefined
};

describe('submitPresentationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps savePresentation rejection to an error status', async () => {
    mockedSavePresentation.mockResolvedValueOnce({
      success: false,
      error: {
        message: 'You must agree to the speaker agreement to submit.'
      }
    });

    const formData = new FormData();
    formData.set('submitter.firstName', 'Alice');
    formData.set('submitter.lastName', 'Smith');
    formData.set('submitter.email', 'alice@example.com');
    formData.set('title', 'Existing Draft Title');
    formData.set('abstract', 'A'.repeat(150));
    formData.set(
      'learningPoints',
      'Key things to learn from this session. '.repeat(3)
    );
    formData.set('presentationType', 'full length');
    formData.set('submitIntent', 'submit');
    formData.set('skipDuplicateCheck', 'true');
    formData.set('presentationId', 'pres-id-1');

    const result = await submitPresentationAction(previousState, formData);

    expect(mockedSavePresentation).toHaveBeenCalledTimes(1);
    expect(result.status?.type).toBe('error');
    expect(result.status?.message).toBe(PRESENTATION_SAVE_CLIENT_ERROR);
    expect(result.duplicateWarning).toBeUndefined();
  });
});
