import { createClient, PostgrestError } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ProfileModel = {
  id: string
  firstname: string
  lastname: string
  bio: string | null
  website: string | null
  avatar_url: string | null
}

export const getProfileInfo = async () => {
  const user = supabase.auth.user()
  if (user == null) {
    return null
  }

  const { data, error } = await supabase
    .from<ProfileModel>('profiles')
    .select('firstname, lastname, bio, website, avatar_url')
    .eq('id', user.id)
    .single()

  if (error) {
    return Promise.reject(error as PostgrestError)
  }

  if (data) {
    console.log('Found data')
    return Promise.resolve(data)
  }
  return null
}
