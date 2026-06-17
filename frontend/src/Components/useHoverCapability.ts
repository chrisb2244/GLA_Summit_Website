'use client';
import { useSyncExternalStore } from 'react';

/**
 * Custom hook that detects if the device supports hover (desktop/laptop).
 * Uses useSyncExternalStore to subscribe to window.matchMedia changes.
 * Safe for SSR environments.
 *
 * @returns true if the device supports hover, false for touch devices or server
 */
export function useHoverCapability(): boolean {
  return useSyncExternalStore(
    subscribeToHoverCapability,
    getHoverCapabilitySnapshot,
    getHoverCapabilityServerSnapshot
  );
}

/**
 * Subscribe to the matchMedia query to detect hover capability changes.
 * Returns an unsubscribe function for cleanup.
 */
function subscribeToHoverCapability(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  try {
    const mediaQuery = window.matchMedia('(hover: hover)');
    mediaQuery.addEventListener('change', onStoreChange);
    return () => mediaQuery.removeEventListener('change', onStoreChange);
  } catch {
    return () => {};
  }
}

/**
 * Get the current snapshot of hover capability (client-side).
 */
function getHoverCapabilitySnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.matchMedia('(hover: hover)').matches;
  } catch {
    return false;
  }
}

/**
 * Get the server snapshot of hover capability (for SSR/hydration).
 * Always returns false to be safe on the server.
 */
function getHoverCapabilityServerSnapshot(): boolean {
  return false;
}
