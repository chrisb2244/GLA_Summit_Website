import { Box, IconButton, Typography } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import CopyIcon from '@mui/icons-material/ContentCopy'
import type { Property } from 'csstype'
import { useState } from 'react'

type CopyableTextBoxProps = {
  role?: string
  fill?: Property.Color
} & TypographyProps

export const CopyableTextBox: React.FC<CopyableTextBoxProps> = ({role, fill, children, ...others}) => {
  const [displayCopy, setDisplayCopy] = useState(false)
  const [displayTooltip, setDisplayTooltip] = useState(false)

  const copyToClipboard = async (text: string) => {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(text)
    } else {
      // Workaround for IE
      return document.execCommand('copy', true, text)
    }
  }

  return (
    <Box
      onMouseEnter={() => setDisplayCopy(true)}
      onMouseLeave={() => setDisplayCopy(false)}
      position='relative'
    >
      <IconButton
        sx={{
          display: displayCopy ? 'block' : 'none',
          position: 'absolute',
          right: 0,
          top: 0
        }}
        aria-label='copy'
        aria-hidden={!displayCopy}
        onMouseEnter={() => setDisplayTooltip(true)}
        onMouseLeave={() => setDisplayTooltip(false)}
        onClick={() => {
          let textString: string | undefined = undefined
          if(Array.isArray(children)) {
            textString = children.join('')
          } else {
            textString = children?.valueOf().toString()
          }
          if (typeof textString !== 'undefined') {
            copyToClipboard(textString)
          }
        }}
      >
        <CopyIcon fontSize='small' />
      </IconButton>
      <Typography {...others} role={role} bgcolor={fill} padding={2.5}>
        {children}
      </Typography>
    </Box>
  )
}
