'use client'

import { FormField, FormFieldIndicator, TextArea } from '@/Components/Form'
import { ProfileModel } from '@/lib/databaseModels'
import React from 'react'
import { useForm } from 'react-hook-form'

type ProfileData = ProfileModel['Row']

type ProfileFormProps = {
  profile: ProfileData
  email: string
}

// avatar_url is handled separately. Don't consider updated_at.
type ProfileFormData = Omit<ProfileData, 'id' | 'updated_at' | 'avatar_url'>

export const ProfileForm: React.FC<ProfileFormProps> = (props) => {
  const {
    register,
    formState: { errors }
  } = useForm<ProfileFormData>({
    defaultValues: props.profile
  })

  return (
    <form>
      <div className='px-4'>
        <FormFieldIndicator fullWidth label='Email' value={props.email} />
      </div>
      <div className='px-4 grid grid-cols-[1fr_8px_1fr]'>
        <div className='col-start-1 col-span-3 md:col-span-1'>
          <FormField
            registerReturn={register('firstname')}
            fieldError={errors.firstname}
            fullWidth
            label='First Name'
          />
        </div>
        <div className='col-start-1 col-span-3 md:col-start-3 md:col-span-1 bg-inherit'>
          <FormField
            registerReturn={register('lastname')}
            fieldError={errors.lastname}
            fullWidth
            label='Last Name'
          />
        </div>
        <div className='col-start-1 col-span-3'>
          <TextArea
            registerReturn={register('bio')}
            fieldError={errors.bio}
            fullWidth
            rows={5}
            label='Biography'
          />
        </div>
      </div>
    </form>
  )
}
