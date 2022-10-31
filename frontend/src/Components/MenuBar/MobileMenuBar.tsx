'use client'
// Needs useState for dropdown box

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Typography, Box, IconButton, Menu, MenuItem } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import NextLink from 'next/link'

export const MobileMenuBar = (props: {
  menuElements: Array<{ title: string; link: string }>
}) => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)

  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }
  const handleCloseNavMenu = () => setAnchorElNav(null)

  const boxProps = {
    role: 'menu',
    pl: 1,
    alignContent: 'center',
    flexGrow: 1
  }

  return (
    <Box id='mobile-menu' display={{ xs: 'flex', md: 'none' }} {...boxProps}>
      <IconButton
        aria-haspopup
        aria-controls='menu-appbar'
        aria-label='menu toggle button'
        onClick={handleOpenNavMenu}
        color='inherit'
        size='large'
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id='menu-appbar'
        anchorEl={anchorElNav}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        keepMounted
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {props.menuElements.map(({ title, link }) => {
          return (
            <NextLink
              href={link}
              passHref
              key={title}
              legacyBehavior
              prefetch={false}
            >
              <MenuItem onClick={() => handleCloseNavMenu()}>
                <Typography textAlign='center'>{title}</Typography>
              </MenuItem>
            </NextLink>
          )
        })}
      </Menu>
    </Box>
  )
}
