import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PresentationSubmissionFormData } from './PresentationSubmissionFormSchema';

// Submissions closed, drafts still open — the configuration in which a user can
// keep editing an existing draft but must not be able to promote it to a
// submission. Mirrors the mock-per-configuration split used by the
// copresenterHelpers/savePresentation `.implicit` test files.
vi.mock('@/app/configConstants', () => ({
  CAN_SUBMIT_PRESENTATION: false,
  CAN_SUBMIT_DRAFT: true
}));

const { useActionStateMock } = vi.hoisted(() => ({
  useActionStateMock: vi.fn()
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useActionState: useActionStateMock
  };
});

vi.mock('../Utilities/useFormValidation', () => ({
  useFormValidation: () => ({
    validationMessages: {},
    checkValidity: vi.fn()
  })
}));

vi.mock('../Utilities/useTouchedFieldErrors', () => ({
  useTouchedFieldErrors: () => ({
    getFieldError: () => undefined,
    onBlurFor: () => undefined
  })
}));

vi.mock('./presentationSubmissionActions', () => ({
  submitPresentationAction: vi.fn()
}));

import { PresentationFormFields } from './PresentationFormFields';

const defaultValues: PresentationSubmissionFormData = {
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
  otherPresenters: ['co@example.com'],
  presentationId: 'pres-id-1'
};

describe('PresentationFormFields with submissions closed', () => {
  afterEach(() => {
    cleanup();
  });

  it('hides the submit button but keeps draft saving available', () => {
    useActionStateMock.mockImplementation(
      (_: unknown, initialState: unknown) => [initialState, vi.fn()]
    );

    render(<PresentationFormFields defaultValues={defaultValues} />);

    expect(
      screen.queryByRole('button', { name: /submit presentation/i })
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeTruthy();

    // No control on the form may still post submitIntent=submit.
    const submitIntentValues = Array.from(
      document.querySelectorAll('[name="submitIntent"]')
    ).map((el) => el.getAttribute('value'));
    expect(submitIntentValues).toEqual(['saveDraft']);
  });
});
