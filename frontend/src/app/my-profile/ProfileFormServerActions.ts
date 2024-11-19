'use server';

import { ProfileModel } from '@/lib/databaseModels';
import { createServerActionClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

type ProfileData = ProfileModel['Row'];
type ProfileDataUpdate = ProfileModel['Update'];
type ProfileFormData = Omit<ProfileData, 'updated_at' | 'avatar_url'>;

export type ActionState = {
  errors?: Partial<Record<keyof ProfileFormData | 'form', string>>;
  success?: boolean;
  data: ProfileFormData;
};

export const updateProfileAction = async (
  previousState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const id = formData.get('id');
  if (id === null) {
    return {
      errors: {
        id: 'ID is required'
      },
      success: false,
      data: previousState.data
    };
  }

  const v: ProfileDataUpdate = {};
  Array.from(formData.entries()).forEach(([name, value]) => {
    const isChanged =
      previousState.data[name as keyof ProfileFormData] !== value;
    const keys = Object.keys(previousState.data);
    if (
      (isChanged || name === 'id') &&
      typeof value === 'string' &&
      keys.includes(name)
    ) {
      v[name as keyof ProfileDataUpdate] = value;
    }
  });

  const supabase = await createServerActionClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(v)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return {
      errors: {
        form: error.message
      },
      success: false,
      data: previousState.data
    };
  }

  revalidatePath('/my-profile');
  return {
    errors: undefined,
    success: true,
    data
  };
};
