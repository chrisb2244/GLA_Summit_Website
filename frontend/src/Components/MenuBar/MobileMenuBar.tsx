'use client'
// Needs useClient for the Popover component
import { Popover, Transition } from '@headlessui/react'
import { mdiMenu } from '@mdi/js'
import { Icon } from '@mdi/react'
import NextLink from 'next/link'

export const MobileMenuBar = (props: {
  menuElements: Array<{ title: string; link: string }>
}) => {
  return (
    <div
      className='xs:flex md:hidden flex-grow pl-4 content-center'
      role='menu'
      id='mobile-menu'
    >
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
          <Popover.Panel className='absolute rounded shadow bg-white text-black text-opacity-75 mt-2 -left-2'>
            {({ close }) => (
              <>
              <div className='rotate-45 rounded-none shadow-none w-3 h-3 absolute -top-[6px] left-[14px] bg-white' />
              <div className='list-none cursor-pointer w-max max-w-[80vw]'>
                {props.menuElements.map(({ title, link }) => {
                  return (
                    <NextLink href={link} key={title} prefetch={false}>
                      <li className='py-[6px] px-4' onClick={() => close()}>
                        <p className='tracking-[0.00938em]'>{title}</p>
                      </li>
                    </NextLink>
                  )
                })}
              </div>
              </>
            )}
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  )
}
