import { PageIntro } from '@/Components/Typography';
import { YearNav } from '@/Components/YearNav';
import NextLink from 'next/link';
import React from 'react';

const PresentationListLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const agendaElem = (
    <>
      <p>
        For a list by schedule, see our{' '}
        <NextLink href='/full-agenda' className='link'>
          agenda
        </NextLink>
        .
      </p>
    </>
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
      {/* {agendaElem} */}

      <YearNav basePath='/presentation-list' />
      <div className='shadow'>{children}</div>
    </div>
  );
};

export default PresentationListLayout;
