'use client';
// Needs useClient for the Popover component
import { Popover, Transition } from '@headlessui/react';
import { mdiMenu } from '@mdi/js';
import { Icon } from '@mdi/react';
import NextLink from 'next/link';
import { MenuElement } from './MenuBar';

export const MobileMenuItems = (props: { menuElements: MenuElement[] }) => {
  return (
    <Popover>
      <Popover.Button aria-haspopup aria-label='menu toggle button'>
        <Icon path={mdiMenu} size={1} />
      </Popover.Button>
      <Transition
        enter='transition duration-250 ease-in'
        enterFrom='transform scale-90 opacity-0'
        enterTo='transform scale-100 opacity-100'
        leave='transition duration-150 ease-out'
        leaveFrom='transform scale-100 opacity-100'
        leaveTo='transform scale-90 opacity-0'
      >
        <Popover.Panel className='absolute -left-2 mt-2 rounded bg-white p-2 text-black text-opacity-75 shadow'>
          {({ close }) => (
            <>
              <div className='absolute -top-[6px] left-[14px] h-3 w-3 rotate-45 rounded-none bg-white shadow-none' />
              <div className='w-max max-w-[80vw] cursor-pointer list-none'>
                <ul>
                  {props.menuElements.map(({ title, link }) => {
                    return (
                      <NextLink
                        href={link}
                        key={title}
                        prefetch={false}
                        role='menuitem'
                      >
                        <li className='px-4 py-[6px]' onClick={() => close()}>
                          <p className='prose'>{title}</p>
                        </li>
                      </NextLink>
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
