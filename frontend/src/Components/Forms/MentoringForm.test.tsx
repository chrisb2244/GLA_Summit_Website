import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MentoringForm,
  type RegistrationData,
  type RegistrationType
} from './MentoringForm';
import type { PersonProps } from '@/Components/Form/Person';

const existingPerson: PersonProps = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@test.com'
};

// Validation of the Person fields themselves is covered by the Person/FormField
// tests; here we only exercise the MentoringForm wiring.
describe('MentoringForm', () => {
  const submitFn = vi.fn<(data: RegistrationData) => void>();

  beforeEach(() => {
    submitFn.mockReset();
  });
  afterEach(cleanup);

  const getInput = (name: 'First Name' | 'Last Name' | 'Email') =>
    screen.getByRole('textbox', { name }) as HTMLInputElement;

  const renderForm = (
    person: PersonProps | undefined,
    registered: RegistrationType | null
  ) =>
    render(
      <MentoringForm
        registrationFn={submitFn}
        defaultEntry={person}
        registered={registered}
      />
    );

  it('renders a prefilled, locked Person form when a default entry is supplied', () => {
    renderForm(existingPerson, null);
    const textboxes = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(textboxes).toHaveLength(3);
    expect(getInput('First Name').value).toBe('Test');
    expect(getInput('Last Name').value).toBe('User');
    expect(getInput('Email').value).toBe('test.user@test.com');
    textboxes.forEach((tbox) => {
      expect(tbox.readOnly).toBe(true);
    });
  });

  it('shows a message and no form when a mentor registration already exists', () => {
    renderForm(existingPerson, 'mentor');
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(
      screen.getByText(/Thank you.*registered.*to be a mentor/)
    ).toBeDefined();
  });

  it('shows a message and no form when a mentee registration already exists', () => {
    renderForm(existingPerson, 'mentee');
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.getByText(/Thank you.*received your registration/)).toBeDefined();
  });

  it('registers an existing user as a mentor and shows the confirmation', async () => {
    renderForm(existingPerson, null);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(submitFn).toHaveBeenCalledWith({
        person: existingPerson,
        type: 'mentor'
      });
    });
    expect(
      await screen.findByText(/Thank you for offering to be a mentor/)
    ).toBeDefined();
  });

  it('blocks submission and flags the field when a required value is missing', async () => {
    renderForm(undefined, null);
    await userEvent.type(getInput('First Name'), existingPerson.firstName);
    await userEvent.type(getInput('Email'), existingPerson.email);
    // Last Name deliberately left empty.

    const lastNameInput = getInput('Last Name');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(lastNameInput.getAttribute('aria-invalid')).toBe('true');
    });
    expect(submitFn).not.toHaveBeenCalled();
  });
});
