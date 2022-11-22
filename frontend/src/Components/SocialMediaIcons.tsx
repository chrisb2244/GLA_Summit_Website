import {
  mdiTwitter,
  mdiFacebook,
  mdiYoutube,
  mdiInstagram,
  mdiLinkedin
} from '@mdi/js'
import Icon from '@mdi/react'

type SocialLink = {
  label: string
  href: string
  path: string
}

export const SocialMediaIcons: React.FC = () => {
  const sources: SocialLink[] = [
    {
      label: 'Twitter',
      href: 'https://twitter.com/glasummit',
      path: mdiTwitter
    },
    {
      label: 'FaceBook',
      href: 'https://www.facebook.com/GLASummit/',
      path: mdiFacebook
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/c/GlobalLabVIEWArchitects',
      path: mdiYoutube
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/glasummit/',
      path: mdiInstagram
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/glasummit/',
      path: mdiLinkedin
    }
  ]

  const icons = sources.map((s) => {
    return (
      <a aria-label={`${s.label} link`} href={s.href} key={s.label}>
        <Icon path={s.path} size={1} className='mx-1' />
      </a>
    )
  })

  return (
    <div className='flex justify-around md:self-center' role='grid' aria-label='Social Media Links'>
      {icons}
    </div>
  )
}
