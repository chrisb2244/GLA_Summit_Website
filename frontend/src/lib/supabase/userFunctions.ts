import 'server-only'; // This file is only used on the server
import type { AuthError, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '../supabaseServer';
import { cache } from 'react'; // For the duration of a single request
import { createAdminClient } from '../supabaseClient';
import { randomBytes } from 'crypto';

// supabase.auth.getUser
export const getUser = cache(async (supabase?: SupabaseClient) => {
  return (supabase ? Promise.resolve(supabase) : createServerClient()).then(
    async (sb) => {
      const { data, error } = await sb.auth.getUser();
      if (error) {
        return null;
      }
      return data.user;
    }
  );
});

// supabase.storage get profile image (by size)

// set profile image

// authentication (verifyOtp, generateLink, signOut)
type NewUserCreationReturn = NewUserSuccessReturn | NewUserFailureReturn;
type NewUserSuccessReturn = {
  success: true;
  id: string;
  otpLink: string;
  email: string;
};
type NewUserFailureReturn = { success: false; error: AuthError };

export const registerEmailAddress = async (
  email: string
): Promise<NewUserCreationReturn> => {
  const supabase = createAdminClient();
  const randomPassword = randomBytes(32).toString('hex');
  return supabase.auth.admin
    .generateLink({
      type: 'signup',
      email,
      password: randomPassword,
      options: {
        data: {
          firstname: '',
          lastname: ''
        }
      }
    })
    .then(({ data, error }) => {
      if (error) {
        return {
          success: false as const,
          error
        };
      }
      return {
        success: true as const,
        id: data.user.id,
        otpLink: data.properties.email_otp,
        email
      };
    });
};
