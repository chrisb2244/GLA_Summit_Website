import { DesktopMenuBar } from '@/Components/MenuBar/DesktopMenuBar'
import { MobileMenuBar } from '@/Components/MenuBar/MobileMenuBar'

export const MenuBar = () => {
  console.log('Rendering menubar')
  const menuElements = [
    { title: 'Home', link: '/' },
    // { title: 'Presentations', link: '/presentations' },
    // { title: 'Submit a Presentation', link: '/submit-presentation' },
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
