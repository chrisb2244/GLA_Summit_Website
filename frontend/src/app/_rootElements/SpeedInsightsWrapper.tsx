'use client';

import { useSyncExternalStore } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Stable across renders so useSyncExternalStore doesn't resubscribe.
const emptySubscribe = () => () => {};

export function SpeedInsightsWrapper() {
  // Returns a stable boolean snapshot: false during SSR/prerender, true once
  // hydrated on the client. Keeping the snapshot a primitive avoids the
  // "getSnapshot should be cached" infinite render loop that returning a new
  // React element each call would trigger.
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false // server snapshot
  );

  // Render SpeedInsights only on the client so the server render stays null and
  // the page isn't deopted into client-side rendering at build time.
  return isClient ? <SpeedInsights /> : null;
}
