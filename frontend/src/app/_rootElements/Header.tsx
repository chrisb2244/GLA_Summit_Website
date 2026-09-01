import Link from 'next/link';
import NextImage from 'next/image';
import { MenuBar } from '@/Components/MenuBar/MenuBar';
import { UserMenuButton } from '../../Components/User/UserMenuButton';
import { Suspense } from 'react';

export const Header = () => {
  const logo = (
    <div className='col-span-full h-full md:col-span-1'>
      <Link href='/' tabIndex={-1}>
        <div className='relative h-full justify-center xs:hidden md:flex'>
          <NextImage
            alt='GLA Logo'
            src='/media/GLA-logo.svg'
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
        <div className='relative h-50 xs:flex md:hidden'>
          <NextImage
            alt='GLA Logo'
            src='/media/GLA-logo-mobile.svg'
            priority
            fill
            sizes='100vw'
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </Link>
    </div>
  );

  return (
    <>
      <header
        className='static flex w-full flex-col bg-primaryc'
      >
        <div
          className='relative grid grid-cols-[1fr_5fr_1fr] grid-rows-1 items-center justify-center'
          id='logo bar'
        >
          {logo}
          <div className='col-start-2 mx-auto text-center text-white xs:hidden md:flex  md:flex-col'>
            <h1 className={`text-h1s font-light`}>GLA Summit</h1>
            <h4 className={`text-h4s font-normal`}>
              {/* 23-24 June 2025, 12:00 UTC */}
              31 Aug 2026 12:00 UTC for 24 hours
            </h4>
          </div>
        </div>
      </header>
      <div className='sticky left-0 top-0 z-50 mb-4 bg-primaryc text-white shadow-[0px_6px_6px_0px_rgba(0,0,0,0.2)]'>
        <div
          id='menu bar'
          className='flex min-h-(--menu-bar-height) grow items-center mx-4 md:mx-2 '
        >
          <MenuBar />
          <Suspense>
            <UserMenuButton />
          </Suspense>
        </div>
      </div>
    </>
  );
};
