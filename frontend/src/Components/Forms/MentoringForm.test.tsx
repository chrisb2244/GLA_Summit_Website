import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MentoringForm,
  type RegistrationData,
  type RegistrationType
} from './MentoringForm';
import type { PersonProps } from '@/Components/Form/Person';

const accountHolder: PersonProps = {
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
    person: PersonProps,
    registered: RegistrationType | null
  ) =>
    render(
      <MentoringForm
        registrationFn={submitFn}
        account={person}
        registered={registered}
      />
    );

  // There is no free-entry mode: a registration names the signed-in account
  // holder, and the database only accepts an address belonging to the caller.
  it('renders the account holder as a prefilled, locked Person form', () => {
    renderForm(accountHolder, null);
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
    renderForm(accountHolder, 'mentor');
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(
      screen.getByText(/Thank you.*registered.*to be a mentor/)
    ).toBeDefined();
  });

  it('shows a message and no form when a mentee registration already exists', () => {
    renderForm(accountHolder, 'mentee');
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(
      screen.getByText(/Thank you.*received your registration/)
    ).toBeDefined();
  });

  it('registers an existing user as a mentor and shows the confirmation', async () => {
    renderForm(accountHolder, null);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(submitFn).toHaveBeenCalledWith({
        person: accountHolder,
        type: 'mentor'
      });
    });
    expect(
      await screen.findByText(/Thank you for offering to be a mentor/)
    ).toBeDefined();
  });
});
