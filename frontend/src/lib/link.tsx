import NextLink from 'next/link'
import { Link as MuiLink } from '@mui/material'
import type { LinkProps as MuiLinkProps } from '@mui/material'

export type LinkProps = MuiLinkProps

export const Link: React.FC<{ href: string } & LinkProps> = ({
  href,
  children,
  ...linkProps
}) => {
  return (
    <NextLink href={href} passHref>
      <MuiLink {...linkProps}>{children}</MuiLink>
    </NextLink>
  )
}
