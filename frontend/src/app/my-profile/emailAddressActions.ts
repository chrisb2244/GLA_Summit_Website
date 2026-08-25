'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getUser } from '@/lib/supabase/userFunctions';

import {
  confirmAddressAddition,
  promoteAddressToPrimary,
  removeAddress,
  requestAddressAddition
} from './emailAddressService';

const EmailSchema = z
  .string()
  .trim()
  .min(1, 'Required')
  .email("This email doesn't match the expected pattern")
  .transform((s) => s.toLowerCase());

export type AddressFormState = {
  step: 'add' | 'confirm';
  /** The address a code has been sent to. Only meaningful while step is 'confirm'. */
  pendingEmail?: string;
  message?: string;
  error?: string;
};

const NOT_SIGNED_IN: AddressFormState = {
  step: 'add',
  error: 'You need to be signed in to change your addresses.'
};

const field = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
};

const requestAddition = async (
  userId: string,
  formData: FormData
): Promise<AddressFormState> => {
  const parsed = EmailSchema.safeParse(field(formData, 'newAddress'));
  if (!parsed.success) {
    return {
      step: 'add',
      error: parsed.error.issues[0]?.message ?? 'Invalid email address.'
    };
  }

  const result = await requestAddressAddition(userId, parsed.data);
  switch (result.outcome) {
    case 'accepted':
      // One message, one next screen, whether or not a code actually went out —
      // the service will not say, because saying would answer "does this
      // address have an account here?" for any address typed into the box. So
      // the message has to carry both realities, and tell the user what to
      // check when the code they are now waiting for never arrives.
      return {
        step: 'confirm',
        pendingEmail: parsed.data,
        message:
          `If ${parsed.data} can be added to your account, a confirmation code is on its way. Enter it below to finish.\n` +
          'If nothing arrives within a few minutes, check the address for typos and look in your spam folder.\n' +
          'An address that already belongs to another GLA Summit account cannot be added — sign in with that address instead, or contact web@glasummit.org.'
      };
    case 'already-yours':
      return { step: 'add', error: 'That address is already on your account.' };
    case 'rate-limited':
      return {
        step: 'add',
        error: 'Too many requests. Please wait an hour before trying again.'
      };
    default:
      return {
        step: 'add',
        error: 'Could not send a confirmation code. Please try again.'
      };
  }
};

const confirmAddition = async (
  userId: string,
  previousState: AddressFormState,
  formData: FormData
): Promise<AddressFormState> => {
  // The hidden field is the address the form is showing; previousState is the
  // address the server last issued a code for. Either can only ever name an
  // address this user has an open claim on — confirmAddressAddition matches on
  // user_id — so neither has to be trusted, and the fallback just keeps the
  // form working if the field is missing.
  const parsed = EmailSchema.safeParse(
    field(formData, 'address') || (previousState.pendingEmail ?? '')
  );
  const code = field(formData, 'code').trim();
  if (!parsed.success) {
    return { ...previousState, error: 'Enter the code from the email.' };
  }
  if (code.length === 0) {
    return { ...previousState, error: 'Enter the code from the email.' };
  }

  const result = await confirmAddressAddition(userId, parsed.data, code);
  switch (result.outcome) {
    case 'added':
      revalidatePath('/my-profile');
      return { step: 'add', message: `${parsed.data} was added to your account.` };
    case 'invalid-code':
      // Stay on the code field: the address is still claimable, so retrying the
      // code is the useful next move.
      return { ...previousState, error: 'That code is not right.' };
    case 'expired':
      return {
        step: 'add',
        error: 'That code has expired. Request a new one to try again.'
      };
    case 'taken':
      return {
        step: 'add',
        error:
          'That address was claimed by another account while you were confirming it.'
      };
    default:
      return {
        ...previousState,
        error: 'Could not add the address. Please try again.'
      };
  }
};

/**
 * Both steps of the add-an-address form, dispatched on a hidden `intent` field.
 */
export const addressFormAction = async (
  previousState: AddressFormState,
  formData: FormData
): Promise<AddressFormState> => {
  const user = await getUser();
  if (user === null) {
    return NOT_SIGNED_IN;
  }

  switch (field(formData, 'intent')) {
    case 'confirm':
      return confirmAddition(user.id, previousState, formData);
    case 'promote':
      return promote(user.id, previousState, formData);
    case 'remove':
      return remove(user.id, previousState, formData);
    default:
      return requestAddition(user.id, formData);
  }
};

/**
 * Promote and remove keep whatever step the form is on: they are initiated from
 * the address list, which is on screen during both, and losing a half-entered
 * confirmation code because an unrelated row was tidied would be its own bug.
 */
const promote = async (
  userId: string,
  previousState: AddressFormState,
  formData: FormData
): Promise<AddressFormState> => {
  const parsed = EmailSchema.safeParse(field(formData, 'address'));
  if (!parsed.success) {
    return { ...previousState, error: 'That is not an address on your account.' };
  }

  const result = await promoteAddressToPrimary(userId, parsed.data);
  revalidatePath('/my-profile');
  switch (result.outcome) {
    case 'ok':
      return {
        ...previousState,
        error: undefined,
        message: `${parsed.data} is now your primary address.`
      };
    case 'not-yours':
      return {
        ...previousState,
        error: 'That is not a confirmed address on your account.'
      };
    default:
      return {
        ...previousState,
        error: `${parsed.data} could not be made primary. Please try again.`
      };
  }
};

const remove = async (
  userId: string,
  previousState: AddressFormState,
  formData: FormData
): Promise<AddressFormState> => {
  const parsed = EmailSchema.safeParse(field(formData, 'address'));
  if (!parsed.success) {
    return { ...previousState, error: 'That is not an address on your account.' };
  }

  const result = await removeAddress(userId, parsed.data);
  revalidatePath('/my-profile');
  switch (result.outcome) {
    case 'ok':
      return {
        ...previousState,
        error: undefined,
        message: `${parsed.data} was removed from your account.`
      };
    case 'not-yours':
      return {
        ...previousState,
        error: 'That is not an address on your account.'
      };
    case 'not-allowed':
      return {
        ...previousState,
        error:
          'Your primary address cannot be removed. Make another address primary first.'
      };
    default:
      return {
        ...previousState,
        error: `${parsed.data} could not be removed. Please try again.`
      };
  }
};
