import { z } from 'zod';

import type { PersonProps } from '../Form/Person';

export type VerificationState =
  | {
      success: true;
      message: undefined;
    }
  | {
      success: false;
      message: string;
    }
  | null;

export type LoginFormErrors = Partial<Record<'email' | 'form', string>>;

export type LoginState = {
  errors?: LoginFormErrors;
  data: {
    email: string;
    redirectTo?: string;
  };
};

export type RegistrationFormErrors = Partial<Record<keyof PersonProps | 'form', string>>;

export type RegistrationState = {
  errors?: RegistrationFormErrors;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    redirectTo?: string;
  };
};

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Required')
    .email("This email doesn't match the expected pattern")
    .transform((s) => s.toLowerCase()),
  redirectTo: z.string().optional()
});

export const RegistrationSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(80),
  lastName: z.string().trim().min(1, 'Required').max(100),
  email: z
    .string()
    .trim()
    .min(1, 'Required')
    .email("This email doesn't match the expected pattern")
    .transform((s) => s.toLowerCase()),
  redirectTo: z.string().optional()
});

const getOptionalString = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);
  return typeof value === 'string' && value !== '' ? value : undefined;
};

const getString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
};

export const loginStateFromFormData = (formData: FormData): LoginState => ({
  data: {
    email: getString(formData, 'email'),
    redirectTo: getOptionalString(formData, 'redirectTo')
  }
});

export const registrationStateFromFormData = (formData: FormData): RegistrationState => ({
  data: {
    firstName: getString(formData, 'firstName'),
    lastName: getString(formData, 'lastName'),
    email: getString(formData, 'email'),
    redirectTo: getOptionalString(formData, 'redirectTo')
  }
});

// Shown for every unsuccessful sign-in, whether the address is unregistered or
// the send genuinely failed — see the comment in SignInUpActions. It names the
// two things a visitor can act on rather than telling them to "try again",
// which only produced repeat submissions of the same wrong address.
export const SIGN_IN_FAILED_MESSAGE =
  "We couldn't send a login code to that address. Check it for typos, or " +
  'register if you have not used this site before.';

/**
 * Links between the sign-in and registration forms carry the address already
 * typed (and any redirectTo), so switching forms never means retyping — a
 * retype is where the second typo comes from.
 */
export const buildAuthFormUrl = (
  path: '/auth/login' | '/auth/register',
  options?: { email?: string; redirectTo?: string }
): string => {
  const params = new URLSearchParams();
  if (options?.email) {
    params.append('email', options.email);
  }
  if (options?.redirectTo) {
    params.append('redirectTo', options.redirectTo);
  }

  const query = params.toString();
  return query.length > 0 ? `${path}?${query}` : path;
};

export const buildValidateLoginUrl = (email: string, redirectTo?: string): string => {
  const params = new URLSearchParams({ email });
  if (redirectTo) {
    params.append('redirectTo', redirectTo);
  }

  return `/auth/validateLogin?${params.toString()}`;
};

export const verificationRequestFromFormData = (
  data: FormData
): { email: string; verificationCode: string; redirectTo: string } | null => {
  const emailValue = data.get('email');
  const verificationCodeValue = data.get('verificationCode');
  const redirectTo = getOptionalString(data, 'redirectTo') ?? '/';

  if (typeof emailValue !== 'string' || typeof verificationCodeValue !== 'string') {
    return null;
  }

  return {
    email: emailValue,
    verificationCode: verificationCodeValue,
    redirectTo
  };
};
