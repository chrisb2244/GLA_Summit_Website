'use client';
import { ProfileModel } from '@/lib/databaseModels';
import { useActionState, useEffect, useReducer } from 'react';
import { ActionState, updateProfileAction } from './ProfileFormServerActions';
import {
  FormField,
  TextArea,
  FormFieldIndicator
} from '@/Components/Form/FormFieldSrv';
import { SubmitButton } from '@/Components/Form/SubmitButton';

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

  const [dirtyElems, dispatchDirtyElems] = useReducer(
    (
      prevElems,
      changedElem: HTMLInputElement | HTMLTextAreaElement | 'reset'
    ) => {
      if (changedElem === 'reset') {
        return new Set<string>();
      }
      const { name } = changedElem;
      let { value, defaultValue } = changedElem;
      const newElems = new Set(prevElems);
      value = value.replaceAll('\r\n', '\n');
      defaultValue = defaultValue.replaceAll('\r\n', '\n');
      if (value !== defaultValue) {
        newElems.add(name);
      } else {
        newElems.delete(name);
      }
      return newElems;
    },
    new Set<string>()
  );

  // Reset dirtyElems when the form is successfully submitted.
  useEffect(() => {
    if (state.success) {
      dispatchDirtyElems('reset');
    }
  }, [state]);

  const isDirty = dirtyElems.size > 0;
  const enableSubmit = isDirty && !pending;

  return (
    <form
      action={formAction}
      onChange={(ev) => {
        if (
          ev.target instanceof HTMLInputElement ||
          ev.target instanceof HTMLTextAreaElement
        ) {
          dispatchDirtyElems(ev.target);
        } else {
          console.error('Unexpected event target:', ev.target);
        }
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
            error={state.errors?.firstname}
            fullWidth
            required
          />
        </div>
        <div className='col-span-3 col-start-1 bg-inherit md:col-span-1 md:col-start-3'>
          <FormField
            name='lastname'
            label='Last Name'
            defaultValue={state.data.lastname}
            error={state.errors?.lastname}
            fullWidth
            required
          />
        </div>
        <div className='col-span-3 col-start-1'>
          <TextArea
            name='bio'
            label='Biography'
            defaultValue={props.profile.bio ?? ''}
            error={state.errors?.bio}
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
