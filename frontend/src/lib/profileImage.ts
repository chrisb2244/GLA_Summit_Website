import useSWRImmutable from 'swr/immutable';
import type { KeyedMutator } from 'swr';
import { useEffect, useMemo } from 'react';
import { downloadAvatar } from './databaseFunctions';

type ProfileImage = {
  loading: boolean;
  /** Object URL for the avatar blob, or null when the user has no avatar. */
  src: string | null;
  mutate: KeyedMutator<Blob | null>;
};

/**
 * Loads the signed-in user's avatar as an object URL.
 *
 * Always returns the hook result even when there is no avatar yet.
 * This ensures mutate is valid for the caller.
 *
 * The object URL is derived once per blob and revoked when it is replaced, so
 * re-rendering retains the existing URL.
 */
export const useProfileImage = (userId: string | null): ProfileImage => {
  const { data, error, isValidating, mutate } = useSWRImmutable(
    userId,
    downloadAvatar
  );

  const src = useMemo(
    () => (data == null ? null : URL.createObjectURL(data)),
    [data]
  );

  useEffect(() => {
    if (src == null) {
      return;
    }
    return () => URL.revokeObjectURL(src);
  }, [src]);

  if (error) throw error;

  return { loading: isValidating, src, mutate };
};
