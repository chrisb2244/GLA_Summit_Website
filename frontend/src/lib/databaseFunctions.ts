import { commitAvatarUpdate } from '@/actions/updateAvatar';
import {
  PostgrestError,
  User as SB_User,
  SupabaseClient
} from '@supabase/supabase-js';
import { PresentationModel, ProfileModel } from './databaseModels';
import { Database } from './sb_databaseModels';
import {
  supabase,
  createAdminClient,
  createAnonServerClient
} from './supabaseClient';
import { defaultTimezoneInfo, logToDb } from './utils';
import type { NewUserInformation } from './sessionTypes';

export type User = SB_User;
type Client = SupabaseClient<Database>;

export type ResolvedAccount = {
  userId: string;
  primaryEmail: string;
};

/**
 * Find the account that owns an address. Returns null when the address belongs
 * to no account, or when it has been added to one but not yet verified (an
 * unverified address must never be a way in).
 */
export const resolveAccountEmail = async (
  email: string
): Promise<ResolvedAccount | null> => {
  return createAdminClient()
    .rpc('resolve_account_email', { p_email: email })
    .then(({ data, error }) => {
      if (error) {
        logToDb('error', 'Email lookup query failed', 'db/email-lookup', {
          context: { message: error.message, code: error.code }
        });
        throw error;
      }
      const [row] = data ?? [];
      if (!row) {
        return null;
      }
      return { userId: row.user_id, primaryEmail: row.primary_email };
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
  localFile: File
) => {
  // Upload a new file to storage
  const { error } = await supabase.storage
    .from('avatars')
    .upload(remoteFilePath, localFile, {
      cacheControl: '31536000',
      upsert: false
    });
  if (error) throw error;

  // Icon generation, updating the profiles table, deleting the files
  // this replaces, and expiring the profile cache tag happen server-side.
  // A client-side write to profiles.avatar_url is invisible to the Next.js
  // cache.
  const result = await commitAvatarUpdate(remoteFilePath);
  if (!result.success) {
    // Don't leave a rejected upload orphaned in the bucket.
    await deleteAvatar(remoteFilePath).catch(() => undefined);
    throw new Error(result.error);
  }
  return true;
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
    .rpc('get_all_presentations')
    .order('scheduled_for', { ascending: true })
    .select('*');
  if (error) throw error;
  return data;
};
export const getPublicPresentationsForPresenter = async (
  presenterId: string,
  client: Client = supabase
) => {
  const { data, error } = await client
    .rpc('get_all_presentations')
    .contains('all_presenters', [presenterId])
    .order('scheduled_for', { ascending: true })
    .select('*');
  if (error) throw error;
  return data;
};

export const getPublicPresentation = async (
  presentationId: string,
  client: Client = supabase
): Promise<PresentationModel> => {
  return client
    .rpc('get_all_presentations')
    .eq('presentation_id', presentationId)
    .select('*')
    .single()
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
};

export const getMyPresentations = async (client: Client = supabase) => {
  const { data, error: errorPresData } = await client
    .rpc('get_my_submissions')
    .select('*');
  if (errorPresData) {
    const message =
      'message' in errorPresData && typeof errorPresData.message === 'string'
        ? errorPresData.message.toLowerCase()
        : '';
    const isAbortLike =
      message.includes('aborted') || message.includes('aborterror');
    if (!isAbortLike) {
      console.error('Failed to fetch presentation details for this user', { error: errorPresData });
      throw errorPresData;
    }
  }
  return data ?? [];
};
