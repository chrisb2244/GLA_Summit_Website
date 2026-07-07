'use client';
import { Popover, Transition } from '@headlessui/react';
import {
  mdiLogout,
  mdiMonitorAccount,
  mdiVoteOutline,
  mdiTicket
} from '@mdi/js';
import { Icon } from '@mdi/react';
import { JSX, Suspense } from 'react';
import Link from 'next/link';
import { getAvatarPublicUrl, type User } from '@/lib/databaseFunctions';
import type { ProfileModel } from '@/lib/databaseModels';
import { Route } from 'next';
import { DefaultUserIcon, UserIcon } from './UserIcon';
import { useRouter } from 'next/navigation';
import { fullUrlToIconUrl } from '@/lib/utils';

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
    <div className='inline-flex min-w-9 shrink-0 text-black/50 group-hover:text-white'>
      <Icon path={path} size={1} />
    </div>
  );
};

export const UserMenu: React.FC<React.PropsWithChildren<UserMenuProps>> = (
  props
) => {
  const { isOrganizer, profile, signOut } = props;

  const iconPath = props.profile?.avatar_url
    ? fullUrlToIconUrl(props.profile.avatar_url)
    : null;
  const avatarSrc = getAvatarPublicUrl(iconPath) ?? undefined;

  const email = props.user.email;

  const router = useRouter();

  const menuObjs: UserMenuEntry[] = [
    {
      title: 'My Profile',
      href: '/my-profile',
      imgObj: (
        <div className='flex min-w-9 flex-row align-middle'>
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
    <Popover className='relative flex self-stretch'>
      <Popover.Button
        aria-haspopup
        aria-label='User menu'
        className='flex h-full items-center justify-center px-3 hover:bg-secondaryc'
      >
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
        <Popover.Panel className='absolute right-0 top-full mt-2 rounded-sm bg-white p-2 text-black/75 shadow'>
          {({ close }) => (
            <>
              <div className='absolute -top-1.5 right-4 h-3 w-3 rotate-45 rounded-none bg-white' />
              <div className='relative w-max max-w-[80vw] cursor-pointer list-none'>
                <ul>
                  {menuObjs
                    .concat(organizerMenuObjs)
                    .map(({ title, href, imgObj, clickFn }) => {
                      const className =
                        'group flex h-8 w-full flex-row items-center px-4 py-1.5 transition-transform hover:bg-secondaryc active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100';
                      const itemContent = (
                        <span className='flex w-full flex-row items-center text-left'>
                          {imgObj}
                          <span className='prose group-hover:text-white'>
                            {title}
                          </span>
                        </span>
                      );

                      return (
                        <li key={title}>
                          {typeof href !== 'undefined' ? (
                            <Link
                              href={href}
                              className={className}
                              onClick={() => close()}
                            >
                              {itemContent}
                            </Link>
                          ) : (
                            <button
                              type='button'
                              className={className}
                              onClick={() => {
                                clickFn?.();
                                close();
                              }}
                            >
                              {itemContent}
                            </button>
                          )}
                        </li>
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
