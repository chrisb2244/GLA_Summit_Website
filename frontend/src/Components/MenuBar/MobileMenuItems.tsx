'use client';
// Needs useClient for the Popover component
import { Popover, Transition } from '@headlessui/react';
import { mdiMenu } from '@mdi/js';
import { Icon } from '@mdi/react';
import Link from 'next/link';
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
        <Popover.Panel className='absolute -left-2 mt-2 rounded-sm bg-white p-2 text-black/75 shadow'>
          {({ close }) => (
            <>
              <div className='absolute top-[-6px] left-[14px] h-3 w-3 rotate-45 rounded-none bg-white shadow-none' />
              <div className='w-max max-w-[80vw] cursor-pointer list-none'>
                <ul>
                  {props.menuElements.map(({ title, link }) => {
                    return (
                      <li key={title}>
                        <Link
                          href={link}
                          prefetch={false}
                          role='menuitem'
                          onClick={() => close()}
                          className='group block px-4 py-[6px] transition-transform hover:bg-secondaryc active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100'
                        >
                          <span className='prose group-hover:text-white'>{title}</span>
                        </Link>
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
