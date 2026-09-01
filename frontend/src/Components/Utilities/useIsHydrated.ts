'use client';

import { useSyncExternalStore } from 'react';

/** The value never changes after the first client render, so nothing to watch. */
const neverChanges = () => () => {};

/**
 * When doing Server-Side Rendering, the result will always be false.
 * When doing Client-Side Rendering, the result will always be false on the
 * first render and true from then on.
 */
export const useIsHydrated = () =>
  useSyncExternalStore(
    neverChanges,
    () => true,
    () => false
  );
