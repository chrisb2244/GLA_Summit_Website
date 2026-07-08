import { SocialMediaIcons } from './SocialMediaIcons';
import { JSX } from 'react';
import Link from 'next/link';
import { cacheLife } from 'next/cache';

export const Footer = async () => {
  'use cache';
  cacheLife('weeks');

  const thisYear = new Date().getFullYear();

  return (
    <footer className='App-footer'>
      <div className='flex min-h-[64px] items-center justify-between bg-primaryc px-6 text-white'>
        <div className='mx-auto flex grow flex-col justify-between py-4 text-sm md:flex-row md:py-0'>
          <SocialMediaIcons />
          <div className='flex self-center py-[0.8px] md:py-0'>
            <Link
              prefetch={false}
              href='/our-team'
              className='link-on-dark self-center'
            >
              About Us
            </Link>
          </div>
          <div className='flex self-center py-[0.8px] md:py-0'>
            <Link
              prefetch={false}
              href='/media'
              className='link-on-dark self-center'
            >
              Media Banners
            </Link>
          </div>
          <FileLink title='Code of Conduct' link='/media/codeofconduct.pdf' />
          <FileLink title='Privacy Policy' link='/media/privacypolicy.pdf' />
          <div className='flex flex-col items-center'>
            <p>
              Contact Us:&nbsp;
              <a href='mailto:contact@glasummit.org'>
                contact@glasummit.org
              </a>
            </p>
            <p>{`\u00A9 2022-${thisYear} GLA Organizers`}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FileLink = (props: { link: string; title: string }): JSX.Element => {
  const text = (
    <p className='self-center py-[0.8px] md:py-0'>{props.title}</p>
  );

  if (props.link !== '') {
    return (
      <a
        href={props.link}
        className='link-on-dark'
        style={{ alignSelf: 'center' }}
      >
        {text}
      </a>
    );
  } else {
    return text;
  }
};
