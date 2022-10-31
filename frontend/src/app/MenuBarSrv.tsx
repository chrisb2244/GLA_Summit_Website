'use client';

import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'
import {
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import { useState } from 'react'
import type { MouseEvent } from 'react'
import type { BoxProps } from '@mui/system'

export const MenuBar: React.FC<React.PropsWithChildren<BoxProps>> = ({ ...extraBoxProps }) => {
  console.log("Rendering menubar")
  const menuElements = [
    { title: 'Home', link: '/' },
    // { title: 'Presentations', link: '/presentations' },
    // { title: 'Submit a Presentation', link: '/submit-presentation' },
    // { title: 'Media and Banners', link: '/media' },
    { title: 'Our Team', link: '/our-team' }
    // { title: 'Presenters', link: '/presenters' }
  ]

  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)

  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }
  const handleCloseNavMenu = () => setAnchorElNav(null)

  const boxProps = {
    role: 'menu',
    pl: 1,
    alignContent: 'center',
    ...extraBoxProps
  }

  return (
    <>
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
          {menuElements.map(({ title, link }) => {
            return (
              <Link href={link} passHref key={title} legacyBehavior prefetch={false}>
                <MenuItem onClick={() => handleCloseNavMenu()}>
                  <Typography textAlign='center'>{title}</Typography>
                </MenuItem>
              </Link>
            )
          })}
        </Menu>
      </Box>
      <div id='desktop-menu' className='xs:hidden md:flex pl-1 content-center bg-primaryc text-white' role='menu'>
        {menuElements.map(({ title, link }) => {
          return (
            <Box display='flex' mx={1} alignSelf='center' key={title}>
              <Link href={link} passHref legacyBehavior>
                <Button
                  onClick={() => handleCloseNavMenu()}
                  role='menuitem'
                  color='inherit'
                >
                  <Typography textAlign='center'>{title}</Typography>
                </Button>
              </Link>
            </Box>
          )
        })}
      </div>
    </>
  )
}
