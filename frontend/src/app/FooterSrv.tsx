import { SocialMediaIcons } from '@/Components/SocialMediaIcons'

export const Footer: React.FC<React.PropsWithChildren<unknown>> = () => {
  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...
  return (
    <footer className='App-footer'>
      <div className='justify-between text-white bg-primaryc items-center flex justify-between min-h-[64px] px-6'>
        <div className='flex flex-col md:flex-row flex-grow justify-between mx-auto py-4 md:py-0 text-sm'>
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
  )
}

const FileLink = (props: { link: string; title: string }): JSX.Element => {
  const text = (
    <p className='py-[0.8px] md:py-0 self-center underline'>{props.title}</p>
  )

  if (props.link !== '') {
    return (
      <a href={props.link} color='#fff' style={{ alignSelf: 'center' }}>
        {text}
      </a>
    )
  } else {
    return text
  }
}
