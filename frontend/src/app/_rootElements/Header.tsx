import NextLink from 'next/link'
import NextImage from 'next/image'
import { MenuBar } from '@/Components/MenuBar/MenuBar'
import { UserIcon } from './UserIcon'
import { Suspense } from 'react'

export const Header = () => {
  const imageProps = {
    'aria-label': 'logo'
  }
  const logo = (
    <div className='col-span-full h-full md:col-span-1'>
      <NextLink href='/' tabIndex={-1}>
        <div className='relative h-full justify-center xs:hidden md:flex'>
          <NextImage
            alt='GLA Logo'
            src='/media/GLA-logo.svg'
            {...imageProps}
            fill
            priority
            sizes='16vw'
            style={{
              pointerEvents: 'none',
              paddingTop: '16px',
              paddingBottom: '8px',
              paddingLeft: '8px'
            }}
          />
        </div>
        <div className='relative h-[200px] xs:flex md:hidden'>
          <NextImage
            alt='GLA Logo'
            src='/media/GLA-logo-mobile.svg'
            priority
            fill
            sizes='100vw'
            {...imageProps}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </NextLink>
    </div>
  )

  return (
    <>
      <header
        className='static flex w-full flex-col bg-primaryc'
        style={{
          boxShadow:
            'rgb(0 0 0 / 20%) 0px 2px 4px -1px, rgb(0 0 0 / 14%) 0px 4px 5px 0px, rgb(0 0 0 / 12%) 0px 1px 10px 0px'
        }}
      >
        <div
          className='relative grid grid-cols-[1fr_5fr_1fr] grid-rows-1 items-center justify-center'
          id='logo bar'
        >
          {logo}
          <div className='col-start-2 mx-auto text-center text-white xs:hidden md:flex  md:flex-col'>
            <h1 className={`text-h1s font-light`}>GLA Summit</h1>
            <h4 className={`text-h4s font-normal`}>
              14-15 November, 12:00 UTC
            </h4>
          </div>
        </div>
      </header>
      <div className='sticky left-0 top-0 z-50 mb-4 bg-primaryc text-white'>
        <div
          id='menu bar'
          className='flex min-h-[54px] w-full items-center'
          style={{
            boxShadow:
              'rgb(0 0 0 / 20%) 0px 4px 6px 0px, rgb(0 0 0 / 14%) 0px 4px 5px 0px'
          }}
        >
          <MenuBar />
          <UserIcon />
        </div>
      </div>
    </>
  )
}
