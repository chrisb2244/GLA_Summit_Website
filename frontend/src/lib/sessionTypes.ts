import type { Session, User } from '@supabase/supabase-js';

export type ApiError = {
  message: string;
  status: number;
};
export type UserCredentials = {
  email: string;
  password: string;
};

// Even for ValidSignIn, session and user are null using magic link via email.
type ValidSignIn = { session: Session | null; user: User | null; error: null };
type InvalidSignIn = { session: null; user: null; error: ApiError };
export type SignInReturn = ValidSignIn | InvalidSignIn;

// If "Email Confirmations" is turned on, user is valid and session is null
// If turned off, both are valid when error: null.
type ValidSignUp = { user: User; session: Session | null; error: null };
type InvalidSignUp = { user: null; session: null; error: ApiError };
export type SignUpReturn = ValidSignUp | InvalidSignUp;

export type SignInOptions = {
  redirectTo?: string;
  scopes?: string;
  captchaToken?: string;
};

export type SignUpOptions = {
  redirectTo?: string;
  data?: object;
  captchaToken?: string;
};

export type NewUserInformation = {
  firstname: string;
  lastname: string;
};
