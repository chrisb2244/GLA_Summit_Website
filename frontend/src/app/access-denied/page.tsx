import { StackedBoxes } from '@/Components/Layout/StackedBoxes';
import { mdiAlertCircle } from '@mdi/js';
import Icon from '@mdi/react';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: {
    index: false
  }
};

const AccessDeniedPage = () => {
  const T = (props: { children: ReactNode }) => {
    return <p className='text-center'>{props.children}</p>;
  };

  return (
    <div className='mb-auto flex flex-col'>
      <div className='md:h-8' />
      <StackedBoxes>
        <div className='flex justify-center'>
          <Icon path={mdiAlertCircle} size={2} />
        </div>
        <T>You do not have access to this page.</T>
        <T>
          If you believe you should have access, please check you are signed in,
          and with the correct account.
        </T>
        <T>
          If you still cannot access this page, contact{' '}
          <a className='link' href='mailto:web@glasummit.org'>
            web@glasummit.org
          </a>
        </T>
      </StackedBoxes>
    </div>
  );
};

export default AccessDeniedPage;
