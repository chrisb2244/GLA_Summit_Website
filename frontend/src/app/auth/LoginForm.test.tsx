import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import {
  buildAuthFormUrl,
  LoginSchema
} from '@/Components/SigninRegistration/formState';

vi.mock('@/Components/SigninRegistration/SignInUpActions', () => ({
  signInFromFormWithRedirect: vi.fn()
}));

describe('LoginSchema email normalisation', () => {
  it('lowercases a mixed-case email', () => {
    const result = LoginSchema.safeParse({ email: 'Alice@Example.COM' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alice@example.com');
    }
  });

  it('trims and lowercases an email with surrounding whitespace', () => {
    const result = LoginSchema.safeParse({ email: '  USER@EXAMPLE.COM  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('buildAuthFormUrl', () => {
  it('omits the query string entirely when nothing is carried over', () => {
    expect(buildAuthFormUrl('/auth/register')).toBe('/auth/register');
    expect(buildAuthFormUrl('/auth/register', { email: '' })).toBe(
      '/auth/register'
    );
  });

  it('encodes the carried email and redirectTo', () => {
    expect(
      buildAuthFormUrl('/auth/login', {
        email: 'a+b@example.com',
        redirectTo: '/ticket'
      })
    ).toBe('/auth/login?email=a%2Bb%40example.com&redirectTo=%2Fticket');
  });
});

describe('LoginForm cross-links', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('prefills an email carried over from the registration form', () => {
    render(<LoginForm email='carried@example.com' />);

    expect(screen.getByRole('textbox', { name: /email/i })).toHaveProperty(
      'value',
      'carried@example.com'
    );
  });

  it('carries the typed email and redirectTo to the registration form', async () => {
    render(<LoginForm redirectTo='/ticket' />);

    const joinLink = screen.getByRole('link', { name: /Join Now/i });
    expect(joinLink.getAttribute('href')).toBe(
      '/auth/register?redirectTo=%2Fticket'
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /email/i }),
      'typed@example.com'
    );

    await waitFor(() => {
      expect(joinLink.getAttribute('href')).toBe(
        '/auth/register?email=typed%40example.com&redirectTo=%2Fticket'
      );
    });
  });
});

describe('LoginForm error rendering', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows email validation error only after blur-sm', async () => {
    render(<LoginForm />);

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
