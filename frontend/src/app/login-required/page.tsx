import { StackedBoxes } from '@/Components/Layout/StackedBoxes';
import { mdiAlertCircle } from '@mdi/js';
import Icon from '@mdi/react';
import { Metadata } from 'next';
import { ReactNode } from 'react';

const CenteredParagraph = (props: { children: ReactNode }) => {
  return <p className='text-center'>{props.children}</p>;
};

export const metadata: Metadata = {
  robots: {
    index: false
  }
};

const AccessDeniedPage = () => {
  return (
    <div className='mb-auto flex flex-col'>
      <div className='md:h-8' />
      <StackedBoxes>
        <div className='flex justify-center'>
          <Icon path={mdiAlertCircle} size={2} />
        </div>
        <CenteredParagraph>
          You need to be logged in to access this page.
        </CenteredParagraph>
        <CenteredParagraph>
          If you are logged in and still cannot access this page, contact{' '}
          <a className='link' href='mailto:web@glasummit.org'>
            web@glasummit.org
          </a>
        </CenteredParagraph>
      </StackedBoxes>
    </div>
  );
};

export default AccessDeniedPage;
