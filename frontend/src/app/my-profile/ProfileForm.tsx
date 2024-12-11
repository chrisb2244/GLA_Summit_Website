'use client';
import { ProfileModel } from '@/lib/databaseModels';
import { useActionState, useEffect } from 'react';
import {
  ActionState,
  ProfileFormErrors,
  updateProfileAction
} from './ProfileFormServerActions';
import {
  FormField,
  TextArea,
  FormFieldIndicator
} from '@/Components/Form/FormFieldSrv';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import { useFormDirtyCheck } from '@/Components/Utilities/useFormDirtyCheck';
import { useFormValidation } from '@/Components/Utilities/useFormValidation';

type ProfileData = ProfileModel['Row'];

type ProfileFormProps = {
  profile: ProfileData;
  email: string;
};

export const ProfileForm = (props: ProfileFormProps) => {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProfileAction,
    { errors: undefined, success: undefined, data: props.profile }
  );
  const { isDirty, reset: resetDirty, updateDirtiness } = useFormDirtyCheck();
  const { validationMessages, checkValidity } = useFormValidation();

  // Reset dirtyElems when the form is successfully submitted.
  useEffect(() => {
    if (state.success) {
      resetDirty();
    }
  }, [state]);

  const enableSubmit = isDirty && validationMessages.size === 0 && !pending;

  const fieldError = (field: keyof Omit<ProfileFormErrors, 'form'>) => {
    return validationMessages.get(field) ?? state.errors?.[field];
  };

  return (
    <form
      action={formAction}
      onChange={(ev) => {
        if (
          ev.target instanceof HTMLInputElement ||
          ev.target instanceof HTMLTextAreaElement
        ) {
          updateDirtiness(ev.target);
          checkValidity(ev.target);
        } else {
          console.error('Unexpected event target:', ev.target);
        }
      }}
      onInvalidCapture={(ev) => {
        ev.preventDefault();
      }}
    >
      <div className='px-4'>
        <FormFieldIndicator
          name='email'
          label='Email'
          value={props.email}
          fullWidth
        />
      </div>
      <div className='grid grid-cols-[1fr_8px_1fr] px-4'>
        <div className='col-span-3 col-start-1 md:col-span-1'>
          <FormField
            name='firstname'
            label='First Name'
            defaultValue={state.data.firstname}
            error={fieldError('firstname')}
            fullWidth
            required
          />
        </div>
        <div className='col-span-3 col-start-1 bg-inherit md:col-span-1 md:col-start-3'>
          <FormField
            name='lastname'
            label='Last Name'
            defaultValue={state.data.lastname}
            error={fieldError('lastname')}
            fullWidth
            required
          />
        </div>
        <div className='col-span-3 col-start-1'>
          <TextArea
            name='bio'
            label='Biography'
            defaultValue={props.profile.bio ?? ''}
            error={fieldError('bio')}
            rows={5}
            placeholder={`${props.profile.firstname} ${props.profile.lastname} is an awesome LabVIEW developer who hasn't yet filled out a bio...`}
            fullWidth
          />
        </div>
      </div>
      <input hidden value={props.profile.id} readOnly name='id' />
      <div className='px-4'>
        <SubmitButton
          pendingText='Saving Changes...'
          staticText='Save Changes'
          fullWidth
          disabled={!enableSubmit}
        />
      </div>
    </form>
  );
};
