'use client'
import {
  Avatar,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material'
import {
  Logout as LogoutIcon,
  CoPresentOutlined as PresentationsIcon
} from '@mui/icons-material'
import React, { useState } from 'react'
import NextLink from 'next/link'
import { useSession } from '@/lib/sessionContext'
import { useProfileImage } from '@/lib/profileImage'
import type { User } from '@/lib/databaseFunctions'

type UserMenuProps = {
  user: User
}

export const UserMenu: React.FC<React.PropsWithChildren<UserMenuProps>> = (props) => {
  // Tools to handle clicking on and off the Avatar
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const handleClick = (ev: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(ev.currentTarget)
  }
  const handleClose = (): void => setAnchorEl(null)

  const { isOrganizer, signOut, profile } = useSession()
  const userId = profile ? profile.id : null
  const avatarSrc = useProfileImage(userId)?.src

  const userAvatar = (
    <Avatar sx={{ width: 48, height: 48 }} src={avatarSrc}>
      {profile ? profile.firstname + ' ' + profile.lastname : props.user?.email}
    </Avatar>
  )

  const MenuItemLink = (props: {
    href: string
    children?: React.ReactNode
  }) => {
    return (
      <MenuItem component={NextLink} href={props.href}>
        {props.children}
      </MenuItem>
    )
  }

  return (
    <>
      <Tooltip title='Account Settings'>
        <IconButton
          onClick={handleClick}
          size='small'
          sx={{ ml: 2 }}
          aria-haspopup='true'
          aria-controls={open ? 'account-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
        >
          {userAvatar}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id='account-menu'
        open={open}
        onClick={handleClose}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItemLink href='/my-profile'>
          {userAvatar}
          My Profile
        </MenuItemLink>
        {isOrganizer && (
          <MenuItemLink href=''>
            Yay, I&apos;m an organizer...
          </MenuItemLink>
        )}
        <MenuItemLink href='/my-presentations'>
          <>
            <ListItemIcon>
              <PresentationsIcon />
            </ListItemIcon>
            My Presentations
          </>
        </MenuItemLink>
        <MenuItem
          onClick={() => {
            void signOut()
          }}
          component={NextLink}
          href='/'
        >
          <ListItemIcon>
            <LogoutIcon fontSize='small' />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  )
}
