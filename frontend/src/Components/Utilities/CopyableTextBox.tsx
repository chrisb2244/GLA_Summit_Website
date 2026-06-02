'use client';

import Icon from '@mdi/react';
import { mdiContentCopy } from '@mdi/js';
import { ReactNode } from 'react';

export const CopyableTextBox = (props: {
  children: ReactNode;
  copyString: string;
}) => {
  const { children, copyString } = props;

  const copyToClipboard = async () => {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(copyString);
    } else {
      // Workaround for IE
      return document.execCommand('copy', true, copyString);
    }
  };

  return (
    <div className='group relative'>
      {/* Revealed on hover, but kept in the tab order and shown on keyboard
          focus (opacity, not visibility/display) so it stays accessible. */}
      <button
        type='button'
        aria-label='copy'
        className='absolute right-4 top-4 cursor-pointer rounded-md p-1 opacity-0 transition-opacity hover:bg-secondaryc hover:bg-opacity-40 focus-visible:opacity-100 group-hover:opacity-100'
        onClick={(ev) => {
          ev.currentTarget.classList.add('animate-wiggle');
          copyToClipboard();
        }}
        onAnimationEnd={(ev) => {
          ev.currentTarget.classList.remove('animate-wiggle');
        }}
      >
        <Icon path={mdiContentCopy} size={1} />
      </button>
      <div>{children}</div>
    </div>
  );
};
