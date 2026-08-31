import { PageIntro } from '@/Components/Typography';
import { YearNav } from '@/Components/YearNav';
import Link from 'next/link';
import React from 'react';

const PresentationListLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const agendaElem = (
    <p className='mx-4 mb-2'>
      For a list by schedule, see our{' '}
      <Link href='/full-agenda' className='link'>
        agenda
      </Link>
      .
    </p>
  );

  // const agendaElem = (
  //   <p>
  //     Our presentations for 2024 are currently being scheduled. Check back soon
  //     to find out when your favorite presentations will be happening!
  //   </p>
  // );

  return (
    <div>
      <PageIntro>
        Presentations below are grouped by year, and sorted by the first
        speaker&apos;s name.
      </PageIntro>
      {agendaElem}

      <YearNav basePath='/presentation-list' />
      <div className='shadow'>{children}</div>
    </div>
  );
};

export default PresentationListLayout;
