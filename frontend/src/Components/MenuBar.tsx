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

export const MenuBar: React.FC<BoxProps> = ({ ...extraBoxProps }) => {
  const menuValues = [
    { title: 'Home', link: '/' },
    { title: 'Presentations', link: '/presentations' },
    // { title: 'Submit a Presentation', link: '/submit-presentation' },
    { title: 'Hopin Event', link: 'https://hopin.com/events/gla-summit-2022' },
    { title: 'Media and Banners', link: '/media' },
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

  const mobileMenuElements = menuValues.map(({ title, link }) => {
    const useLinkComponent = link.startsWith('/')
    const inner = (
      <MenuItem onClick={() => handleCloseNavMenu()}>
        <Typography textAlign='center'>{title}</Typography>
      </MenuItem>
    )
    return useLinkComponent ? (
      <Link href={link} passHref key={title}>
        {inner}
      </Link>
    ) : (
      <a href={link} key={title}>
        {inner}
      </a>
    )
  })

  const desktopMenuElements = menuValues.map(({ title, link }) => {
    const useLinkComponent = link.startsWith('/')
    const button = (
      <Button
        onClick={() => handleCloseNavMenu()}
        role='menuitem'
        color='inherit'
      >
        <Typography textAlign='center'>{title}</Typography>
      </Button>
    )
    return useLinkComponent ? (
      <Box display='flex' mx={1} alignSelf='center' key={title}>
        <Link href={link} passHref key={title}>
          {button}
        </Link>
      </Box>
    ) : (
      <Box display='flex' mx={1} alignSelf='center' key={title}>
        <a href={link}>{button}</a>
      </Box>
    )
  })

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
          {mobileMenuElements}
        </Menu>
      </Box>
      <Box id='desktop-menu' display={{ xs: 'none', md: 'flex' }} {...boxProps}>
        {desktopMenuElements}
      </Box>
    </>
  )
}
