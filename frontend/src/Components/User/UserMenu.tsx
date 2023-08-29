'use client'
import { Popover, Transition } from '@headlessui/react'
import { mdiLogout, mdiMonitorAccount } from '@mdi/js'
import { Icon } from '@mdi/react'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useProfileImage } from '@/lib/profileImage'
import { getProfileInfo, type User } from '@/lib/databaseFunctions'
import type { ProfileModel } from '@/lib/databaseModels'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Route } from 'next'

type UserMenuProps = {
  user: User
}

type UserMenuEntry = {
  title: string
  href: Route | undefined
  imgObj: React.JSX.Element
  clickFn?: () => void
}

export const UserMenu: React.FC<React.PropsWithChildren<UserMenuProps>> = (
  props
) => {
  // const { isOrganizer, signOut, profile } = useSession()
  const isOrganizer = false
  const router = useRouter()

  const userId = props.user.id
  const [profile, setProfile] = useState<ProfileModel['Insert'] | null>(null)
  useEffect(() => {
    console.log(`Fetching profile info for ${props.user.id}`)
    getProfileInfo(props.user)
      .then(setProfile)
      .catch((e) => {
        console.log(e)
      })
  }, [props.user])
  const { src: avatarSrc, loading: imgLoading } = useProfileImage(userId) ?? {}
  console.log({ avatarSrc, imgLoading })

  const signOut = async () => {
    await createClientComponentClient().auth.signOut()
    router.refresh()
  }

  const email = props.user.email
  const UserIcon = (
    props: { src?: string; size: 'large' | 'small' } = { size: 'large' }
  ) => {
    const { src, size } = props
    return src ? (
      <img
        src={src}
        className={`${
          size === 'large' ? 'w-12 h-12' : 'w-6 h-6'
        } object-cover rounded-full inline-flex`}
        alt='User Profile Icon'
      />
    ) : (
      <span>
        {profile ? profile.firstname + ' ' + profile.lastname : email}
      </span>
    )
  }

  const ListIcon = (props: { path: string }) => {
    return (
      <div className='min-w-[36px] text-black text-opacity-50 inline-flex flex-shrink-0'>
        <Icon path={props.path} size={1} />
      </div>
    )
  }

  const menuObjs: UserMenuEntry[] = [
    {
      title: 'My Profile',
      href: '/my-profile',
      imgObj: (
        <div className='min-w-[36px]'>
          <UserIcon src={avatarSrc} size='small' />
        </div>
      )
    },
    {
      title: 'My Presentations',
      href: '/my-presentations',
      imgObj: <ListIcon path={mdiMonitorAccount} />
    },
    {
      title: 'Logout',
      href: undefined, // '/api/logout',
      imgObj: <ListIcon path={mdiLogout} />,
      clickFn: signOut
    }
  ]

  const WrapperElement: React.FC<
    PropsWithChildren<{ href: Route | undefined }>
  > = ({ href, children }) => {
    if (typeof href !== 'undefined') {
      return <NextLink href={href}>{children}</NextLink>
    } else {
      return <div>{children}</div>
    }
  }

  return (
    <>
      {/* <Tooltip title='Account Settings'>
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
      </Tooltip> */}
      {/* <Menu
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
        {isOrganizer && (
          <MenuItemLink href=''>Yay, I&apos;m an organizer...</MenuItemLink>
        )}

      
      </Menu> */}
      <Popover className='pr-4'>
        <Popover.Button aria-haspopup aria-label=''>
          <UserIcon src={avatarSrc} size='large' />
        </Popover.Button>
        <Transition
          enter='transition duration-250 ease-in'
          enterFrom='transform scale-90 opacity-0'
          enterTo='transform scale-100 opacity-100'
          leave='transition duration-150 ease-out'
          leaveFrom='transform scale-100 opacity-100'
          leaveTo='transform scale-90 opacity-0'
        >
          <Popover.Panel className='absolute right-0 mt-2 p-2 rounded shadow bg-white text-black text-opacity-75'>
            {({ close }) => (
              <>
                <div className='rotate-45 rounded-none w-3 h-3 absolute -top-[6px] right-4 bg-white' />
                <div className='list-none cursor-pointer w-max max-w-[80vw] relative'>
                  <ul>
                    {menuObjs.map(({ title, href, imgObj, clickFn }) => {
                      return (
                        <WrapperElement href={href} key={title}>
                          <li
                            className='py-[6px] px-4 flex flex-row h-8'
                            onClick={() => {
                              clickFn?.()
                              close()
                            }}
                          >
                            {imgObj}
                            <p className='tracking-[0.00938em]'>{title}</p>
                          </li>
                        </WrapperElement>
                      )
                    })}
                  </ul>
                </div>
              </>
            )}
          </Popover.Panel>
        </Transition>
      </Popover>
    </>
  )
}
