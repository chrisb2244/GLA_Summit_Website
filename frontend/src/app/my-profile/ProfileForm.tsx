'use client';

import {
  FormField,
  FormFieldIndicator,
  TextArea
} from '@/Components/Form/FormField';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import { ProfileModel } from '@/lib/databaseModels';
import React from 'react';
import { useForm } from 'react-hook-form';
import { SubmitProfileDataUpdate } from './ProfileFormServerActions';
import { useRouter } from 'next/navigation';

type ProfileData = ProfileModel['Row'];

type ProfileFormProps = {
  profile: ProfileData;
  email: string;
};

// avatar_url is handled separately. Don't consider updated_at.
type ProfileFormData = Omit<ProfileData, 'updated_at' | 'avatar_url'>;

export const ProfileForm: React.FC<ProfileFormProps> = (props) => {
  const {
    register,
    trigger,
    formState: { errors, isDirty, isSubmitting, dirtyFields }
  } = useForm<ProfileFormData>({
    defaultValues: props.profile,
    mode: 'all'
  });
  const router = useRouter();
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  // Only allow submitting if not currently submitting, and the form is changed.
  const submitButtonDisabled = isSubmitting || !isDirty;

  const clientSideSubmitAction = async (formData: FormData) => {
    const isValid = await trigger();
    if (!isValid) {
      return;
    }
    const changedValuesFormData = new FormData();
    Array.from(formData.entries()).forEach(([name, value]) => {
      // If 'name' is not a valid key, then this is undefined, and the '??' returns false.
      const isChanged = dirtyFields[name as keyof ProfileFormData] ?? false;
      if (isChanged || name === 'id') {
        changedValuesFormData.append(name, value);
      }
    });
    await SubmitProfileDataUpdate(changedValuesFormData).then(
      (updatedProfile) => {
        router.refresh();
        submitButtonRef.current?.blur();
      },
      (err) => console.error(err)
    );
  };

  return (
    <form action={clientSideSubmitAction}>
      <div className='px-4'>
        <FormFieldIndicator
          registerReturn={{ name: 'email' }}
          fieldError={undefined}
          fullWidth
          label='Email'
          value={props.email}
          name='email'
        />
      </div>
      <div className='grid grid-cols-[1fr_8px_1fr] px-4'>
        <div className='col-span-3 col-start-1 md:col-span-1'>
          <FormField
            registerReturn={register('firstname', {
              required: 'First Name is required'
            })}
            fieldError={errors.firstname}
            fullWidth
            label='First Name'
          />
        </div>
        <div className='col-span-3 col-start-1 bg-inherit md:col-span-1 md:col-start-3'>
          <FormField
            registerReturn={register('lastname', {
              required: 'Last Name is required'
            })}
            fieldError={errors.lastname}
            fullWidth
            label='Last Name'
          />
        </div>
        <div className='col-span-3 col-start-1'>
          <TextArea
            registerReturn={register('bio')}
            fieldError={errors.bio}
            fullWidth
            rows={5}
            label='Biography'
            placeholder={`${props.profile.firstname} ${props.profile.lastname} is an awesome LabVIEW developer who hasn't yet filled out a bio...`}
          />
        </div>
      </div>
      <input hidden value={props.profile.id} readOnly {...register('id')} />
      <div className='px-4'>
        <SubmitButton
          pendingText='Saving Changes...'
          staticText='Save Changes'
          fullWidth
          disabled={submitButtonDisabled}
          ref={submitButtonRef}
        />
      </div>
    </form>
  );
};
