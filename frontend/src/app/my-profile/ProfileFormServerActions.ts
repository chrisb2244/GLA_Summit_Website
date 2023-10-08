'use server'

import { ProfileModel } from '@/lib/databaseModels'
import { Database } from '@/lib/sb_databaseModels'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

type ProfileDataUpdate = ProfileModel['Update']

export const SubmitForm = async (formData: FormData) => {
  console.log(formData)
  const idValue = formData.get('id')?.valueOf()
  if (typeof idValue !== 'string') {
    throw new Error('The id value is required')
  }
  const v: ProfileDataUpdate = {}
  Array.from(formData.entries()).forEach(([name, value]) => {
    // value is of type FormDataEntryValue, which can be File | string
    // Don't handle files.
    if (typeof value !== 'string') {
      return
    }
    const assumedValidName = name as keyof ProfileDataUpdate
    switch (assumedValidName) {
      case 'id':
      case 'bio':
      case 'firstname':
      case 'lastname':
      case 'website':
        v[assumedValidName] = value
        break
      case 'avatar_url':
        // This shouldn't be passed at all, ignore.
        break
      case 'updated_at':
        // This is handled on the database and shouldn't be part of the form.
        // TODO: Log this as an error, but ignore from the point of view of the
        // client/form.
        break
      default: {
        // This checks that all cases are handled - if the type updates,
        // this will break the typechecking code.
        // It can actually happen if the formData contains other elements, though...
        // Ignore this case.
        const dummyVal: never = assumedValidName
        break
      }
    }
  })

  const supabase = createServerActionClient<Database>({ cookies })
  const { data, error } = await supabase
    .from('profiles')
    .update(v)
    .eq('id', idValue)
    .select()
  if (error) {
    throw error
  }

  revalidatePath('/')
  return data[0]
}
