import useSWRImmutable from 'swr/immutable';
import type { KeyedMutator } from 'swr';
import type { ScopedMutator } from 'swr/dist/_internal';
import { downloadAvatar, uploadAvatar } from './databaseFunctions';

export const uploadProfileImage = async (
  remoteFilePath: string,
  localFile: File,
  userId: string,
  mutate: ScopedMutator,
  originalProfileURL: string | null
) => {
  await uploadAvatar(
    remoteFilePath,
    localFile,
    userId,
    originalProfileURL
  ).then(() => {
    mutate(userId);
  });
};

export const useProfileImage = (
  userId: string | null
): {
  loading: boolean;
  src: string;
  mutate: KeyedMutator<Blob | null>;
} | null => {
  const { data, error, isValidating, mutate } = useSWRImmutable(
    userId,
    downloadAvatar
  );
  if (error) throw error;

  if (!!data) {
    return {
      loading: isValidating,
      src: URL.createObjectURL(data), // 'blob:http://localhost:3000/some-Hexademical-Bits-Here'
      mutate
    };
  }
  return null;
};
