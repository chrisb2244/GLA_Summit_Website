import type { Route } from 'next';
import { DesktopMenuItems } from './DesktopMenuItems';
import { MobileMenuItems } from './MobileMenuItems';
import {
  CAN_SUBMIT_PRESENTATION,
  currentDisplayYear
} from '@/app/configConstants';

export type MenuElement = {
  title: string;
  link: Route;
  showOnMobile: boolean;
  showOnDesktop: boolean;
};

export const MenuBar = () => {
  const menuElements: MenuElement[] = [
    { title: 'Home', link: '/', showOnMobile: true, showOnDesktop: true },
    {
      title: 'Agenda',
      link: '/full-agenda',
      showOnMobile: true,
      showOnDesktop: true
    },
    ...(CAN_SUBMIT_PRESENTATION
      ? [
          {
            title: 'Submit a Presentation',
            link: '/submit-presentation' as Route,
            showOnMobile: true,
            showOnDesktop: true
          }
        ]
      : []),
    {
      title: 'Presentations',
      link: `/presentation-list/${currentDisplayYear}` as Route,
      showOnMobile: true,
      showOnDesktop: true
    },
    // { title: 'Virtual Venue (Hopin)', link: 'https://hopin.com/events/gla-summit-2022', showOnMobile: true, showOnDesktop: true },
    {
      title: 'Presenters',
      link: `/presenter-list/${currentDisplayYear}` as Route,
      showOnMobile: true,
      showOnDesktop: true
    },
    {
      title: 'Media and Banners',
      link: '/media',
      showOnMobile: true,
      showOnDesktop: true
    },
    {
      title: 'Our Team',
      link: '/our-team',
      showOnMobile: true,
      showOnDesktop: false
    }
  ];

  // Split these components since the "Mobile" version requires interactivity,
  // so must be client-rendered
  return (
    <>
      <div
        className='flex grow content-center md:hidden'
        role='menu'
        id='mobile-menu'
      >
        <MobileMenuItems
          menuElements={menuElements.filter((el) => el.showOnMobile)}
        />
      </div>
      <div
        className='xs:hidden grow self-stretch md:flex'
        role='menu'
        id='desktop-menu'
      >
        <DesktopMenuItems
          menuElements={menuElements.filter((el) => el.showOnDesktop)}
        />
      </div>
    </>
  );
};
