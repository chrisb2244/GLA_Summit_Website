import {
  mdiTwitter,
  // mdiFacebook,
  mdiYoutube,
  // mdiInstagram,
  mdiLinkedin
} from '@mdi/js';
import Icon from '@mdi/react';

export const SocialMediaIcons: React.FC = () => {
  const icons = [
    {
      path: mdiTwitter,
      title: 'Twitter link',
      href: 'https://twitter.com/glasummit'
    },
    // {
    //   path: mdiFacebook,
    //   title: 'FaceBook link',
    //   href: 'https://www.facebook.com/GLASummit/'
    // },
    {
      path: mdiYoutube,
      title: 'YouTube link',
      href: 'https://www.youtube.com/@GlobalLabVIEWArchitects'
    },
    // {
    //   path: mdiInstagram,
    //   title: 'Instagram link',
    //   href: 'https://www.instagram.com/glasummit/'
    // },
    {
      path: mdiLinkedin,
      title: 'LinkedIn link',
      href: 'https://www.linkedin.com/company/glasummit/'
    }
  ].map(({ path, title, href }) => {
    return (
      <li key={title}>
        <a aria-label={title} href={href}>
          <Icon path={path} size={0.8} />
        </a>
      </li>
    );
  });

  return (
    <ul
      className='flex list-none justify-around md:self-center'
      aria-label='Social media links'
    >
      {icons}
    </ul>
  );
};
