import useSWRImmutable from 'swr/immutable'
import type { ScopedMutator } from 'swr/dist/types'
import type { ProfileModel } from './databaseModels'
import { supabase } from './supabaseClient'

const deleteFromStorage = async (remotePath: string) => {
  const { data, error } = await supabase.storage
    .from('avatars')
    .remove([remotePath])
  if (error) throw error
  if (data?.length === 1) return true
  return false
}

export const uploadProfileImage = async (
  remoteFilePath: string,
  localFile: File,
  userId: string,
  mutate: ScopedMutator,
  originalProfileURL: string | null
) => {
  // Upload a new file to storage
  const { error } = await supabase.storage
    .from('avatars')
    .upload(remoteFilePath, localFile)
  if (error) throw error

  // Set the new profile URL
  const { error: profileUpdateError } = await supabase
    .from<ProfileModel>('profiles')
    .upsert(
      { id: userId, avatar_url: remoteFilePath },
      { returning: 'minimal' }
    )
  if (profileUpdateError) {
    // Attempt to delete the new file
    deleteFromStorage(remoteFilePath)
    throw profileUpdateError
  }
  // Even with this call, additional open tabs won't
  // refresh when using the immutable hook.
  mutate(userId)

  if (originalProfileURL != null) {
    // Delete the existing avatar file from storage.
    await deleteFromStorage(originalProfileURL).catch((error) => {
      throw error
    })
  }
}

const downloadProfileImage = async (userId: string): Promise<Blob | null> => {
  const { data, error } = await supabase
    .from<ProfileModel>('profiles')
    .select('avatar_url, id')
    .eq('id', userId)
    .single()
  if (error) throw error

  const avatarUrl = data.avatar_url
  if (avatarUrl == null) {
    // Found profile but no avatar_url defined
    return null
  }

  const { data: imageBlob, error: downloadError } = await supabase.storage
    .from('avatars')
    .download(avatarUrl)
  if (downloadError) throw downloadError

  return imageBlob
}

export const useProfileImage = (
  userId: string | null
): { loading: boolean; src: string } | null => {
  const { data, error, isValidating } = useSWRImmutable(
    userId,
    downloadProfileImage
  )
  if (error) throw error

  if (!!data) {
    return {
      loading: isValidating,
      src: URL.createObjectURL(data) // 'blob:http://localhost:3000/some-Hexademical-Bits-Here'
    }
  }
  return null
}
