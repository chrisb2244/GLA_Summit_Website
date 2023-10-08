'use client';

import { IconButton, Tooltip } from '@mui/material';
import CopyIcon from '@mui/icons-material/ContentCopy';
import { useState, ReactNode } from 'react';

export const CopyableTextBox = (props: {
  children: ReactNode;
  copyString: string;
}) => {
  const { children, copyString } = props;
  const [displayCopy, setDisplayCopy] = useState(false);
  const [domRect, setDomRect] = useState<DOMRect | null>(null);

  const copyToClipboard = async (text: string) => {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      // Workaround for IE
      return document.execCommand('copy', true, text);
    }
  };

  const onRefLoad = (elem: HTMLButtonElement) => {
    if (elem === null) {
      return;
    }
    const newRect = elem.getBoundingClientRect();
    if (
      displayCopy &&
      !elem.hidden &&
      (domRect === null || newRect.x !== domRect.x)
    ) {
      setDomRect(newRect);
    }
  };

  const tooltip = (
    <Tooltip
      title='Copy'
      PopperProps={{
        anchorEl: {
          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          getBoundingClientRect: () => domRect!
        }
      }}
    >
      <IconButton
        ref={onRefLoad}
        sx={{
          display: displayCopy ? 'block' : 'none',
          position: 'absolute',
          right: 0,
          top: 0
        }}
        aria-label='copy'
        aria-hidden={!displayCopy}
        onClick={() => {
          copyToClipboard(copyString);
        }}
      >
        <CopyIcon fontSize='small' />
      </IconButton>
    </Tooltip>
  );

  return (
    <div
      onMouseEnter={() => setDisplayCopy(true)}
      onMouseLeave={() => setDisplayCopy(false)}
      className='relative'
    >
      {tooltip}
      {children}
    </div>
  );
};
