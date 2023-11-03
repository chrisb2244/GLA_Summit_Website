'use client';
import { Popover, Transition } from '@headlessui/react';
import { mdiLogout, mdiMonitorAccount, mdiVoteOutline } from '@mdi/js';
import { Icon } from '@mdi/react';
import React, { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useProfileImage } from '@/lib/profileImage';
import { getProfileInfo, type User } from '@/lib/databaseFunctions';
import type { ProfileModel } from '@/lib/databaseModels';
import { Route } from 'next';
import { DefaultUserIcon, UserIcon } from './UserIcon';
import { useRouter } from 'next/navigation';

type UserMenuProps = {
  user: User;
  isOrganizer?: boolean;
  signOut: () => Promise<void>;
};

type UserMenuEntry = {
  title: string;
  href: Route | undefined;
  imgObj: React.JSX.Element;
  clickFn?: () => void;
};

export const UserMenu: React.FC<React.PropsWithChildren<UserMenuProps>> = (
  props
) => {
  const userId = props.user.id;
  const { isOrganizer, signOut } = props;

  const [profile, setProfile] = useState<ProfileModel['Insert'] | null>(null);
  useEffect(() => {
    getProfileInfo(props.user)
      .then(setProfile)
      .catch((e) => {
        console.log(e);
      });
  }, [props.user]);
  const { src: avatarSrc } = useProfileImage(userId) ?? {};
  // console.log({ avatarSrc, imgLoading })

  const email = props.user.email;
  const ListIcon = (props: { path: string }) => {
    return (
      <div className='inline-flex min-w-[36px] flex-shrink-0 text-black text-opacity-50'>
        <Icon path={props.path} size={1} />
      </div>
    );
  };

  const router = useRouter();

  const menuObjs: UserMenuEntry[] = [
    {
      title: 'My Profile',
      href: '/my-profile',
      imgObj: (
        <div className='flex min-w-[36px] flex-row align-middle'>
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
      clickFn: () => {
        signOut().then(router.refresh);
      }
    }
  ];

  const organizerMenuObjs: UserMenuEntry[] = isOrganizer
    ? [
        {
          title: 'Submission Review',
          href: '/review-submissions',
          imgObj: <ListIcon path={mdiVoteOutline} />
        }
      ]
    : [];

  const WrapperElement: React.FC<
    PropsWithChildren<{ href: Route | undefined }>
  > = ({ href, children }) => {
    if (typeof href !== 'undefined') {
      return <NextLink href={href}>{children}</NextLink>;
    } else {
      return <button>{children}</button>;
    }
  };

  const buttonText = profile
    ? profile.firstname + ' ' + profile.lastname
    : email;

  return (
    <Popover className='pr-4'>
      <Popover.Button aria-haspopup aria-label=''>
        <Suspense fallback={<DefaultUserIcon size='large' text={buttonText} />}>
          <UserIcon src={avatarSrc} size='large' text={buttonText} />
        </Suspense>
      </Popover.Button>
      <Transition
        enter='transition duration-250 ease-in'
        enterFrom='transform scale-90 opacity-0'
        enterTo='transform scale-100 opacity-100'
        leave='transition duration-150 ease-out'
        leaveFrom='transform scale-100 opacity-100'
        leaveTo='transform scale-90 opacity-0'
      >
        <Popover.Panel className='absolute right-0 mt-2 rounded bg-white p-2 text-black text-opacity-75 shadow'>
          {({ close }) => (
            <>
              <div className='absolute -top-[6px] right-4 h-3 w-3 rotate-45 rounded-none bg-white' />
              <div className='relative w-max max-w-[80vw] cursor-pointer list-none'>
                <ul>
                  {menuObjs
                    .concat(organizerMenuObjs)
                    .map(({ title, href, imgObj, clickFn }) => {
                      return (
                        <WrapperElement href={href} key={title}>
                          <li
                            className='flex h-8 flex-row items-center px-4 py-[6px]'
                            onClick={() => {
                              clickFn?.();
                              close();
                            }}
                          >
                            {imgObj}
                            <span className='prose'>{title}</span>
                          </li>
                        </WrapperElement>
                      );
                    })}
                </ul>
              </div>
            </>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
