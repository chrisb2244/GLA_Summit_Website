'use client';

import { useActionState } from 'react';

import { FormField } from '@/Components/Form/FormFieldSrv';
import { SubmitButton } from '@/Components/Form/SubmitButton';

import { addressFormAction, type AddressFormState } from './emailAddressActions';
import type { AccountAddress } from './emailAddressService';

const INITIAL_ADDRESS_STATE: AddressFormState = { step: 'add' };

const Notice = (props: { state: AddressFormState }) => {
  const { message, error } = props.state;
  if (!message && !error) {
    return null;
  }
  return (
    <p
      // whitespace-pre-line: the "code sent" notice is two paragraphs' worth of
      // text — what to do next, then what to check if nothing arrives — and the
      // second half is the half people need to actually see.
      className={`pt-2 text-base whitespace-pre-line ${error ? 'text-red-700' : 'text-green-800'}`}
      role={error ? 'alert' : 'status'}
    >
      {error ?? message}
    </p>
  );
};

export const EmailAddresses = (props: {
  /** Null when the list could not be read; see `listAccountAddresses`. */
  addresses: AccountAddress[] | null;
}) => {
  // state.step decides between the "add a new address" and the "confirm a code" form.
  const [state, formAction] = useActionState(
    addressFormAction,
    INITIAL_ADDRESS_STATE
  );

  return (
    <section className='px-4 pt-6' aria-labelledby='email-addresses-heading'>
      <h2 id='email-addresses-heading' className='text-lg font-semibold'>
        Email addresses
      </h2>
      <div className='mx-auto w-4/5'>
        <p className='prose prose-sm max-w-none pt-1'>
          Any address listed here can be used to sign in. Keeping a second
          address on your account means you can still login if you lose access
          to the first — useful if you registered with a work address.
        </p>
      </div>

      {props.addresses === null ? (
        <p className='pt-4 text-base text-red-700' role='alert'>
          Your email addresses could not be loaded just now. Refresh the page to
          try again.
        </p>
      ) : (
        <ul className='flex flex-col gap-2 pt-4'>
          {props.addresses.map((address) => (
            <li
              key={address.email}
              className='flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2'
            >
              <span className='grow break-all'>{address.email}</span>
              {address.isPrimary ? (
                <span className='rounded-sm bg-gray-200 px-2 py-0.5 text-sm text-gray-700'>
                  Primary
                </span>
              ) : (
                <>
                  <form action={formAction}>
                    <input type='hidden' name='intent' value='promote' />
                    <input type='hidden' name='address' value={address.email} />
                    <button type='submit' className='link text-sm'>
                      Make primary
                    </button>
                  </form>
                  <form action={formAction}>
                    <input type='hidden' name='intent' value='remove' />
                    <input type='hidden' name='address' value={address.email} />
                    <button type='submit' className='link text-sm'>
                      Remove
                    </button>
                  </form>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {state.step === 'confirm' ? (
        <form action={formAction} className='pt-4'>
          <input type='hidden' name='intent' value='confirm' />
          <input
            type='hidden'
            name='address'
            value={state.pendingEmail ?? ''}
          />
          <FormField
            name='code'
            label='Confirmation code'
            autoComplete='one-time-code'
            inputMode='numeric'
            required
            fullWidth
          />
          <SubmitButton
            staticText='Confirm address'
            pendingText='Confirming…'
          />
          <Notice state={state} />
        </form>
      ) : (
        <form action={formAction} className='pt-4'>
          <input type='hidden' name='intent' value='request' />
          <h3 className='pb-2 text-base font-semibold'>Add another address</h3>
          {/* Not name='email': FormField derives the DOM id from the name, and
              the profile form above already owns #email. */}
          <FormField
            name='newAddress'
            type='email'
            label='New email address'
            autoComplete='email'
            required
            fullWidth
          />
          <SubmitButton staticText='Send code' pendingText='Sending…' />
          <Notice state={state} />
        </form>
      )}
    </section>
  );
};
