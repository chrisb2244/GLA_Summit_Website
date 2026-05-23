import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistrationForm } from './RegistrationForm';

vi.mock('@/Components/SigninRegistration/SignInUpActions', () => ({
  registerFromFormWithRedirect: vi.fn()
}));

describe('RegistrationForm error rendering', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows email validation error only after blur', async () => {
    render(<RegistrationForm />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });

    expect(screen.queryByRole('alert')).toBeNull();

    await userEvent.type(emailInput, 'a');

    expect(screen.queryByRole('alert')).toBeNull();

    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });
});
