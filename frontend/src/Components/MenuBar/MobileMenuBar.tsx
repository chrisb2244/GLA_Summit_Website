'use client'
// Needs useClient for the Popover component
import { Popover } from '@headlessui/react'
import { mdiMenu } from '@mdi/js'
import { Icon } from '@mdi/react'
import NextLink from 'next/link'

export const MobileMenuBar = (props: {
  menuElements: Array<{ title: string; link: string }>
}) => {
  return (
    <div
      className='xs:flex md:hidden flex-grow pl-2 content-center'
      role='menu'
      id='mobile-menu'
    >
      <Popover>
        <Popover.Button aria-haspopup aria-label='menu toggle button'>
          <Icon path={mdiMenu} size={1} />
        </Popover.Button>
        <Popover.Panel className='absolute overflow-hidden rounded shadow bg-white text-black text-opacity-75'>
          {({ close }) => (
            <div className='list-none cursor-pointer'>
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
          )}
        </Popover.Panel>
      </Popover>
    </div>
  )
}
