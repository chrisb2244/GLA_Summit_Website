import { SocialMediaIcons } from './SocialMediaIcons';

export const Footer: React.FC<React.PropsWithChildren<unknown>> = () => {
  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...
  return (
    <footer className='App-footer'>
      <div className='flex min-h-[64px] items-center justify-between bg-primaryc px-6 text-white'>
        <div className='mx-auto flex flex-grow flex-col justify-between py-4 text-sm md:flex-row md:py-0'>
          <SocialMediaIcons />
          <FileLink title='Code of Conduct' link='/media/codeofconduct.pdf' />
          <FileLink title='Privacy Policy' link='/media/privacypolicy.pdf' />
          <div className='flex flex-col items-center'>
            <p>
              Contact Us:&nbsp;
              <a href='mailto:contact@glasummit.org' color='#fff'>
                contact@glasummit.org
              </a>
            </p>
            <p>{'\u00A9 2022 GLA Organizers'}</p>
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
