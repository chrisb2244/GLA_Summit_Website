import { SocialMediaIcons } from './SocialMediaIcons';
import Link from 'next/link';

export const Footer: React.FC<React.PropsWithChildren<unknown>> = () => {
  const thisYear = new Date().getFullYear();

  return (
    <footer className='App-footer'>
      <div className='flex min-h-[64px] items-center justify-between bg-primaryc px-6 text-white'>
        <div className='mx-auto flex flex-grow flex-col justify-between py-4 text-sm md:flex-row md:py-0'>
          <SocialMediaIcons />
          <div className='flex self-center py-[0.8px] underline md:py-0'>
            <Link prefetch={false} href='/our-team' className='self-center'>
              About Us
            </Link>
          </div>
          <div className='flex self-center py-[0.8px] underline md:py-0'>
            <Link prefetch={false} href='/media' className='self-center'>
              Media Banners
            </Link>
          </div>
          <FileLink title='Code of Conduct' link='/media/codeofconduct.pdf' />
          <FileLink title='Privacy Policy' link='/media/privacypolicy.pdf' />
          <div className='flex flex-col items-center'>
            <p>
              Contact Us:&nbsp;
              <a href='mailto:contact@glasummit.org' color='#fff'>
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
    <p className='self-center py-[0.8px] underline md:py-0'>{props.title}</p>
  );

  if (props.link !== '') {
    return (
      <a href={props.link} color='#fff' style={{ alignSelf: 'center' }}>
        {text}
      </a>
    );
  } else {
    return text;
  }
};
