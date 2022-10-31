import type { TypographyProps } from "@mui/material"
import { Typography } from "@mui/material"

export const SmallCenteredText: React.FC<React.PropsWithChildren<TypographyProps>> = ({
  children,
  ...typographyProps
}) => {
  return (
    <Typography
      variant='body2'
      fontSize='small'
      align='center'
      {...typographyProps}
    >
      {children}
    </Typography>
  )
}