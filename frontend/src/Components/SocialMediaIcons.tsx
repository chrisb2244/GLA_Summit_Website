import { mdiTwitter, mdiFacebook, mdiYoutube, mdiInstagram, mdiLinkedin } from '@mdi/js'
import Icon from '@mdi/react'

export const SocialMediaIcons: React.FC = () => {
  const icons = [
    {path: mdiTwitter, title: 'Twitter link', href: 'https://twitter.com/glasummit'},
    {path: mdiFacebook, title: 'FaceBook link', href: 'https://www.facebook.com/GLASummit/'},
    {path: mdiYoutube, title: 'YouTube link', href: 'https://www.youtube.com/channel/UCtQvJ5rMGYoq8n7ExvITVNA'},
    {path: mdiInstagram, title: 'Instagram link', href: 'https://www.instagram.com/glasummit/'},
    {path: mdiLinkedin, title: 'LinkedIn link', href: 'https://www.linkedin.com/company/glasummit/'},
  ].map(({path, title, href}) => {
    return (
      <a aria-label={title} href={href} key={title}>
        <Icon path={path} size={0.8} />
      </a>
    )
  })

  return (
    <div
      className='flex justify-around md:self-center [&_a]:px-1'
      role='grid'
      aria-label='Social Media Links'
    >
      {icons}
    </div>
  )
}
