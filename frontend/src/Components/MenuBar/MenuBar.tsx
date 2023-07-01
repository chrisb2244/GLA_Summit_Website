import { DesktopMenuBar } from './DesktopMenuBar'
import { MobileMenuBar } from './MobileMenuBar'

export const MenuBar = () => {
  const menuElements = [
    { title: 'Home', link: '/' },
    // { title: 'Agenda', link: '/full-agenda' },
    // { title: 'Presentations', link: '/presentations' },
    // { title: 'Submit a Presentation', link: '/submit-presentation' },
    // { title: 'Virtual Venue (Hopin)', link: 'https://hopin.com/events/gla-summit-2022' },
    { title: 'Media and Banners', link: '/media' },
    { title: 'Our Team', link: '/our-team' }
    // { title: 'Presenters', link: '/presenters' }
  ]


  // Split these components since the "Mobile" version requires interactivity,
  // so must be client-rendered
  return (
    <>
      <MobileMenuBar menuElements={menuElements} />
      <DesktopMenuBar menuElements={menuElements} />
    </>
  )
}
