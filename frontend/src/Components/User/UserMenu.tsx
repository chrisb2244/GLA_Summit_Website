'use client';
import { Popover, Transition } from '@headlessui/react';
import {
  mdiLogout,
  mdiMonitorAccount,
  mdiVoteOutline,
  mdiTicket
} from '@mdi/js';
import { Icon } from '@mdi/react';
import { JSX, PropsWithChildren, Suspense, useEffect, useState } from 'react';
import NextLink from 'next/link';
import {
  downloadIconAvatarAndGenerateIfNeeded,
  type User
} from '@/lib/databaseFunctions';
import type { ProfileModel } from '@/lib/databaseModels';
import { Route } from 'next';
import { DefaultUserIcon, UserIcon } from './UserIcon';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type UserMenuProps = {
  user: User;
  profile: ProfileModel['Row'] | null;
  isOrganizer?: boolean;
  signOut: () => Promise<void>;
};

type UserMenuEntry = {
  title: string;
  href: Route | undefined;
  imgObj: JSX.Element;
  clickFn?: () => void;
};

const ListIcon = ({ path }: { path: string }) => {
  return (
    <div className='inline-flex min-w-[36px] flex-shrink-0 text-black text-opacity-50'>
      <Icon path={path} size={1} />
    </div>
  );
};

export const UserMenu: React.FC<React.PropsWithChildren<UserMenuProps>> = (
  props
) => {
  const { isOrganizer, profile, signOut } = props;

  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    const url = props.profile?.avatar_url;
    if (typeof url === 'undefined' || url === null) {
      return;
    }
    downloadIconAvatarAndGenerateIfNeeded(props.user.id, url, supabase).then(
      (value) => {
        if (value instanceof Blob) {
          setAvatarSrc(URL.createObjectURL(value));
        } else if (value instanceof Error) {
          console.log(value);
        }
      }
    );
  }, [props.profile?.avatar_url, props.user.id]);

  const email = props.user.email;

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
      title: 'My Ticket',
      href: '/ticket',
      imgObj: <ListIcon path={mdiTicket} />
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
                      const item = (
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
                      );

                      return typeof href !== 'undefined' ? (
                        <NextLink href={href} key={title}>
                          {item}
                        </NextLink>
                      ) : (
                        <button key={title}>{item}</button>
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
