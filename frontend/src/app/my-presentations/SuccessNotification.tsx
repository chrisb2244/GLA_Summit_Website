'use client';

import { NextSearchParams } from '@/lib/NextTypes';
import { use, useEffect, useState } from 'react';

const DISMISS_DELAY_MS = 4000;

type NotificationAction = 'draft-saved' | 'draft-submitted';

type SuccessNotificationProps = {
  searchParams: NextSearchParams;
};

const messageMap: Record<NotificationAction, string> = {
  'draft-saved': 'Draft saved successfully!',
  'draft-submitted':
    "Presentation submitted successfully! Don't forget to update your bio and profile photo at My Profile — these will be shown in the conference programme."
};

export function SuccessNotification({
  searchParams
}: SuccessNotificationProps) {
  const resolvedParams = use(searchParams);
  const action = resolvedParams?.action as
    | 'draft-saved'
    | 'draft-submitted'
    | undefined;

  const [isVisible, setIsVisible] = useState(!!action);

  useEffect(() => {
    if (!action) return;

    // Clean up URL query param after component mounts to prevent re-showing on refresh
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/my-presentations');
    }

    // Auto-dismiss after delay
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, DISMISS_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [action]);

  if (!isVisible || !action) {
    return null;
  }

  return (
    <div
      className='fixed right-4 top-4 max-w-sm rounded-md border border-green-400 bg-green-50 p-4 shadow-lg'
      role='status'
      aria-live='polite'
    >
      <p className='text-green-800'>{messageMap[action]}</p>
    </div>
  );
}
