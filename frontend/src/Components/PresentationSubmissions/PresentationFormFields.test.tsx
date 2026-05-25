import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PresentationFormFields } from './PresentationFormFields';
import type {
  PresentationSubmissionFormData,
  PresentationSubmissionFormState
} from './PresentationSubmissionFormSchema';
import userEvent from '@testing-library/user-event';

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

const renderWithState = (
  stateOverrides?: Partial<PresentationSubmissionFormState>
) => {
  const formActionMock = vi.fn();

  useActionStateMock.mockImplementation(
    (_: unknown, initialState: PresentationSubmissionFormState) => {
      const state: PresentationSubmissionFormState = {
        ...initialState,
        ...stateOverrides,
        data: {
          ...initialState.data,
          ...stateOverrides?.data
        }
      };

      return [state, formActionMock];
    }
  );

  return {
    ...render(<PresentationFormFields defaultValues={defaultValues} />),
    formActionMock
  };
};

describe('PresentationFormFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders pre-filled draft values and shared form controls', () => {
    renderWithState();

    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Existing Draft Title'
    );
    expect(
      (screen.getByLabelText('Abstract') as HTMLTextAreaElement).value
    ).toBe('A'.repeat(150));
    expect(
      (screen.getByLabelText('Learning Points') as HTMLTextAreaElement).value
    ).toBe('Key things to learn from this session. '.repeat(3));
    expect(
      (screen.getByLabelText('Co-presenter Email') as HTMLInputElement).value
    ).toBe('co@example.com');

    expect(screen.queryByRole('button', { name: /delete draft/i })).toBeNull();
    expect(
      screen.getByRole('button', { name: /submit presentation/i })
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDefined();
  });

  it('shows duplicate warning state, retains values, and switches CTA to Submit Anyway', () => {
    renderWithState({
      duplicateWarning: {
        existingId: 'abc123',
        existingTitle: 'Regression Test Title'
      },
      data: {
        ...defaultValues,
        title: 'Regression Test Title',
        abstract: 'A reliable abstract '.repeat(12),
        learningPoints: 'A reliable learning point '.repeat(4)
      }
    });

    expect(screen.getByText('Possible duplicate')).toBeTruthy();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Regression Test Title'
    );
    expect(
      (screen.getByLabelText('Abstract') as HTMLTextAreaElement).value
    ).toBe('A reliable abstract '.repeat(12));
    expect(
      (screen.getByLabelText('Learning Points') as HTMLTextAreaElement).value
    ).toBe('A reliable learning point '.repeat(4));
    expect(screen.getByRole('button', { name: 'Submit Anyway' })).toBeTruthy();

    const duplicateFlagInput = document.querySelector(
      'input[name="skipDuplicateCheck"]'
    ) as HTMLInputElement | null;
    expect(duplicateFlagInput?.value).toBe('true');
  });

  it('retains form values and shows error status when action fails', () => {
    renderWithState({
      status: {
        type: 'error',
        message: 'Something went wrong'
      },
      data: {
        ...defaultValues,
        title: 'Regression Test Title',
        abstract: 'A reliable abstract '.repeat(12),
        learningPoints: 'A reliable learning point '.repeat(4)
      }
    });

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Regression Test Title'
    );
    expect(
      (screen.getByLabelText('Abstract') as HTMLTextAreaElement).value
    ).toBe('A reliable abstract '.repeat(12));
    expect(
      (screen.getByLabelText('Learning Points') as HTMLTextAreaElement).value
    ).toBe('A reliable learning point '.repeat(4));
    expect(
      screen.queryByText('Presentation submitted successfully!')
    ).toBeNull();
  });

  it('shows draft save success status and back link for draft editing', () => {
    renderWithState({
      status: {
        type: 'success',
        message: 'Draft saved successfully.'
      }
    });

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Draft saved successfully.')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /back to my presentations/i })
    ).toBeTruthy();
  });

  it('sets submitIntent to submit when Submit Presentation is clicked', async () => {
    const { formActionMock } = renderWithState();

    await userEvent.click(
      screen.getByRole('button', { name: /submit presentation/i })
    );

    expect(formActionMock).toHaveBeenCalledTimes(1);
    const formData = formActionMock.mock.calls[0][0] as FormData;
    expect(formData.get('submitIntent')).toBe('submit');
  });

  it('sets submitIntent to saveDraft when Save Draft is clicked', async () => {
    const { formActionMock } = renderWithState();

    await userEvent.click(screen.getByRole('button', { name: /save draft/i }));

    expect(formActionMock).toHaveBeenCalledTimes(1);
    const formData = formActionMock.mock.calls[0][0] as FormData;
    expect(formData.get('submitIntent')).toBe('saveDraft');
  });

  it('retains values and includes duplicate bypass when duplicate is reported', async () => {
    const { formActionMock } = renderWithState({
      duplicateWarning: {
        existingId: 'abc123',
        existingTitle: 'Regression Test Title'
      },
      data: {
        ...defaultValues,
        title: 'Regression Test Title',
        abstract: 'A reliable abstract '.repeat(12),
        learningPoints: 'A reliable learning point '.repeat(4)
      }
    });

    expect(screen.getByText('Possible duplicate')).toBeTruthy();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Regression Test Title'
    );
    expect(
      (screen.getByLabelText('Abstract') as HTMLTextAreaElement).value
    ).toBe('A reliable abstract '.repeat(12));
    expect(
      (screen.getByLabelText('Learning Points') as HTMLTextAreaElement).value
    ).toBe('A reliable learning point '.repeat(4));

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit Anyway' })
    );

    expect(formActionMock).toHaveBeenCalledTimes(1);
    const formData = formActionMock.mock.calls[0][0] as FormData;
    expect(formData.get('submitIntent')).toBe('submit');
    expect(formData.get('skipDuplicateCheck')).toBe('true');
  });
});
