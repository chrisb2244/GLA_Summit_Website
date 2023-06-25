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
        <Popover.Button
          aria-haspopup
          aria-label='menu toggle button'
        >
          <Icon path={mdiMenu} size={1} />
        </Popover.Button>
        <Popover.Panel
          className='absolute overflow-hidden rounded bg-white text-black text-opacity-75'
          style={{
            boxShadow:
              '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)'
          }}
        >
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
