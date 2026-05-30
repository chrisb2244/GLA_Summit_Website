'use client';

import { useSyncExternalStore } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function SpeedInsightsWrapper() {
  return useSyncExternalStore(
    () => () => {}, // No subscription needed
    () => <SpeedInsights />, // Render the SpeedInsights component on the client
    () => null // Server-side rendering returns null
  );
}
