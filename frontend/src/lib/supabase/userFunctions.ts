import { createServerClient } from '../supabaseServer';
import { cache } from 'react'; // For the duration of a single request

// supabase.auth.getUser
export const getUser = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
});

// supabase.storage get profile image (by size)

// set profile image

// authentication (verifyOtp, generateLink, signOut)
