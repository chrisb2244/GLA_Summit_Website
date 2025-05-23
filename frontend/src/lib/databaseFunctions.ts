import { PersonDisplayProps } from '@/Components/PersonDisplay';
import {
  PostgrestError,
  User as SB_User,
  SupabaseClient
} from '@supabase/supabase-js';
import { AllPresentationsModel, ProfileModel } from './databaseModels';
import { Database } from './sb_databaseModels';
import {
  supabase,
  createAdminClient,
  createAnonServerClient
} from './supabaseClient';
import { defaultTimezoneInfo, fullUrlToIconUrl, myLog } from './utils';
import type { NewUserInformation } from './sessionTypes';

export type User = SB_User;
type Client = SupabaseClient<Database>;

export const checkForExistingUser = async (
  email: string
): Promise<{ userId: string | null }> => {
  return createAdminClient()
    .from('email_lookup')
    .select()
    .eq('email', email)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) {
        console.log({ error, m: 'Searching for email-id table entry' });
        throw error;
      }
      if (data) {
        return {
          userId: data.id as string
        };
      }
      return { userId: null };
    });
};

export const adminUpdateExistingProfile = async (
  userId: string,
  data: NewUserInformation
): Promise<void> => {
  const client = createAdminClient();

  const existingData = await client
    .from('profiles')
    .select('firstname,lastname')
    .eq('id', userId)
    .single()
    .then((result) => {
      if (result.data != null) {
        return result.data;
      } else
        return {
          firstname: null,
          lastname: null
        };
    });

  const updatedData = {
    firstname: existingData.firstname ?? data.firstname,
    lastname: existingData.lastname ?? data.lastname
  };

  await client.from('profiles').update(updatedData).eq('id', userId);
};

type PresentationSubmissionsModel =
  Database['public']['Tables']['presentation_submissions']['Row'];
type NewSubmission = Omit<PresentationSubmissionsModel, 'id' | 'updated_at'>;
export const adminAddNewPresentationSubmission = async (
  content: NewSubmission
) => {
  return createAdminClient()
    .from('presentation_submissions')
    .insert(content)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) throw error;
      return data.id;
    });
};
type ExistingSubmission = Omit<PresentationSubmissionsModel, 'updated_at'>;
export const adminUpdateExistingPresentationSubmission = async (
  content: ExistingSubmission
) => {
  return createAdminClient()
    .from('presentation_submissions')
    .upsert(content)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) throw error;
      return data.id;
    });
};

export const getPresentationIds = async () => {
  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from('accepted_presentations')
    .select('id');
  if (error) {
    return [];
  }
  return data;
};

export const getVideoLink = async (
  presentationId: string,
  client: Client
): Promise<string | null> => {
  const { data, error } = await client
    .from('video_links')
    .select('url')
    .eq('presentation_id', presentationId)
    .single();
  if (error) {
    return null;
  }
  return data.url;
};

/* ------------------ Client side functions ---------------------------- */
export const clientUpdateExistingProfile = async (
  profileData: ProfileModel['Row']
) => {
  return supabase
    .from('profiles')
    .upsert(profileData)
    .select()
    .then(({ data, error }) => {
      if (error) throw error;
      if (data.length !== 1) {
        throw new Error('Unexpected data length when updating profile');
      }
      return data[0];
    });
};

export const checkIfOrganizer = async (user: User) => {
  const { data, error } = await supabase
    .from('organizers')
    .select()
    .eq('id', user.id);
  if (error) {
    const err = error as PostgrestError;
    const expected = 'JSON object requested, multiple (or no) rows returned';
    if (err.message === expected) {
      return false;
    }
    throw error;
  } else {
    return data.length > 0;
  }
};

export const queryTimezonePreferences = async (user: User) => {
  const { data, error } = await supabase
    .from('timezone_preferences')
    .select()
    .eq('id', user.id);
  if (error) {
    throw new Error(error.message);
  }
  if (data.length > 0) {
    const { timezone_db, timezone_name, use_24h_clock } = data[0];
    return {
      timeZone: timezone_db,
      timeZoneName: timezone_name,
      use24HourClock: use_24h_clock
    };
  } else {
    return defaultTimezoneInfo();
  }
};

export const getProfileInfo = async (user: User, client: Client = supabase) => {
  return client
    .from('profiles')
    .select('id, firstname, lastname, bio, website, avatar_url')
    .eq('id', user.id)
    .single()
    .then(({ data, error }) => {
      if (error) {
        throw new Error(error.message);
      } else {
        return data;
      }
    });
};

export const uploadAvatar = async (
  remoteFilePath: string,
  localFile: File,
  userId: string,
  originalProfileURL: string | null
) => {
  // Upload a new file to storage
  const { error } = await supabase.storage
    .from('avatars')
    .upload(remoteFilePath, localFile);
  if (error) throw error;

  // Set that file as the profile avatar
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ avatar_url: remoteFilePath })
    .match({ id: userId });
  if (profileUpdateError) {
    deleteAvatar(remoteFilePath);
    throw profileUpdateError;
  }

  // Generate a smaller webp version of the image for the user icon.
  await fetch('/api/handleAvatarUpdate', {
    method: 'POST',
    body: JSON.stringify({ userId, remoteFilePath })
  });

  // Delete the old avatar
  if (originalProfileURL != null) {
    await deleteAvatar(originalProfileURL);
  }
  return true;
};

export const downloadIconAvatarAndGenerateIfNeeded = async (
  userId: string,
  fullSizeImageUrl: string,
  client: SupabaseClient
) => {
  const iconUrl = fullUrlToIconUrl(fullSizeImageUrl);
  const iconBlob = await client.storage
    .from('avatars')
    .download(iconUrl)
    .then(async ({ data, error }) => {
      if (error) {
        // Failed to get the icon-sized image, so try to generate it.
        const body = {
          userId,
          remoteFilePath: fullSizeImageUrl
        };
        const newIconUrl = await fetch('/api/handleAvatarUpdate', {
          method: 'POST',
          body: JSON.stringify(body)
        })
          .then((res) => res.json())
          .then((value) => {
            if (value.error) {
              console.log(value.error);
              return null;
            }
            return value.iconUrl as string;
          });
        if (newIconUrl == null) {
          return null;
        } else {
          // Try to download the newly generated icon-sized image.
          return client.storage
            .from('avatars')
            .download(newIconUrl)
            .then(({ data, error }) => {
              if (error) {
                return error;
              }
              return data;
            });
        }
      } else {
        // Found the icon-sized image, so return it.
        return data;
      }
    });
  return iconBlob;
};

export const downloadAvatar = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url, id')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (data.avatar_url == null) {
    // Found profile, but no avatar_url defined
    return null;
  }

  return await supabase.storage
    .from('avatars')
    .download(data.avatar_url)
    .then(({ data, error }) => {
      if (error) {
        // Can't get the image for some reason
        return null;
      }
      return data;
    });
};

export const getAvatarPublicUrl = (userAvatarUrl: string | null) => {
  if (userAvatarUrl == null) {
    return null;
  }
  const {
    data: { publicUrl }
  } = supabase.storage.from('avatars').getPublicUrl(userAvatarUrl);
  return publicUrl;
};

export const deleteAvatar = async (remotePath: string) => {
  const { data, error } = await supabase.storage
    .from('avatars')
    .remove([remotePath]);
  if (error) throw error;
  return data.length === 1;
};

export const getPublicProfileIds = async (client: Client = supabase) => {
  return client
    .from('public_profiles')
    .select('id')
    .then(({ data, error }) => {
      if (error) throw error;
      const ids = data.map(({ id }) => id);
      return ids;
    });
};

export const getPublicProfiles = async (
  client: Client = supabase
): Promise<ProfileModel['Row'][]> => {
  return getPublicProfileIds()
    .then((ids) => {
      return client
        .from('profiles')
        .select()
        .in('id', ids)
        .order('lastname', { ascending: true });
    })
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
};

export const getPublicPresentations = async (client: Client = supabase) => {
  const { data, error } = await client
    .from('all_presentations')
    .select()
    .order('scheduled_for', { ascending: true });
  if (error) throw error;
  return data;
};
export const getPublicPresentationsForPresenter = async (
  presenterId: string,
  client: Client = supabase
) => {
  const { data, error } = await client
    .from('all_presentations')
    .select()
    .contains('all_presenters', [presenterId])
    .order('scheduled_for', { ascending: true });
  if (error) throw error;
  return data;
};

export const getPublicPresentation = async (
  presentationId: string,
  client: Client = supabase
): Promise<AllPresentationsModel> => {
  return client
    .from('all_presentations')
    .select()
    .eq('presentation_id', presentationId)
    .single()
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
};

export const getMyPresentations = async (client: Client = supabase) => {
  const { data, error: errorPresData } = await client
    .from('my_submissions')
    .select();
  if (errorPresData) {
    myLog({
      error: errorPresData,
      desc: 'Failed to fetch presentation details for this user'
    });
    throw errorPresData;
  }
  return data ?? [];
};

export const deletePresentation = async (presentationId: string) => {
  const { error } = await supabase
    .from('presentation_submissions')
    .delete()
    .eq('id', presentationId);
  if (error) {
    myLog({ error });
    return false;
  }
  return true;
};
