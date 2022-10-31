import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import CopyIcon from '@mui/icons-material/ContentCopy'
import type { Property } from 'csstype'
import React, { useState } from 'react'

type CopyableTextBoxProps = {
  role?: string
  fill?: Property.Color
  children?: React.ReactNode
} & TypographyProps

export const CopyableTextBox: React.FC<React.PropsWithChildren<CopyableTextBoxProps>> = ({
  role,
  fill,
  children,
  ...others
}) => {
  const [displayCopy, setDisplayCopy] = useState(false)
  const [domRect, setDomRect] = useState<DOMRect | null>(null)

  const copyToClipboard = async (text: string) => {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(text)
    } else {
      // Workaround for IE
      return document.execCommand('copy', true, text)
    }
  }

  const onCopyClick = () => {
    let textString: string | undefined = undefined
    if (Array.isArray(children)) {
      textString = children.join('')
    } else {
      textString = children?.valueOf().toString()
    }
    if (typeof textString !== 'undefined') {
      copyToClipboard(textString)
    }
  }

  const onRefLoad = (elem: HTMLButtonElement) => {
    if (elem === null) {
      return
    }
    const newRect = elem.getBoundingClientRect()
    if (
      displayCopy &&
      !elem.hidden &&
      (domRect === null || newRect.x !== domRect.x)
    ) {
      setDomRect(newRect)
    }
  }

  return (
    <Box
      onMouseEnter={() => setDisplayCopy(true)}
      onMouseLeave={() => setDisplayCopy(false)}
      position='relative'
    >
      <Tooltip
        title='Copy'
        PopperProps={{
          anchorEl: {
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
          onClick={onCopyClick}
        >
          <CopyIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Typography {...others} role={role} bgcolor={fill} padding={2.5}>
        {children}
      </Typography>
    </Box>
  )
}
