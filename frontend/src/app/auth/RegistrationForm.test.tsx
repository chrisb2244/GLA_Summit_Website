import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistrationForm } from './RegistrationForm';
import { RegistrationSchema } from '@/Components/SigninRegistration/formState';

vi.mock('@/Components/SigninRegistration/SignInUpActions', () => ({
  registerFromFormWithRedirect: vi.fn()
}));

describe('RegistrationSchema email normalisation', () => {
  it('lowercases a mixed-case email', () => {
    const result = RegistrationSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'Alice@Example.COM'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alice@example.com');
    }
  });

  it('trims and lowercases an email with surrounding whitespace', () => {
    const result = RegistrationSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      email: '  USER@EXAMPLE.COM  '
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('RegistrationForm cross-links', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('prefills an email carried over from the sign-in form', () => {
    render(<RegistrationForm email='carried@example.com' />);

    expect(screen.getByRole('textbox', { name: /email/i })).toHaveProperty(
      'value',
      'carried@example.com'
    );
  });

  it('carries the typed email back to the sign-in form', async () => {
    render(<RegistrationForm />);

    const signInLink = screen.getByRole('link', { name: /Sign In/i });
    expect(signInLink.getAttribute('href')).toBe('/auth/login');

    await userEvent.type(
      screen.getByRole('textbox', { name: /email/i }),
      'typed@example.com'
    );

    await waitFor(() => {
      expect(signInLink.getAttribute('href')).toBe(
        '/auth/login?email=typed%40example.com'
      );
    });
  });
});

describe('RegistrationForm error rendering', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows email validation error only after blur-sm', async () => {
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
