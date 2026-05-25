'use client';

import { NextSearchParams } from '@/lib/NextTypes';
import { use, useEffect, useState } from 'react';

const DISMISS_DELAY_MS = 6000;

type NotificationAction = 'draft-saved' | 'draft-submitted';

type SuccessNotificationProps = {
  searchParams: NextSearchParams;
};

const messageMap: Record<NotificationAction, string[]> = {
  'draft-saved': ['Draft saved successfully!'],
  'draft-submitted': [
    'Presentation submitted successfully!',
    "Don't forget to update your bio and profile photo at My Profile — these will be shown in the conference programme."
  ]
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
      className='fixed bottom-24 left-1/2 w-2/3 max-w-screen-md -translate-x-1/2 transform rounded-md border border-green-400 bg-green-50 px-4 py-2 shadow-lg'
      role='status'
      aria-live='polite'
    >
      <div className='text-center text-green-800'>
        {messageMap[action].map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </div>
  );
}
