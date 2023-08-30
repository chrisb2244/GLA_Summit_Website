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
    <div className='h-full col-span-full md:col-span-1'>
      <NextLink href='/' tabIndex={-1}>
        <div className='xs:hidden md:flex justify-center h-full relative'>
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
        <div className='xs:flex md:hidden h-[200px] relative'>
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
        className='static flex flex-col w-full bg-primaryc'
        style={{
          boxShadow:
            'rgb(0 0 0 / 20%) 0px 2px 4px -1px, rgb(0 0 0 / 14%) 0px 4px 5px 0px, rgb(0 0 0 / 12%) 0px 1px 10px 0px'
        }}
      >
        <div
          className='justify-center relative items-center grid grid-rows-1 grid-cols-[1fr_5fr_1fr]'
          id='logo bar'
        >
          {logo}
          <div className='mx-auto xs:hidden md:flex md:flex-col text-center col-start-2  text-white'>
            <h1 className={`text-h1s font-light`}>GLA Summit</h1>
            <h4 className={`text-h4s font-normal`}>
              14-15 November, 12:00 UTC
            </h4>
          </div>
        </div>
      </header>
      <div className='sticky top-0 left-0 z-50 mb-4 bg-primaryc text-white'>
        <div
          id='menu bar'
          className='w-full min-h-[54px] items-center flex'
          style={{
            boxShadow:
              'rgb(0 0 0 / 20%) 0px 4px 6px 0px, rgb(0 0 0 / 14%) 0px 4px 5px 0px'
          }}
        >
          <MenuBar />
          <Suspense fallback={null}>
            <UserIcon />
          </Suspense>
        </div>
      </div>
    </>
  )
}
