import useSWRImmutable from 'swr/immutable';
import type { KeyedMutator } from 'swr';
import { downloadAvatar } from './databaseFunctions';

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

  if (data !== null && typeof data !== 'undefined') {
    return {
      loading: isValidating,
      src: URL.createObjectURL(data), // 'blob:http://localhost:3000/some-Hexademical-Bits-Here'
      mutate
    };
  }
  return null;
};
