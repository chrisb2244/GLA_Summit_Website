'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { FormField, TextArea } from '@/Components/Form/FormFieldSrv';
import { Select } from '@/Components/Form/Select';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import { useFormValidation } from '@/Components/Utilities/useFormValidation';
import { useTouchedFieldErrors } from '@/Components/Utilities/useTouchedFieldErrors';

import { createPresenterAndSubmission } from './createPresenterActions';
import {
  emptyCreatePresenterData,
  type CreatePresenterFormState
} from './CreatePresenterFormSchema';

const TITLE_MAX = 150;
const ABSTRACT_MAX = 5000;
const BIO_MAX = 5000;

const initialState: CreatePresenterFormState = {
  data: emptyCreatePresenterData,
  errors: undefined,
  completedCount: 0
};

/**
 * Admin-only form that creates a presenter account and submits a presentation
 * owned by that presenter. The server action re-checks the presenter_admins
 * allow-list, so rendering this form is never what grants the permission.
 */
export const CreatePresenterForm = () => {
  const [state, formAction] = useActionState(
    createPresenterAndSubmission,
    initialState
  );
  const values = state.data;

  const { validationMessages, checkValidity } = useFormValidation();
  const { getFieldError, onBlurFor } = useTouchedFieldErrors<string>({
    validationMessages,
    zodErrors: state.errors
  });

  return (
    <form
      // Remount on every successful creation so the uncontrolled inputs (the
      // file input included) are cleared and ready for the next presenter.
      key={state.completedCount}
      action={formAction}
      onChange={(ev) => {
        if (ev.target instanceof HTMLInputElement) {
          checkValidity(ev.target);
        }
      }}
      onInvalidCapture={(ev) => {
        if (ev.target instanceof HTMLInputElement) {
          ev.preventDefault();
          checkValidity(ev.target);
        }
      }}
      className='border border-gray-200 bg-gray-100 p-4 shadow-lg'
    >
      <fieldset className='border-0 p-0'>
        <legend className='text-lg font-semibold'>Presenter</legend>

        <div className='flex flex-col sm:flex-row sm:space-x-2'>
          <FormField
            name='firstName'
            label='First Name'
            placeholder='First Name'
            defaultValue={values.firstName}
            error={getFieldError('firstName')}
            onBlur={onBlurFor(['firstName'])}
            required
            fullWidth
          />
          <FormField
            name='lastName'
            label='Last Name'
            placeholder='Last Name'
            defaultValue={values.lastName}
            error={getFieldError('lastName')}
            onBlur={onBlurFor(['lastName'])}
            required
            fullWidth
          />
        </div>

        <FormField
          name='email'
          type='email'
          label='Email Address'
          placeholder='presenter@example.com'
          defaultValue={values.email}
          error={getFieldError('email')}
          onBlur={onBlurFor(['email'])}
          required
          fullWidth
        />

        <TextArea
          name='bio'
          label='Bio (optional)'
          placeholder='A short biography for the conference programme'
          defaultValue={values.bio}
          error={getFieldError('bio')}
          onBlur={onBlurFor(['bio'])}
          maxLength={BIO_MAX}
          rows={4}
          fullWidth
        />

        <div className='mb-4 mt-2 flex flex-col'>
          <label htmlFor='profileImage' className='text-sm text-gray-700'>
            Profile Picture (optional)
          </label>
          <input
            id='profileImage'
            name='profileImage'
            type='file'
            accept='image/*'
            className='mt-1 text-sm'
          />
          <p className='mt-1 text-xs text-gray-600'>
            JPEG, PNG, WebP, GIF or AVIF, up to 5MB. The presenter can change
            this themselves once they have verified their account.
          </p>
        </div>
      </fieldset>

      <fieldset className='mt-6 border-0 p-0'>
        <legend className='text-lg font-semibold'>Presentation</legend>

        <FormField
          name='title'
          label='Title'
          placeholder='Presentation Title'
          defaultValue={values.title}
          error={getFieldError('title')}
          onBlur={onBlurFor(['title'])}
          required
          maxLength={TITLE_MAX}
          fullWidth
        />

        <TextArea
          name='abstract'
          label='Abstract'
          placeholder='What is the presentation about?'
          defaultValue={values.abstract}
          error={getFieldError('abstract')}
          onBlur={onBlurFor(['abstract'])}
          maxLength={ABSTRACT_MAX}
          rows={5}
          fullWidth
        />

        <TextArea
          name='learningPoints'
          label='Learning Points (optional)'
          placeholder='What are the most important things attendees would learn?'
          defaultValue={values.learningPoints}
          error={getFieldError('learningPoints')}
          onBlur={onBlurFor(['learningPoints'])}
          rows={3}
          fullWidth
        />

        <label
          htmlFor='presentationType'
          className='mt-2 block text-sm text-gray-700'
        >
          Presentation Type
        </label>
        <Select
          id='presentationType'
          name='presentationType'
          fullWidth
          defaultValue={values.presentationType}
          options={[
            {
              key: 'full length',
              description: 'Full Length Presentation (45 minutes)'
            },
            {
              key: '15 minutes',
              description: 'Short Presentation (15 minutes)'
            },
            {
              key: '7x7',
              description: '7x7 Presentation (7 minutes)'
            }
          ]}
        />
      </fieldset>

      {state.status && (
        <div
          className={`my-3 rounded-md border p-3 ${
            state.status.type === 'success'
              ? 'border-green-400 bg-green-50'
              : 'border-red-400 bg-red-50'
          }`}
          role={state.status.type === 'success' ? 'status' : 'alert'}
        >
          <p
            className={
              state.status.type === 'success'
                ? 'text-green-700'
                : 'text-red-700'
            }
          >
            {state.status.message}
          </p>
          {state.created && (
            <p className='mt-1 text-green-700'>
              {`An account email and a submission email have been sent to ${state.created.presenterEmail}. `}
              <Link href='/review-submissions' className='underline'>
                Review submissions
              </Link>
            </p>
          )}
        </div>
      )}

      <p className='pt-2 text-sm text-gray-600'>
        The presenter is recorded as the owner of this submission, and it enters
        the normal review process. They will be emailed a link to verify their
        new account, a copy of what was submitted for them, and the outcome once
        it has been decided.
      </p>

      <div className='mt-3'>
        <SubmitButton
          staticText='Create Presenter and Submit'
          pendingText='Creating presenter...'
        />
      </div>
    </form>
  );
};
