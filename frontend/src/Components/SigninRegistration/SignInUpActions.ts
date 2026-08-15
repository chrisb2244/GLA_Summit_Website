'use server';
import 'server-only'; // Poison the module for client code.

import { createServerActionClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';
import { RedirectType, redirect } from 'next/navigation';
import type { PersonProps } from '../Form/Person';
import {
  buildValidateLoginUrl,
  LoginSchema,
  loginStateFromFormData,
  RegistrationSchema,
  registrationStateFromFormData,
  SIGN_IN_FAILED_MESSAGE,
  verificationRequestFromFormData
} from './formState';
import { blockIfEmailIsDisallowed, blockIfProfileIsFlagged } from './validation';
import { signIn, signUp, verifyLogin } from './authService';
import type { LoginState, RegistrationState, VerificationState } from './formState';

export type { LoginFormErrors, LoginState, RegistrationFormErrors, RegistrationState, VerificationState } from './formState';

export const signOut = async () => {
  await (await createServerActionClient()).auth.signOut();
  revalidatePath('/');
};

export const verifyLoginWithRedirectFromForm = async (
  previousState: VerificationState,
  data: FormData
): Promise<VerificationState> => {
  void previousState; // Required by useActionState server action signature.

  const request = verificationRequestFromFormData(data);
  if (request == null) {
    return {
      success: false,
      message: 'Invalid input.'
    };
  }

  const result = await verifyLogin(request);
  if (result) {
    redirect(request.redirectTo);
  }

  return {
    success: false,
    message: 'Invalid verification code.'
  };
};

export const signInFromFormWithRedirect = async (
  previousState: LoginState,
  formData: FormData
): Promise<LoginState> => {
  const submittedState = loginStateFromFormData(formData);
  const validatedFields = LoginSchema.safeParse(submittedState.data);

  if (!validatedFields.success) {
    return {
      ...submittedState,
      errors: {
        email: validatedFields.error.flatten().fieldErrors.email?.[0]
      }
    };
  }

  const { email, redirectTo } = validatedFields.data;
  blockIfEmailIsDisallowed(email);

  const outcome = await signIn(email, redirectTo);

  if (outcome === 'sent') {
    const redirectUrl = buildValidateLoginUrl(email, redirectTo);
    redirect(redirectUrl, RedirectType.push);
  }

  // 'no-account' and 'failed' deliberately share a message: a distinct one for
  // the former would let anyone test whether an address is registered here.
  // The form pairs this with a link to registration, which covers the (far more
  // common) case without disclosing anything.
  return {
    data:
      previousState.data.email === submittedState.data.email &&
      previousState.data.redirectTo === submittedState.data.redirectTo
        ? previousState.data
        : submittedState.data,
    errors: {
      form: SIGN_IN_FAILED_MESSAGE
    }
  };
};

export const registerFromFormWithRedirect = async (
  previousState: RegistrationState,
  formData: FormData
): Promise<RegistrationState> => {
  void previousState; // Required by useActionState server action signature.

  const submittedState = registrationStateFromFormData(formData);
  const validatedFields = RegistrationSchema.safeParse(submittedState.data);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      ...submittedState,
      errors: {
        firstName: fieldErrors.firstName?.[0],
        lastName: fieldErrors.lastName?.[0],
        email: fieldErrors.email?.[0]
      }
    };
  }

  const {
    firstName,
    lastName,
    email,
    redirectTo
  } = validatedFields.data;

  const newUser: PersonProps = {
    firstName,
    lastName,
    email
  };
  blockIfProfileIsFlagged(newUser);
  
  const signUpSuccessful = await signUp(newUser, redirectTo);
  
  if (signUpSuccessful) {
    redirect(buildValidateLoginUrl(email, redirectTo), RedirectType.push);
  }

  return {
    data: submittedState.data,
    errors: {
      form: 'Could not create your account. Please try again.'
    }
  };
};
