import type { Route } from 'next';
import { DesktopMenuItems } from './DesktopMenuItems';
import { MobileMenuItems } from './MobileMenuItems';

export type MenuElement = {
  title: string;
  link: Route;
};

export const MenuBar = () => {
  const menuElements: MenuElement[] = [
    // { title: 'Home', link: '/' },
    // { title: 'Agenda', link: '/full-agenda' },
    // { title: 'Presentations', link: '/presentations' }
    // { title: 'Submit a Presentation', link: '/submit-presentation' },
    // { title: 'Virtual Venue (Hopin)', link: 'https://hopin.com/events/gla-summit-2022' },
    // { title: 'Media and Banners', link: '/media' },
    // { title: 'Our Team', link: '/our-team' }
    // { title: 'Presenters', link: '/presenters' }
  ];

  // Split these components since the "Mobile" version requires interactivity,
  // so must be client-rendered
  return (
    <>
      <div
        className='flex flex-grow content-center pl-4 md:hidden'
        role='menu'
        id='mobile-menu'
      >
        <MobileMenuItems menuElements={menuElements} />
      </div>
      <div
        className='flex-grow content-center pl-2 xs:hidden md:flex'
        role='menu'
        id='desktop-menu'
      >
        <DesktopMenuItems menuElements={menuElements} />
      </div>
    </>
  );
};
