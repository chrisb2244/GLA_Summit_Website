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
