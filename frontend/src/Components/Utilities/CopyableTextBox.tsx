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
      <div
        className='invisible absolute right-4 top-4 hover:cursor-pointer hover:rounded-md hover:bg-secondaryc hover:bg-opacity-40 hover:p-1 group-hover:visible'
        onClick={(ev) => {
          ev.currentTarget.classList.add('animate-wiggle');
          copyToClipboard();
        }}
        onAnimationEnd={(ev) => {
          ev.currentTarget.classList.remove('animate-wiggle');
        }}
      >
        <Icon path={mdiContentCopy} size={1} />
      </div>
      <div className=''>{children}</div>
    </div>
  );
};
